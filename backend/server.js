// --- ЗАВИСИМОСТИ ---
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

// --- НАСТРОЙКИ И КОНСТАНТЫ ---
const PORT = process.env.PORT || 10000;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
// GEMINI_API_KEY больше не нужен

// --- СОЗДАНИЕ СЕРВЕРА ---
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// --- ЛОГИКА WEBSOCKET ---
wss.on('connection', ws => {
    console.log('[OK] Client connected');
    // При подключении нового клиента, сразу отправляем ему последние данные, если они есть
    if (lastPulseData) {
        console.log('[INFO] Sending cached pulse to new client.');
        ws.send(JSON.stringify({ type: 'marketPulse', data: lastPulseData }));
    }
    ws.on('close', () => {
        console.log('[INFO] Client disconnected');
    });
    ws.on('error', error => {
        console.error('[ERROR] WebSocket error:', error);
    });
});

let lastPulseData = null; // Кэш для последних полученных данных

function broadcast(data) {
    lastPulseData = data.data; // Сохраняем данные в кэш
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// --- ЛОГИКА ПОЛУЧЕНИЯ ДАННЫХ ---

async function fetchMarketNews() {
    try {
        const response = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`);
        if (!response.ok) {
            console.error(`[ERROR] in fetchMarketNews: Finnhub API responded with status ${response.status}`);
            return [];
        }
        const news = await response.json();
        return news.slice(0, 5);
    } catch (error) {
        console.error('[ERROR] in fetchMarketNews:', error.message);
        return [];
    }
}

// ИЗМЕНЕНО: Функция для анализа новостей с помощью альтернативного API
async function fetchMarketPulse() {
    try {
        const newsItems = await fetchMarketNews();
        if (newsItems.length === 0) {
            console.log('[INFO] No news to analyze, skipping market pulse.');
            return;
        }

        // Собираем заголовки в один текст для анализа
        const textToAnalyze = newsItems.map(item => item.headline).join('. ');

        // Используем бесплатный API для анализа настроений
        const analysisResponse = await fetch('https://sentim-api.herokuapp.com/api/v1/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ text: textToAnalyze })
        });

        if (!analysisResponse.ok) {
            console.error(`[ERROR] Sentiment API responded with status ${analysisResponse.status}`);
            return;
        }

        const analysisData = await analysisResponse.json();
        
        // Форматируем данные под наш стандарт
        const pulseData = {
            summary: `Analysis based on ${newsItems.length} latest headlines. Sentiment polarity is ${analysisData.result.polarity.toFixed(2)}.`,
            sentiment: analysisData.result.polarity.toFixed(2) // API возвращает полярность от -1 до 1
        };
        
        console.log('[OK] Market Pulse:', pulseData);
        broadcast({ type: 'marketPulse', data: pulseData });

    } catch (error) {
        console.error('[ERROR] in fetchMarketPulse:', error.message);
    }
}

// --- ЗАПУСК СЕРВЕРА И ОСНОВНОЙ ЦИКЛ ---
server.listen(PORT, () => {
    console.log(`[OK] Backend server started on port ${PORT}.`);
    console.log(`[INFO] Finnhub Key Loaded: ${!!FINNHUB_API_KEY}`);

    fetchMarketPulse();
    setInterval(fetchMarketPulse, 5 * 60 * 1000); 
});
