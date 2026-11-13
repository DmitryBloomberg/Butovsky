#!/bin/sh

echo "🚀 Начинаем настройку Express сервера..."

# 1. Проверка наличия Node.js и npm
if ! command -v node &> /dev/null; then
    echo "❌ Ошибка: Node.js не найден. Пожалуйста, установите Node.js."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Ошибка: npm не найден."
    exit 1
fi

# 2. Инициализация проекта
if [ ! -f package.json ]; then
    echo "📦 Инициализация package.json..."
    npm init -y
else
    echo "ℹ️ package.json уже существует."
fi

# 3. Установка основных библиотек (Production)
echo "📥 Установка основных библиотек..."
npm install express dotenv cors helmet morgan

# 4. Установка библиотек для разработки (Development)
echo "🛠 Установка библиотек для разработки..."
npm install --save-dev nodemon

# 5. Настройка скриптов запуска
echo "⚙️ Настройка скриптов в package.json..."
npm pkg set scripts.start="node server.js"
npm pkg set scripts.dev="nodemon server.js"

# 6. Создание базового шаблона сервера
if [ ! -f server.js ]; then
    echo "📝 Создание server.js..."
    cat <<EOF > server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (Обработчики)
app.use(helmet()); // Защита HTTP-заголовков
app.use(cors());   // Разрешение кросс-доменных запросов
app.use(morgan('dev')); // Логирование запросов в консоль
app.use(express.json()); // Парсинг JSON
app.use(express.urlencoded({ extended: true })); // Парсинг form-data

// Базовый маршрут
app.get('/', (req, res) => {
    res.send('✅ Сервер Express успешно запущен и работает!');
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(\`🚀 Сервер запущен на порту: http://localhost:\${PORT}\`);
});
EOF
else
    echo "ℹ️ server.js уже существует, пропускаем создание."
fi

# 7. Создание .env файла
if [ ! -f .env ]; then
    echo "🔐 Создание .env файла..."
    echo "PORT=3000" > .env
    echo "NODE_ENV=development" >> .env
fi

# 8. Настройка .gitignore
if [ ! -f .gitignore ]; then
    echo "🙈 Создание .gitignore..."
    echo "node_modules/" > .gitignore
    echo ".env" >> .gitignore
    echo "npm-debug.log*" >> .gitignore
fi

echo ""
echo "✅ ✅ ✅ Установка успешно завершена! ✅ ✅ ✅"
echo ""
echo "📌 Полезные команды:"
echo "  • npm run dev  - Запуск сервера с автоперезагрузкой (для разработки)"
echo "  • npm start    - Запуск сервера (для продакшена)"
echo ""