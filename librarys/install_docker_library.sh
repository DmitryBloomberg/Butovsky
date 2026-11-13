#!/bin/bash

# ============================================================
# Скрипт установки Docker и зависимостей
# Безопасная версия: не трогает существующую установку
# Поддерживает: Ubuntu, Debian, CentOS, RHEL, Fedora, Arch
# ============================================================

set -e

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Ошибка: этот скрипт нужно запускать с правами root (sudo)${NC}"
    exit 1
fi

REAL_USER="${SUDO_USER:-$USER}"

echo -e "${GREEN}🐳 Проверка и настройка Docker...${NC}"
echo -e "${YELLOW}👤 Пользователь: ${REAL_USER}${NC}"

# ============================================================
# Определение ОС
# ============================================================
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_ID=$ID
else
    echo -e "${RED}❌ Не удалось определить операционную систему${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 ОС: ${OS_ID}${NC}"

# ============================================================
# Проверка: установлен ли уже Docker?
# ============================================================
DOCKER_ALREADY_INSTALLED=false

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version 2>/dev/null || echo "неизвестно")
    echo -e "${GREEN}✅ Docker уже установлен: ${DOCKER_VERSION}${NC}"
    DOCKER_ALREADY_INSTALLED=true

    # Проверяем, что Docker работает
    if docker info > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker daemon работает${NC}"
    else
        echo -e "${YELLOW}⚠️ Docker установлен, но daemon не отвечает${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️ Docker не найден — будет выполнена установка${NC}"
fi

# ============================================================
# Функции установки (вызываются только если Docker НЕ установлен)
# ============================================================
install_ubuntu_debian() {
    apt-get update
    apt-get install -y \
        ca-certificates curl gnupg lsb-release \
        apt-transport-https software-properties-common

    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/${OS_ID}/gpg | \
        gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${OS_ID} \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update
    apt-get install -y \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
}

install_centos_rhel() {
    yum install -y yum-utils curl ca-certificates
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
}

install_fedora() {
    dnf install -y dnf-plugins-core curl ca-certificates
    dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
    dnf install -y \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
}

install_arch() {
    pacman -Sy --noconfirm docker docker-compose docker-buildx containerd
}

# ============================================================
# Установка (только если Docker отсутствует)
# ============================================================
if [ "$DOCKER_ALREADY_INSTALLED" = false ]; then
    echo -e "${GREEN}📦 Установка Docker...${NC}"
    case "$OS_ID" in
        ubuntu|debian|linuxmint|pop) install_ubuntu_debian ;;
        centos|rhel|almalinux|rocky) install_centos_rhel ;;
        fedora) install_fedora ;;
        arch|manjaro) install_arch ;;
        *)
            echo -e "${RED}❌ ОС ${OS_ID} не поддерживается${NC}"
            exit 1
            ;;
    esac

    # Запуск и автозагрузка (только для свежей установки)
    if command -v systemctl &> /dev/null; then
        systemctl start docker
        systemctl enable docker
        echo -e "${GREEN}✅ Docker запущен и добавлен в автозагрузку${NC}"
    fi
else
    # ============================================================
    # Docker уже установлен — доустанавливаем только недостающие плагины
    # ============================================================
    echo -e "${YELLOW}🔍 Проверка наличия плагинов...${NC}"

    NEED_INSTALL=()

    case "$OS_ID" in
        ubuntu|debian|linuxmint|pop)
            if ! dpkg -l | grep -q docker-compose-plugin; then
                NEED_INSTALL+=(docker-compose-plugin)
            fi
            if ! dpkg -l | grep -q docker-buildx-plugin; then
                NEED_INSTALL+=(docker-buildx-plugin)
            fi
            ;;
        centos|rhel|almalinux|rocky|fedora)
            if ! rpm -q docker-compose-plugin &> /dev/null; then
                NEED_INSTALL+=(docker-compose-plugin)
            fi
            if ! rpm -q docker-buildx-plugin &> /dev/null; then
                NEED_INSTALL+=(docker-buildx-plugin)
            fi
            ;;
        arch|manjaro)
            if ! pacman -Q docker-compose &> /dev/null; then
                NEED_INSTALL+=(docker-compose)
            fi
            if ! pacman -Q docker-buildx &> /dev/null; then
                NEED_INSTALL+=(docker-buildx)
            fi
            ;;
    esac

    if [ ${#NEED_INSTALL[@]} -gt 0 ]; then
        echo -e "${YELLOW}📥 Доустановка недостающих компонентов: ${NEED_INSTALL[*]}${NC}"
        case "$OS_ID" in
            ubuntu|debian|linuxmint|pop)
                apt-get install -y "${NEED_INSTALL[@]}"
                ;;
            centos|rhel|almalinux|rocky)
                yum install -y "${NEED_INSTALL[@]}"
                ;;
            fedora)
                dnf install -y "${NEED_INSTALL[@]}"
                ;;
            arch|manjaro)
                pacman -Sy --noconfirm "${NEED_INSTALL[@]}"
                ;;
        esac
    else
        echo -e "${GREEN}✅ Все необходимые плагины уже установлены${NC}"
    fi
fi

# ============================================================
# Добавление пользователя в группу docker (безопасно)
# ============================================================
echo -e "${GREEN}👥 Проверка группы docker для пользователя ${REAL_USER}...${NC}"
if ! getent group docker > /dev/null; then
    groupadd docker
fi

if id -nG "$REAL_USER" | grep -qw docker; then
    echo -e "${GREEN}✅ Пользователь ${REAL_USER} уже в группе docker${NC}"
else
    usermod -aG docker "$REAL_USER"
    echo -e "${GREEN}✅ Пользователь ${REAL_USER} добавлен в группу docker${NC}"
fi

# ============================================================
# Итоговая проверка (без тестовых контейнеров)
# ============================================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Проверка завершена успешно!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

echo -e "${YELLOW}📌 Установленные компоненты:${NC}"
docker --version
docker compose version 2>/dev/null || docker-compose --version 2>/dev/null || echo "  ⚠️ docker-compose не найден"
docker buildx version 2>/dev/null || echo "  ⚠️ docker-buildx не найден"
echo ""

echo -e "${YELLOW}📊 Статус Docker daemon:${NC}"
if systemctl is-active --quiet docker 2>/dev/null; then
    echo -e "${GREEN}  ✅ Docker daemon запущен${NC}"
else
    echo -e "${YELLOW}  ⚠️ Docker daemon не запущен (или systemctl недоступен)${NC}"
fi
echo ""

echo -e "${GREEN}📌 Полезные команды:${NC}"
echo "  • docker ps                 — список запущенных контейнеров"
echo "  • docker compose up -d      — запуск проекта"
echo "  • docker compose down       — остановка проекта"
echo "  • docker images             — список образов"
echo "  • docker system prune       — очистка неиспользуемых данных"
echo ""

if ! id -nG "$REAL_USER" | grep -qw docker; then
    echo -e "${YELLOW}⚠️ Чтобы docker работал без sudo, выполните:${NC}"
    echo -e "${YELLOW}   newgrp docker${NC}"
    echo -e "${YELLOW}   или перелогиньтесь в системе${NC}"
    echo ""
fi