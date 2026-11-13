#!/usr/bin/env bash

# Isolated launcher for this site. It never installs packages or manages
# containers outside this uniquely named Docker Compose project.
set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
ENV_FILE="$SCRIPT_DIR/.deploy.env"

if ! command -v docker >/dev/null 2>&1; then
    echo "Ошибка: Docker не установлен. Установите Docker Engine и Compose v2 вручную, затем повторите запуск."
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo "Ошибка: не найден плагин Docker Compose v2. Установите его вручную."
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "Ошибка: Docker daemon недоступен для текущего пользователя."
    echo "Запустите Docker и убедитесь, что у пользователя есть доступ к Docker socket."
    exit 1
fi

# A stable name derived from this exact directory prevents Compose from
# adopting another project's containers, networks, or volumes.
PROJECT_HASH="$(printf '%s' "$SCRIPT_DIR" | cksum | awk '{print $1}')"
PROJECT_NAME="butovsky-site-$PROJECT_HASH"
COMPOSE=(docker compose --project-directory "$SCRIPT_DIR" -f "$SCRIPT_DIR/docker-compose.yml" -p "$PROJECT_NAME")
if [[ -f "$ENV_FILE" ]]; then
    COMPOSE+=(--env-file "$ENV_FILE")
fi

case "${1:-start}" in
    start) ;;
    status)
        "${COMPOSE[@]}" ps
        exit 0
        ;;
    logs)
        "${COMPOSE[@]}" logs --tail=100
        exit 0
        ;;
    stop)
        "${COMPOSE[@]}" stop
        echo "Остановлены только контейнеры этого проекта; сертификаты и тома сохранены."
        exit 0
        ;;
    *)
        echo "Использование: bash start.sh [start|status|logs|stop]"
        exit 2
        ;;
esac

if ! command -v ss >/dev/null 2>&1; then
    echo "Ошибка: не найдена команда ss (обычно входит в iproute2)."
    echo "Она нужна, чтобы проверить порты 80/8443 и не задеть другие сайты."
    exit 1
fi

container_is_running() {
    local service="$1"
    local container_id
    container_id="$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null || true)"
    [[ -n "$container_id" ]] &&
        [[ "$(docker inspect --format '{{.State.Running}}' "$container_id" 2>/dev/null || true)" == "true" ]]
}

container_is_healthy() {
    local service="$1"
    local container_id
    container_id="$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null || true)"
    [[ -n "$container_id" ]] &&
        [[ "$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id" 2>/dev/null || true)" == "healthy" ]]
}

if [[ -L "$ENV_FILE" ]]; then
    echo "Ошибка: $ENV_FILE является символической ссылкой. Для безопасности замените её обычным файлом."
    exit 1
fi
if [[ -e "$ENV_FILE" && ! -f "$ENV_FILE" ]]; then
    echo "Ошибка: $ENV_FILE существует, но не является обычным файлом."
    exit 1
fi

DOMAIN=""
if [[ -f "$ENV_FILE" ]]; then
    DOMAIN="$(awk -F= '$1 == "DOMAIN" { sub(/^[^=]*=/, ""); print; exit }' "$ENV_FILE")"
fi

if [[ -z "$DOMAIN" ]]; then
    read -r -p "Введите домен сайта (например, example.com): " DOMAIN
fi

DOMAIN="${DOMAIN,,}"
if [[ ${#DOMAIN} -gt 253 ]] ||
   [[ ! "$DOMAIN" =~ ^[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$ ]]; then
    echo "Ошибка: укажите корректный домен без схемы, пути и подстановочных символов."
    exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
    ENV_FILE_TMP="$ENV_FILE.tmp.$$"
    awk -v domain="$DOMAIN" '
        BEGIN { written = 0 }
        /^DOMAIN=/ {
            if (!written) {
                print "DOMAIN=" domain
                written = 1
            }
            next
        }
        { print }
        END {
            if (!written) print "DOMAIN=" domain
        }
    ' "$ENV_FILE" > "$ENV_FILE_TMP"
    mv -- "$ENV_FILE_TMP" "$ENV_FILE"
else
    printf 'DOMAIN=%s\n' "$DOMAIN" > "$ENV_FILE"
fi

# Pass the validated domain to Compose on both first and subsequent runs.
COMPOSE=(docker compose --project-directory "$SCRIPT_DIR" -f "$SCRIPT_DIR/docker-compose.yml" -p "$PROJECT_NAME" --env-file "$ENV_FILE")

echo "Проверяю, что домен разрешается через DNS..."
if command -v getent >/dev/null 2>&1 && ! getent ahosts "$DOMAIN" >/dev/null 2>&1; then
    echo "Ошибка: DNS-запись домена пока не находится."
    echo "Настройте A/AAAA-запись на адрес этого сервера и повторите запуск."
    exit 1
fi

# If this project's Caddy is already running, it already owns these ports.
# Otherwise, refuse to start if another host process or Docker container uses
# port 80 (ACME HTTP challenge) or 8443 (public HTTPS). Port 443 is never used.
if ! container_is_running caddy; then
    for port in 80 8443; do
        if docker ps --filter "publish=$port" --format '{{.ID}}' | grep -q .; then
            echo "Ошибка: порт $port уже опубликован другим Docker-контейнером."
            echo "Скрипт остановлен; чужие контейнеры и сайты не менялись."
            exit 1
        fi
        if ss -H -ltn "sport = :$port" 2>/dev/null | grep -q .; then
            echo "Ошибка: TCP-порт $port уже занят на сервере."
            echo "Скрипт остановлен; существующий сайт или служба не менялись."
            exit 1
        fi
    done
fi

echo "Запускаю только контейнеры этого сайта..."
if ! "${COMPOSE[@]}" up -d --build; then
    echo "Не удалось запустить проект. Другие контейнеры и сайты скрипт не останавливает и не перенастраивает."
    exit 1
fi

READY=false
for ((attempt = 1; attempt <= 30; attempt++)); do
    if container_is_running caddy && container_is_healthy web; then
        READY=true
        break
    fi
    sleep 1
done

if [[ "$READY" != true ]]; then
    echo "Контейнеры не прошли проверку готовности. Последние логи этого проекта:"
    "${COMPOSE[@]}" logs --no-color --tail=30 caddy web || true
    exit 1
fi

echo
echo "Контейнеры сайта запущены: https://$DOMAIN:8443"
echo "Caddy получает и обновляет сертификат Let's Encrypt через HTTP-порт 80; порт 443 не используется."
echo "DNS домена должен указывать на этот сервер, а входящие TCP-порты 80 и 8443 должны быть доступны из интернета."
