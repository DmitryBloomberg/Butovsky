#!/bin/bash

# Цвета для красивого вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Сброс цвета

DOMAIN="butovsky.duckdns.org"
EMAIL="your-email@example.com" # ⚠️ ЗАМЕНИТЕ на ваш реальный email для уведомлений Let's Encrypt

echo -e "${YELLOW}🚀 Начало настройки сервера...${NC}"

# ==========================================
# 1. Установка системных зависимостей
# ==========================================
echo -e "${YELLOW}📦 Обновление системы и установка пакетов (Nginx, Certbot, Node.js)...${NC}"
sudo apt update
sudo apt install -y curl nginx certbot python3-certbot-nginx

# Установка Node.js 20.x (если не установлен)
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⬇️ Установка Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Установка PM2 (менеджер процессов для Node.js)
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⬇️ Установка PM2...${NC}"
    sudo npm install -g pm2
fi

# ==========================================
# 2. Установка зависимостей проекта и сборка
# ==========================================
echo -e "${YELLOW}📦 Установка npm-зависимостей проекта...${NC}"
npm install

echo -e "${YELLOW}🔨 Сборка React-приложения (npm run build)...${NC}"
npm run build

# ==========================================
# 3. Настройка Nginx как обратного прокси
# ==========================================
echo -e "${YELLOW}⚙️ Настройка Nginx для проксирования запросов на Node.js...${NC}"
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Проксирование всех запросов на Node.js сервер (порт 3000)
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

# Активация конфигурации и проверка
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# ==========================================
# 4. Получение SSL-сертификата (HTTPS)
# ==========================================
echo -e "${YELLOW}🔒 Запрос SSL-сертификата для $DOMAIN...${NC}"
echo -e "${RED}❗ Убедитесь, что домен $DOMAIN уже указывает на IP этого сервера в DuckDNS!${NC}"

sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSL-сертификат успешно получен и настроен!${NC}"
else
    echo -e "${RED}❌ Ошибка при получении SSL-сертификата. Проверьте DNS-записи DuckDNS и порт 80.${NC}"
    exit 1
fi

# ==========================================
# 5. Настройка автозапуска через PM2
# ==========================================
echo -e "${YELLOW}⚙️ Настройка автозапуска сервера (чтобы работал после перезагрузки)...${NC}"

# Останавливаем старый процесс, если он был
pm2 delete "react-server" 2>/dev/null || true

# Запускаем основной сервер
pm2 start main_service.js --name "react-server"

# Сохраняем список процессов
pm2 save

# Настраиваем автозапуск PM2 при старте системы (от имени текущего пользователя)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
sudo pm2 save

# ==========================================
# 6. Финальное сообщение
# ==========================================
echo -e "${GREEN}=======================================================${NC}"
echo -e "${GREEN}🎉 Настройка завершена успешно!${NC}"
echo -e "${GREEN}🌐 Ваш сайт доступен по адресу: https://$DOMAIN${NC}"
echo -e "${GREEN}🔄 Сервер автоматически запускается при перезагрузке ОС.${NC}"
echo -e "${GREEN}📊 Полезные команды:${NC}"
echo -e "   • Посмотреть статус: ${YELLOW}pm2 status${NC}"
echo -e "   • Посмотреть логи:   ${YELLOW}pm2 logs react-server${NC}"
echo -e "   • Перезапустить:     ${YELLOW}pm2 restart react-server${NC}"
echo -e "${GREEN}=======================================================${NC}"