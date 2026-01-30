// --- ЗАВИСИМОСТИ ---
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

// --- НАСТРОЙКИ И КОНСТАНТЫ ---
const PORT = process.env.PORT || 10000;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const NLP_CLOUD_API_KEY = process.env.NLP_CLOUD_API_KEY;

// --- СОЗДАНИЕ СЕРВЕРА ---
// Создаем простой HTTP-сервер. Его единственная задача - быть основой для WebSocket.
// Он не будет обслуживать файлы, так как этим занимается отдельный сервис Render.
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running.');
});

const wss = new WebSocket.Server({ server });

// --- ЛОГИКА WEBSOCKET ---
let lastPulseData = null;

wss.on('connection', ws => {
    console.log('[OK] Client connected');
    // Отправляем последние данные новому клиенту, если они есть
    if (lastPulseData) {
        ws.send(JSON.stringify({ type: 'marketPulse', data: lastPulseData }));
    }
    ws.on('close', () => console.log('[INFO] Client disconnected'));
    ws.on('error', error => console.error('[ERROR] WebSocket error:', error));
});

function broadcast(data) {
    // Сохраняем последние данные marketPulse для новых клиентов
    if (data.type === 'marketPulse') {
        lastPulseData = data.data;
    }
    
    const message = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
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

async function fetchMarketPulse() {
    try {
        const newsItems = await fetchMarketNews();
        if (newsItems.length === 0) {
            console.log('[INFO] No news to analyze, skipping market pulse.');
            return;
        }

        const textToAnalyze = newsItems.map(item => item.headline).join('. ');
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

    if (!FINNHUB_API_KEY || !NLP_CLOUD_API_KEY) {
        console.error('[FATAL] One or more API keys are not set! Check FINNHUB_API_KEY and NLP_CLOUD_API_KEY in your Render environment variables.');
    }

    fetchMarketPulse();
    setInterval(fetchMarketPulse, 15 * 60 * 1000); // Интервал 15 минут
});
