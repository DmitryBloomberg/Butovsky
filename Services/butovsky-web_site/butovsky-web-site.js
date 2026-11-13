// ./Services/butovsky-web_site/butovsky-web-site.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Раздаем статические файлы из папки 'build', которая лежит рядом со скриптом
app.use(express.static(path.join(__dirname, 'build')));

// Fallback для SPA (React/Vue/Angular): отдаем index.html для всех остальных маршрутов
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Слушаем 0.0.0.0, чтобы быть доступными снаружи Docker-контейнера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер butovsky-web-site запущен на порту ${PORT}`);
});