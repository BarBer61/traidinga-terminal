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
        const news = await response.json();
        return news.slice(0, 5); // Берем только 5 свежих новостей
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

        const textToAnalyze = newsItems.map(item => item.headline).join('. ');

        // ИЗМЕНЕНИЕ: Используем стандартную модель, доступную на бесплатном тарифе
        const model = 'distilbert-base-uncased-finetuned-sst-2-english';
        const analysisResponse = await fetch(`https://api.nlpcloud.io/v1/${model}/sentiment`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${NLP_CLOUD_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: textToAnalyze })
        });

        const responseText = await analysisResponse.text();

        if (!analysisResponse.ok) {
            console.error(`[ERROR] NLP Cloud API responded with status ${analysisResponse.status}. Response: ${responseText}`);
            return;
        }

        let analysisData;
        try {
            analysisData = JSON.parse(responseText);
        } catch (e) {
            console.error(`[ERROR] Failed to parse NLP Cloud response as JSON. Response was: ${responseText}`);
            return;
        }

        if (!analysisData.scored_labels) {
             console.error(`[ERROR] Invalid data structure from NLP Cloud:`, analysisData);
             return;
        }

        const topScore = analysisData.scored_labels.reduce((a, b) => (a.score > b.score ? a : b));
        
        let sentimentScore = 0;
        // Эта модель использует 'LABEL_1' для позитива и 'LABEL_0' для негатива
        if (topScore.label === 'LABEL_1' || topScore.label.toLowerCase() === 'positive') {
            sentimentScore = topScore.score;
        } else if (topScore.label === 'LABEL_0' || topScore.label.toLowerCase() === 'negative') {
            sentimentScore = -topScore.score;
        }

        const pulseData = {
            summary: `General market sentiment is predominantly '${topScore.label.replace('LABEL_1', 'positive').replace('LABEL_0', 'negative')}' based on latest headlines.`,
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
    setInterval(fetchMarketPulse, 15 * 60 * 1000); // Интервал 15 минут для экономии лимитов
});
