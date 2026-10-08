#!/usr/bin/env bash
# Строгий режим: прерывать выполнение при любой ошибке, ошибке в конвейере или использовании необъявленных переменных
set -eo pipefail

# ==============================================================================
# 1. ИНИЦИАЛИЗАЦИЯ ПЕРЕМЕННЫХ
# ==============================================================================
# Определяем абсолютный путь к директории, где лежит этот скрипт
ROOT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
WEB_DIR="$ROOT_DIR/web_rep/v1"
UNIT_NAME="butovsky-site.service"
UNIT_PATH="/etc/systemd/system/$UNIT_NAME"

# Функция для красивого вывода ошибки и завершения работы
fail() { 
  printf '\n❌ Ошибка: %s\n' "$1" >&2
  printf '💡 Подсказка: Проверьте права доступа, наличие файлов и версию Node.js.\n\n' >&2
  exit 1 
}

# ==============================================================================
# 2. ПРОВЕРКА ПРАВ ДОСТУПА (БЕЗОПАСНОСТЬ)
# ==============================================================================
if [ "$(id -u)" -eq 0 ]; then
  # Если скрипт запущен через sudo, переменная SUDO_USER содержит имя исходного пользователя
  if [ -n "$SUDO_USER" ]; then
    printf '⚠️  Обнаружен запуск через sudo. Для безопасности переключаемся на пользователя "%s"...\n' "$SUDO_USER"
    # Перезапускаем скрипт от имени обычного пользователя, сохраняя текущую директорию
    exec su - "$SUDO_USER" -c "cd '$ROOT_DIR' && bash start.sh"
  else
    # Если мы действительно залогинены как root, блокируем выполнение
    fail "Запуск веб-сервера от имени root запрещён из соображений безопасности!
Пожалуйста, выполните следующие действия:
  1. Создайте обычного пользователя (если его нет): adduser myuser
  2. Добавьте его в группу sudo: usermod -aG sudo myuser
  3. Переключитесь на него: su - myuser
  4. Переместите проект в доступную ему папку (например, /home/myuser/project)
  5. Запустите скрипт БЕЗ sudo: bash start.sh"
  fi
fi

# ==============================================================================
# 3. ПРОВЕРКА И НАСТРОЙКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
# ==============================================================================
# Устанавливаем значения по умолчанию, если переменные не заданы
PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"
SITE_URL="${SITE_URL:-http://butovsky.duckdns.org:$PORT}"

# Валидация PORT (только числа от 1 до 65535)
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
  fail "PORT должен быть целым числом от 1 до 65535. Текущее значение: $PORT"
fi

# Валидация HOST (только буквы, цифры, точки, двоеточия и дефисы)
if [[ "$HOST" =~ [^A-Za-z0-9.:-] ]]; then
  fail "HOST содержит недопустимые символы. Разрешены только буквы, цифры, точки, двоеточия и дефисы."
fi

# Проверка пути на наличие пробелов (systemd плохо работает с путями, содержащими пробелы)
if [[ "$ROOT_DIR" =~ [[:space:]] ]]; then
  fail "Путь к репозитору не должен содержать пробелов: '$ROOT_DIR'"
fi

# ==============================================================================
# 4. ПРОВЕРКА НАЛИЧИЯ ФАЙЛОВ ПРОЕКТА
# ==============================================================================
if [ ! -f "$ROOT_DIR/server.js" ] || [ ! -f "$WEB_DIR/package.json" ] || [ ! -f "$WEB_DIR/package-lock.json" ]; then
  fail "Не найдены обязательные файлы (server.js или package.json). Убедитесь, что вы запускаете скрипт из корня репозитория Butovsky."
fi

# Если зависимости не установлены, запускаем вспомогательный скрипт
if [ ! -d "$WEB_DIR/node_modules" ]; then
  printf '📦 Зависимости не найдены. Запускаем library.sh для установки...\n'
  bash "$ROOT_DIR/library.sh"
fi

# ==============================================================================
# 5. ПРОВЕРКА ВЕРСИИ NODE.JS
# ==============================================================================
# Функция для получения мажорной версии Node.js из переданного пути
get_node_major() {
  "$1" -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null || printf '0\n'
}

# Функция поиска подходящего исполняемого файла Node.js (версия 22+)
find_node() {
  local candidate major
  
  # Проверяем node из текущего PATH
  candidate="$(command -v node 2>/dev/null || true)"
  if [ -n "$candidate" ]; then
    major="$(get_node_major "$candidate")"
    if [[ "$major" =~ ^[0-9]+$ ]] && [ "$major" -ge 22 ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  fi
  
  # Проверяем стандартный путь /usr/bin/node
  candidate="/usr/bin/node"
  if [ -x "$candidate" ]; then
    major="$(get_node_major "$candidate")"
    if [[ "$major" =~ ^[0-9]+$ ]] && [ "$major" -ge 22 ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  fi
  
  return 1
}

NODE_BIN="$(find_node || true)"
if [ -z "$NODE_BIN" ]; then 
  fail "Требуется Node.js версии 22 или выше. Сначала выполните: bash library.sh" 
fi

if [[ "$NODE_BIN" =~ [[:space:]] ]]; then
  fail "Путь к исполняемому файлу Node.js не должен содержать пробелы: '$NODE_BIN'"
fi

# Обновляем PATH, чтобы использовать найденную версию Node.js
PATH="$(dirname "$NODE_BIN"):$PATH"
export PATH

# Проверка наличия необходимых системных утилит
command -v npm >/dev/null 2>&1 || fail "Не найден npm для $NODE_BIN. Выполните: bash library.sh"
command -v systemctl >/dev/null 2>&1 || fail "Система не поддерживает systemd (systemctl), который необходим для автозапуска."
command -v sudo >/dev/null 2>&1 || fail "Не найден sudo. Он необходим для регистрации сервиса."

# Тихая проверка прав sudo (чтобы запросить пароль сейчас, а не в середине выполнения)
sudo -v

# ==============================================================================
# 6. СБОРКА ПРОЕКТА
# ==============================================================================
printf '\n🔨 Сборка production-версии сайта из web_rep/v1...\n'
# Используем legacy-провайдер OpenSSL, если он требуется для совместимости старых пакетов
NODE_OPTIONS="${NODE_OPTIONS:-} --openssl-legacy-provider" npm run build --prefix "$WEB_DIR"

# ==============================================================================
# 7. СОЗДАНИЕ И УСТАНОВКА SYSTEMD-СЕРВИСА
# ==============================================================================
SERVICE_USER="$(id -un)" # Имя текущего (уже обычного!) пользователя
UNIT_TMP="$(mktemp)"
# Гарантируем удаление временного файла при завершении скрипта (даже при ошибке)
trap 'rm -f "$UNIT_TMP"' EXIT

# Генерируем конфигурацию сервиса
cat > "$UNIT_TMP" <<EOF
[Unit]
Description=Butovsky website
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$ROOT_DIR
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=HOST=$HOST
ExecStart=$NODE_BIN $ROOT_DIR/server.js
Restart=always
RestartSec=5
# Дополнительные меры безопасности
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only

[Install]
WantedBy=multi-user.target
EOF

# Вспомогательная функция для выполнения команд от имени root
run_root() {
  if [ "$(id -u)" -eq 0 ]; then 
    "$@"
  else 
    sudo "$@"
  fi
}

printf '\n⚙️  Регистрация systemd-сервиса (потребуются права sudo)...\n'
run_root install -o root -g root -m 0644 "$UNIT_TMP" "$UNIT_PATH"
run_root systemctl daemon-reload
run_root systemctl enable "$UNIT_NAME"

if run_root systemctl is-active --quiet "$UNIT_NAME"; then
  run_root systemctl restart "$UNIT_NAME"
else
  run_root systemctl start "$UNIT_NAME"
fi

# ==============================================================================
# 8. ПРОВЕРКА РАБОТОСПОСОБНОСТИ (HEALTH CHECK)
# ==============================================================================
printf '⏳ Ожидание запуска сервиса и проверка здоровья...'
HEALTHY=0
for attempt in $(seq 1 20); do
  printf '.'
  # Делаем локальный HTTP-запрос к серверу для проверки
  if PORT="$PORT" "$NODE_BIN" -e '
    const http = require("http");
    const req = http.get({host:"127.0.0.1", port:Number(process.env.PORT), path:"/"}, res => {
      res.resume();
      if(res.statusCode !== 200) process.exitCode = 1;
    });
    req.on("error", () => { process.exitCode = 1; });
    req.setTimeout(2000, () => { req.destroy(); process.exitCode = 1; });
  ' >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 1
done
printf '\n'

if [ "$HEALTHY" -ne 1 ]; then
  printf '\n❌ Сервис запустился, но не отвечает на HTTP-запросы.\n'
  run_root systemctl --no-pager --full status "$UNIT_NAME" || true
  fail "Проверьте логи команды: sudo journalctl -u $UNIT_NAME -n 100 --no-pager"
fi

# ==============================================================================
# 9. УСПЕШНОЕ ЗАВЕРШЕНИЕ
# ==============================================================================
printf '\n✅ Успешно! Сайт Butovsky запущен и работает.\n'
printf '🌐 URL: %s\n' "$SITE_URL"
printf '⚙️  Сервис: %s (включен для автозапуска после перезагрузки)\n' "$UNIT_NAME"
printf '📊 Статус: sudo systemctl status %s\n' "$UNIT_NAME"
printf '📝 Логи:   sudo journalctl -u %s -f\n' "$UNIT_NAME"
printf '\n⚠️  Важно: Домен должен указывать на IP этого сервера, а входящий TCP-порт %s должен быть открыт в брандмауэре.\n' "$PORT"