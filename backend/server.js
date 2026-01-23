require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- НАСТРОЙКИ ---
const PORT = process.env.PORT || 8080;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!FINNHUB_API_KEY || !GEMINI_API_KEY) {
    console.error("ОШИБКА: API ключи не найдены в .env файле!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- ХРАНИЛИЩЕ ДАННЫХ В ПАМЯТИ ---
let economicCalendar = [];
let marketPulse = { state: 'СТАБИЛЬНО', impulse: 20, description: 'Сбор данных...' };
const newsAlertTimers = new Map();

// --- ФУНКЦИИ ДЛЯ РАБОТЫ С API ---

// Получение экономического календаря с Finnhub
async function fetchEconomicCalendar() {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const response = await fetch(`https://finnhub.io/api/v1/calendar/economic?from=${today}&to=${today}&token=${FINNHUB_API_KEY}`);
        const data = await response.json();
        
        if (data.economicCalendar) {
            console.log(`[INFO] Загружено ${data.economicCalendar.length} экономических событий.`);
            economicCalendar = data.economicCalendar.map(e => ({ ...e, id: e.time + e.event }));
            broadcast({ type: 'ECONOMIC_CALENDAR_UPDATE', payload: economicCalendar });
            setupNewsAlerts();
        }
    } catch (error) {
        console.error('[ERROR] Ошибка при загрузке экономического календаря:', error);
    }
}

// Получение "Пульса рынка" от Gemini
async function fetchMarketPulse() {
    try {
        const prompt = `Проанализируй текущее состояние валютного рынка (EUR/USD, GBP/JPY, AUD/USD) на основе последних новостей и настроений. Дай краткий ответ в формате JSON: {"state": "...", "impulse": ..., "description": "..."}. Возможные значения для "state": "СТАБИЛЬНО", "УМЕРЕННО", "ИМПУЛЬСИВНО", "ХАОТИЧНО". "impulse" - это число от 0 до 100, показывающее силу движения. "description" - краткое описание на русском в 2-3 словах.`;
        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text().replace(/```json|```/g, '').trim();
        marketPulse = JSON.parse(responseText);
        console.log('[INFO] Пульс рынка обновлен:', marketPulse);
        broadcast({ type: 'MARKET_PULSE_UPDATE', payload: marketPulse });
    } catch (error) {
        console.error('[ERROR] Ошибка при получении пульса рынка от Gemini:', error);
    }
}

// --- ЛОГИКА ОПОВЕЩЕНИЙ ---

function setupNewsAlerts() {
    newsAlertTimers.forEach(timer => clearTimeout(timer));
    newsAlertTimers.clear();
    const now = Date.now();
    
    economicCalendar
        .filter(event => (event.impact === 'high' || event.impact === 'medium') && event.time)
        .forEach(event => {
            const eventTime = new Date(event.time).getTime();
            const alertTime = eventTime - 10 * 60 * 1000; // За 10 минут

            if (alertTime > now) {
                const timeoutId = setTimeout(() => {
                    broadcast({
                        type: 'NEWS_ALERT',
                        payload: {
                            ...event,
                            countdown: 600 // 10 минут в секундах
                        }
                    });
                    console.log(`[ALERT] Отправлено оповещение о новости: ${event.event}`);
                }, alertTime - now);
                newsAlertTimers.set(event.id, timeoutId);
            }
        });
}

// --- WEBSOCKET СЕРВЕР ---

const server = http.createServer();
const wss = new WebSocket.Server({ server });

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

wss.on('connection', ws => {
    console.log('[INFO] Клиент подключился.');
    
    // Отправляем новому клиенту текущие данные
    ws.send(JSON.stringify({ type: 'ECONOMIC_CALENDAR_UPDATE', payload: economicCalendar }));
    ws.send(JSON.stringify({ type: 'MARKET_PULSE_UPDATE', payload: marketPulse }));

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            // Обработка запросов от клиента, например, к Gemini
            if (data.type === 'GEMINI_REQUEST') {
                const { prompt, history } = data.payload;
                const chat = geminiModel.startChat({ history });
                const result = await chat.sendMessage(prompt);
                const response = result.response;
                ws.send(JSON.stringify({ type: 'GEMINI_RESPONSE', payload: { text: response.text() } }));
            }
        } catch (error) {
            console.error('[ERROR] Ошибка обработки сообщения от клиента:', error);
            ws.send(JSON.stringify({ type: 'ERROR', payload: 'Ошибка на сервере' }));
        }
    });

    ws.on('close', () => {
        console.log('[INFO] Клиент отключился.');
    });
});

// --- ЗАПУСК СЕРВЕРА И ПЕРИОДИЧЕСКИХ ЗАДАЧ ---
server.listen(PORT, () => {
    console.log(`[OK] Бэкенд-сервер запущен на порту ${PORT}`);
    
    // Первоначальная загрузка данных
    fetchEconomicCalendar();
    fetchMarketPulse();

    // Обновление данных по расписанию
    setInterval(fetchEconomicCalendar, 60 * 60 * 1000); // Каждый час
    setInterval(fetchMarketPulse, 2 * 60 * 1000); // Каждые 2 минуты
});
