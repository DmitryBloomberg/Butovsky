#!/bin/bash

# Цвета для красивого вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Сброс цвета

DOMAIN="butovsky.duckdns.org"
EMAIL="dimonvip486@gmail.com" # ⚠️ ЗАМЕНИТЕ на ваш реальный email!

echo -e "${YELLOW}🚀 Начало настройки сервера...${NC}"

# ==========================================
# 1. Установка Node.js и npm (ПРАВИЛЬНО)
# ==========================================
echo -e "${YELLOW}📦 Установка Node.js 20.x...${NC}"

# Проверяем, установлен ли уже node
if ! command -v node &> /dev/null; then
    # Скачиваем и устанавливаем NodeSource setup
    curl -fsSL https://deb.nodesource.com/setup_20.x -o nodesource_setup.sh
    sudo bash nodesource_setup.sh
    sudo apt-get install -y nodejs
    
    # Удаляем временный файл
    rm nodesource_setup.sh
else
    echo -e "${GREEN}✅ Node.js уже установлен${NC}"
fi

# Проверяем установку
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Ошибка: npm не установлен${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js версии: $(node -v)${NC}"
echo -e "${GREEN}✅ npm версии: $(npm -v)${NC}"

# ==========================================
# 2. Установка системных зависимостей
# ==========================================
echo -e "${YELLOW}📦 Установка Nginx и Certbot...${NC}"
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Установка PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⬇️ Установка PM2...${NC}"
    sudo npm install -g pm2
fi

# ==========================================
# 3. Установка зависимостей проекта и сборка
# ==========================================
echo -e "${YELLOW}📦 Установка npm-зависимостей проекта...${NC}"
npm install

echo -e "${YELLOW}🔨 Сборка React-приложения (npm run build)...${NC}"
npm run build

# ==========================================
# 4. Настройка Nginx как обратного прокси
# ==========================================
echo -e "${YELLOW}⚙️ Настройка Nginx для проксирования запросов на Node.js...${NC}"

# Создаем конфигурацию Nginx
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Активация конфигурации
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# ==========================================
# 5. Получение SSL-сертификата (HTTPS)
# ==========================================
echo -e "${YELLOW}🔒 Запрос SSL-сертификата для $DOMAIN...${NC}"
echo -e "${RED}❗ Убедитесь, что домен $DOMAIN указывает на IP этого сервера!${NC}"
echo -e "${YELLOW}Ваш текущий IP: $(curl -s ifconfig.me)${NC}"

sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL-сертификат успешно получен!${NC}"
else
    echo -e "${RED}❌ Ошибка при получении SSL-сертификата${NC}"
    echo -e "${YELLOW}Проверьте:${NC}"
    echo -e "  1. Домен $DOMAIN указывает на правильный IP в DuckDNS"
    echo -e "  2. Порт 80 открыт (sudo ufw allow 'Nginx Full')"
    exit 1
fi

# ==========================================
# 6. Настройка автозапуска через PM2
# ==========================================
echo -e "${YELLOW}️ Настройка автозапуска сервера...${NC}"

pm2 delete "react-server" 2>/dev/null || true
pm2 start main_service.js --name "react-server"
pm2 save

# Настраиваем автозапуск PM2 при старте системы
pm2 startup systemd -u $USER --hp $HOME | tail -1 | bash

echo -e "${GREEN}=======================================================${NC}"
echo -e "${GREEN}🎉 Настройка завершена успешно!${NC}"
echo -e "${GREEN}🌐 Ваш сайт: https://$DOMAIN${NC}"
echo -e "${GREEN}📊 Команды управления:${NC}"
echo -e "   • Статус: ${YELLOW}pm2 status${NC}"
echo -e "   • Логи:   ${YELLOW}pm2 logs react-server${NC}"
echo -e "   • Рестарт:${YELLOW}pm2 restart react-server${NC}"
echo -e "${GREEN}=======================================================${NC}"