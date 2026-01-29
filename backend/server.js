// --- ЗАВИСИМОСТИ ---
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

// --- НАСТРОЙКИ И КОНСТАНТЫ ---
const PORT = process.env.PORT || 10000;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const NLP_CLOUD_API_KEY = process.env.NLP_CLOUD_API_KEY;

// --- СОЗДАНИЕ СЕРВЕРА ---
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// --- ЛОГИКА WEBSOCKET ---
let lastPulseData = null;

wss.on('connection', ws => {
    console.log('[OK] Client connected');
    if (lastPulseData) {
        ws.send(JSON.stringify({ type: 'marketPulse', data: lastPulseData }));
    }
    ws.on('close', () => console.log('[INFO] Client disconnected'));
    ws.on('error', error => console.error('[ERROR] WebSocket error:', error));
});

function broadcast(data) {
    lastPulseData = data.data;
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
        return await response.json();
    } catch (error) {
        console.error('[ERROR] in fetchMarketNews:', error.message);
        return [];
    }
}

async function fetchMarketPulse() {
    try {
        const newsItems = await fetchMarketNews();
        if (newsItems.length === 0) {
            console.log('[INFO] No news to analyze, skipping market pulse.');
            return;
        }

        const textToAnalyze = newsItems.slice(0, 5).map(item => item.headline).join('. ');

        const analysisResponse = await fetch('https://api.nlpcloud.io/v1/finbert-sentiment-analysis/sentiment', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${NLP_CLOUD_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: textToAnalyze })
        });

        // --- УЛУЧШЕНИЕ: ПРОВЕРКА ОТВЕТА ПЕРЕД ПАРСИНГОМ ---
        const responseText = await analysisResponse.text(); // Сначала получаем ответ как простой текст

        if (!analysisResponse.ok) {
            console.error(`[ERROR] NLP Cloud API responded with status ${analysisResponse.status}. Response: ${responseText}`);
            return;
        }

        let analysisData;
        try {
            analysisData = JSON.parse(responseText); // Теперь парсим текст, который мы уже получили
        } catch (e) {
            console.error(`[ERROR] Failed to parse NLP Cloud response as JSON. Response was: ${responseText}`);
            return; // Выходим, если это не JSON
        }
        // --- КОНЕЦ УЛУЧШЕНИЯ ---

        if (!analysisData.scored_labels) {
             console.error(`[ERROR] Invalid data structure from NLP Cloud:`, analysisData);
             return;
        }

        const topScore = analysisData.scored_labels.reduce((a, b) => (a.score > b.score ? a : b));
        
        let sentimentScore = 0;
        if (topScore.label === 'positive') sentimentScore = topScore.score;
        else if (topScore.label === 'negative') sentimentScore = -topScore.score;

        const pulseData = {
            summary: `Market sentiment is predominantly '${topScore.label}' based on latest headlines.`,
            sentiment: sentimentScore.toFixed(2)
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
    console.log(`[INFO] NLP Cloud Key Loaded: ${!!NLP_CLOUD_API_KEY}`);

    if (!NLP_CLOUD_API_KEY) {
        console.error('[FATAL] NLP_CLOUD_API_KEY is not set!');
    }

    fetchMarketPulse();
    setInterval(fetchMarketPulse, 15 * 60 * 1000); // Увеличим интервал до 15 минут, чтобы экономить лимиты
});
