// --- ЗАВИСИМОСТИ ---
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

// --- НАСТРОЙКИ И КОНСТАНТЫ ---
const PORT = process.env.PORT || 10000;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- СОЗДАНИЕ СЕРВЕРА ---
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// --- ЛОГИКА WEBSOCKET ---
wss.on('connection', ws => {
    console.log('[OK] Client connected');
    ws.on('close', () => {
        console.log('[INFO] Client disconnected');
    });
    ws.on('error', error => {
        console.error('[ERROR] WebSocket error:', error);
    });
});

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// --- ЛОГИКА ПОЛУЧЕНИЯ ДАННЫХ ---

// Функция для получения новостей от Finnhub
async function fetchMarketNews() {
    try {
        const response = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`);
        if (!response.ok) {
            console.error(`[ERROR] in fetchMarketNews: Finnhub API responded with status ${response.status}`);
            return []; // Возвращаем пустой массив, чтобы не ломать дальнейшую логику
        }
        const news = await response.json();
        return news.slice(0, 5); // Берем только 5 самых свежих новостей
    } catch (error) {
        console.error('[ERROR] in fetchMarketNews:', error.message);
        return [];
    }
}

// Функция для анализа новостей с помощью Gemini (ПРЯМОЙ ЗАПРОС)
async function fetchMarketPulse() {
    try {
        const newsItems = await fetchMarketNews();
        if (newsItems.length === 0) {
            console.log('[INFO] No news to analyze, skipping market pulse.');
            return;
        }

        const headlines = newsItems.map(item => item.headline).join('\n');
        const prompt = `Based on these headlines, provide a concise market sentiment summary (2-3 sentences) and a sentiment score from -1 (very bearish) to 1 (very bullish). Headlines:\n\n${headlines}\n\nFormat your response as a single, valid JSON object: {"summary": "...", "sentiment": X.X}`;

        // Прямой запрос к API Gemini с правильным именем модели
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

        const apiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            // Если API вернуло ошибку, логируем ее и выходим
            console.error(`[ERROR] in fetchMarketPulse: Gemini API responded with status ${apiResponse.status}:`, JSON.stringify(responseData));
            return;
        }

        // Извлекаем текст из сложной структуры ответа Gemini
        const text = responseData.candidates[0].content.parts[0].text;
        
        // Очищаем текст от возможных "```json" и парсим в объект
        const cleanedText = text.replace(/```json|```/g, '').trim();
        const pulseData = JSON.parse(cleanedText);
        
        console.log('[OK] Market Pulse:', pulseData);
        broadcast({ type: 'marketPulse', data: pulseData });

    } catch (error) {
        // Ловим любые другие ошибки (сетевые, ошибки парсинга JSON и т.д.)
        console.error('[ERROR] in fetchMarketPulse:', error.message);
    }
}

// --- ЗАПУСК СЕРВЕРА И ОСНОВНОЙ ЦИКЛ ---
server.listen(PORT, () => {
    console.log(`[OK] Backend server started on port ${PORT}.`);
    console.log(`[INFO] Finnhub Key Loaded: ${!!FINNHUB_API_KEY}`);
    console.log(`[INFO] Gemini Key Loaded: ${!!GEMINI_API_KEY}`);

    // Запускаем получение данных сразу и затем каждые 5 минут
    fetchMarketPulse();
    setInterval(fetchMarketPulse, 5 * 60 * 1000); 
});
