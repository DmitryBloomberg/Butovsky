const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 1. Раздача статических файлов из папки build
// ============================================
app.use(express.static(path.join(__dirname, 'build')));

// ============================================
// 2. API-эндпоинты (примеры)
// ============================================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/data', (req, res) => {
    res.json({ message: 'Hello from server!' });
});

// ============================================
// 3. SPA fallback — все остальные запросы
//    отдают index.html (для React Router)
// ============================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// ============================================
// 4. Запуск сервера
// ============================================
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 Раздаём статику из: ${path.join(__dirname, 'build')}`);
});