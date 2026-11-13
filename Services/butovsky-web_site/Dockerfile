# ./Services/butovsky-web_site/Dockerfile

# Используем легкий и актуальный образ Node.js
FROM node:20-alpine

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app/Services/butovsky-web_site

# Копируем package.json и устанавливаем ТОЛЬКО production-зависимости
COPY package*.json ./
RUN npm install --production

# Копируем сам скрипт и папку build в контейнер
COPY butovsky-web-site.js ./
COPY build ./build

# Указываем порт, который будет использовать приложение
EXPOSE 3000

# Команда для запуска
CMD ["node", "butovsky-web-site.js"]