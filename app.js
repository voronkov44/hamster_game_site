const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Конфигурация соединения с базой данных
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'hamster_game',
});

// Подключение к базе данных
db.connect(err => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
        return;
    }
    console.log('Подключение к базе данных успешно!');
});

// Настройка middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static( 'public')); // Раздавать статические файлы

// Маршруты для HTML страниц
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'))
});

app.get('/home_page', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'home_page.html')); // Главная страница игры
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'login.html')); // Страница входа
});
app.get('/reglogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'reglogin.html')); // Страница регистрации
});
app.get('/preview', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'preview.html')); // Предпросмотр
});
app.get('/result', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'result.html')); // Результаты
});

// Обработка запроса на регистрацию
app.post('/register', (req, res) => {
    console.log('Получен запрос на регистрацию:', req.body);
    const { name, surname, nickname, password } = req.body;

    // Проверка на заполнение всех полей
    if (!name || !surname || !nickname || !password) {
        return res.send('Не все данные заполнены');
    }

    // Хэширование пароля
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Ошибка хэширования пароля:', err);
            return res.status(500).send('Ошибка сервера');
        }

        // Сбор данных для вставки в базу
        const query = 'INSERT INTO users (nickname, hashed_password, name, surname) VALUES (?, ?, ?, ?)';
        db.query(query, [nickname, hashedPassword, name, surname], (err, results) => {
            if (err) {
                console.error('Ошибка при вставке данных:', err);
                return res.status(500).send('Ошибка сервера');
            }

            // Переадресация на главную страницу
            res.redirect('/home_page'); // Переход на главную страницу
        });
    });
});


// Обработка запроса на вход
app.post('/login', (req, res) => {
    console.log('Получен запрос на вход:', req.body);
    const { nickname, password } = req.body; // Убедитесь, что используете nickname

    // Проверка на заполнение всех полей
    if (!nickname || !password) {
        return res.send('Не все данные заполнены');
    }

    // Запрос на получение пользователя из базы данных
    const query = 'SELECT hashed_password FROM users WHERE nickname = ?';
    db.query(query, [nickname], (err, results) => {
        if (err) {
            console.error('Ошибка при запросе пользователя:', err);
            return res.status(500).send('Ошибка сервера');
        }

        // Проверка, найден ли пользователь
        if (results.length === 0) {
            return res.send('Неверный никнейм или пароль');
        }

        // Получаем хэшированный пароль
        const hashedPassword = results[0].hashed_password;

        // Сравнение паролей
        bcrypt.compare(password, hashedPassword, (err, match) => {
            if (err) {
                console.error('Ошибка при сравнении паролей:', err);
                return res.status(500).send('Ошибка сервера');
            }
            if (match) {
                // Если пароли совпадают, перенаправляем на главную страницу
                return res.redirect('/preview');
            } else {
                return res.send('Неверный никнейм или пароль');
            }
        });
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

// Обработка 404 ошибок
app.use((req, res) => {
    res.status(404).send('404: Страница не найдена');
});
