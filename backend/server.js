// backend/server.js

require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
// 'node-fetch' больше не нужен, используем встроенный fetch

const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- НАСТРОЙКИ И КОНСТАНТЫ ---
// Убираем константу PORT, так как Render предоставляет ее напрямую
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MESSAGE_TYPES = {
    ECONOMIC_CALENDAR_UPDATE: 'ECONOMIC_CALENDAR_UPDATE',
    MARKET_PULSE_UPDATE: 'MARKET_PULSE_UPDATE',
    NEWS_ALERT: 'NEWS_ALERT',
    GEMINI_REQUEST: 'GEMINI_REQUEST',
    GEMINI_RESPONSE: 'GEMINI_RESPONSE',
    ERROR: 'ERROR',
};

// Проверка наличия ключей API при старте
if (!FINNHUB_API_KEY || !GEMINI_API_KEY) {
    console.error("CRITICAL ERROR: API keys not found in initial environment variables!");
    // Не выходим из процесса сразу, дадим серверу шанс запуститься и проверить переменные Render
}

// --- ИНИЦИАЛИЗАЦИЯ КЛИЕНТОВ API ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });


// --- ХРАНИЛИЩЕ ДАННЫХ В ПАМЯТИ ---
let economicCalendar = [];
let marketPulse = { state: 'СТАБИЛЬНО', impulse: 20, description: 'Сбор данных...' };
const newsAlertTimers = new Map();

// --- УТИЛИТЫ ---
const withErrorHandling = (fn, context) => async (...args) => {
    try {
        await fn(...args);
    } catch (error) {
        console.error(`[ERROR] in ${context}:`, error);
    }
};

// --- ФУНКЦИИ ДЛЯ РАБОТЫ С API ---
const fetchEconomicCalendar = withErrorHandling(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch(`https://finnhub.io/api/v1/calendar/economic?from=${today}&to=${today}&token=${FINNHUB_API_KEY}`);
    if (!response.ok) {
        throw new Error(`Finnhub API responded with status ${response.status}`);
    }
    const data = await response.json();
    
    if (data.economicCalendar) {
        console.log(`[INFO] Loaded ${data.economicCalendar.length} economic events.`);
        economicCalendar = data.economicCalendar.map(e => ({ ...e, id: e.time + e.event }));
        broadcast({ type: MESSAGE_TYPES.ECONOMIC_CALENDAR_UPDATE, payload: economicCalendar });
        setupNewsAlerts();
    }
}, 'fetchEconomicCalendar');

const fetchMarketPulse = withErrorHandling(async () => {
    const prompt = `Проанализируй текущее состояние валютного рынка (EUR/USD, GBP/JPY, AUD/USD) на основе последних новостей и настроений. Дай краткий ответ в формате JSON: {"state": "...", "impulse": ..., "description": "..."}. Возможные значения для "state": "СТАБИЛЬНО", "УМЕРЕННО", "ИМПУЛЬСИВНО", "ХАОТИЧНО". "impulse" - это число от 0 до 100, показывающее силу движения. "description" - краткое описание на русском в 2-3 словах.`;
    
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        marketPulse = JSON.parse(jsonMatch[0]);
        console.log('[INFO] Market pulse updated:', marketPulse);
        broadcast({ type: MESSAGE_TYPES.MARKET_PULSE_UPDATE, payload: marketPulse });
    } else {
        console.warn('[WARN] Gemini did not return a valid JSON for market pulse.');
    }
}, 'fetchMarketPulse');


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
                        type: MESSAGE_TYPES.NEWS_ALERT,
                        payload: { ...event, countdown: 600 } // 10 минут в секундах
                    });
                    console.log(`[ALERT] Sent news alert: ${event.event}`);
                }, alertTime - now);
                newsAlertTimers.set(event.id, timeoutId);
            }
        });
}

// --- WEBSOCKET СЕРВЕР ---
const server = http.createServer();
const wss = new WebSocket.Server({ server });

function broadcast(data) {
    const jsonData = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(jsonData);
        }
    });
}

wss.on('connection', ws => {
    console.log('[INFO] Client connected.');
    
    ws.send(JSON.stringify({ type: MESSAGE_TYPES.ECONOMIC_CALENDAR_UPDATE, payload: economicCalendar }));
    ws.send(JSON.stringify({ type: MESSAGE_TYPES.MARKET_PULSE_UPDATE, payload: marketPulse }));

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === MESSAGE_TYPES.GEMINI_REQUEST) {
                const { prompt, history } = data.payload;
                const chat = geminiModel.startChat({ history });
                const result = await chat.sendMessage(prompt);
                const response = result.response;
                ws.send(JSON.stringify({ type: MESSAGE_TYPES.GEMINI_RESPONSE, payload: { text: response.text() } }));
            }
        } catch (error) {
            console.error('[ERROR] Failed to process client message:', error);
            ws.send(JSON.stringify({ type: MESSAGE_TYPES.ERROR, payload: 'Server-side error' }));
        }
    });

    ws.on('close', () => {
        console.log('[INFO] Client disconnected.');
    });
});

// --- ЗАПУСК СЕРВЕРА И ПЕРИОДИЧЕСКИХ ЗАДАЧ ---
// ИСПРАВЛЕНО: Этот блок теперь правильно работает с Render
server.listen(process.env.PORT || 8080, () => {
    // Проверяем, что ключи API загрузились из окружения Render
    const finnhubKeyLoaded = !!process.env.FINNHUB_API_KEY;
    const geminiKeyLoaded = !!process.env.GEMINI_API_KEY;
    
    console.log(`[OK] Backend server started.`);
    console.log(`[INFO] Finnhub Key Loaded: ${finnhubKeyLoaded}`);
    console.log(`[INFO] Gemini Key Loaded: ${geminiKeyLoaded}`);
    
    if (!finnhubKeyLoaded || !geminiKeyLoaded) {
        console.error("[CRITICAL] API keys did not load from environment. Halting.");
        return; // Не запускаем запросы, если ключей нет
    }

    // Первоначальная загрузка данных
    fetchEconomicCalendar();
    fetchMarketPulse();

    // Обновление по расписанию
    setInterval(fetchEconomicCalendar, 60 * 60 * 1000); // Каждый час
    setInterval(fetchMarketPulse, 2 * 60 * 1000);      // Каждые 2 минуты
});
