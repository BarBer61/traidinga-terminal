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

// ИЗМЕНЕНО: Функция для анализа новостей с помощью модели text-bison-001
async function fetchMarketPulse() {
    try {
        const newsItems = await fetchMarketNews();
        if (newsItems.length === 0) {
            console.log('[INFO] No news to analyze, skipping market pulse.');
            return;
        }

        const headlines = newsItems.map(item => item.headline).join('\n');
        const prompt = `Based on these headlines, provide a concise market sentiment summary (2-3 sentences) and a sentiment score from -1 (very bearish) to 1 (very bullish). Headlines:\n\n${headlines}\n\nFormat your response as a single, valid JSON object: {"summary": "...", "sentiment": X.X}`;

        // ИЗМЕНЕНИЕ 1: Используем модель text-bison-001
        const bisonUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-bison-001:generateText?key=${GEMINI_API_KEY}`;

        const apiResponse = await fetch(bisonUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // ИЗМЕНЕНИЕ 2: Структура тела запроса для text-bison-001
            body: JSON.stringify({
                prompt: { text: prompt }
            })
        });

        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error(`[ERROR] in fetchMarketPulse: Google API responded with status ${apiResponse.status}:`, JSON.stringify(responseData));
            return;
        }

        // ИЗМЕНЕНИЕ 3: Структура ответа у text-bison-001 отличается
        const text = responseData?.candidates?.[0]?.output;
        if (!text) {
            console.error('[ERROR] Could not extract text from Google API response:', JSON.stringify(responseData));
            return;
        }
        
        const cleanedText = text.replace(/```json|```/g, '').trim();
        const pulseData = JSON.parse(cleanedText);
        
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
    console.log(`[INFO] Gemini Key Loaded: ${!!GEMINI_API_KEY}`);

    fetchMarketPulse();
    setInterval(fetchMarketPulse, 5 * 60 * 1000); 
});
