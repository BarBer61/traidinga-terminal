// --- ЗАВИСИМОСТИ ---
import 'dotenv/config';
import { WebSocketServer } from 'ws';

// --- НАСТРОЙКИ И КОНСТАНТЫ ---
const PORT = process.env.PORT || 10000;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- НАСТРОЙКА WEBSOCKET СЕРВЕРА ---
const wss = new WebSocketServer({ port: PORT });

wss.on('listening', () => {
    console.log(`[OK] Backend server started on port ${PORT}.`);
    console.log(`[INFO] Finnhub Key Loaded: ${!!FINNHUB_API_KEY}`);
    console.log(`[INFO] Gemini Key Loaded: ${!!GEMINI_API_KEY}`);
});

wss.on('connection', (ws) => {
    console.log('[INFO] Client connected.');
    fetchEconomicCalendar();
    fetchMarketPulse();
    ws.on('close', () => {
        console.log('[INFO] Client disconnected.');
    });
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// --- ОСНОВНЫЕ ФУНКЦИИ ПОЛУЧЕНИЯ ДАННЫХ ---
async function fetchEconomicCalendar() {
    if (!FINNHUB_API_KEY) return;
    try {
        const response = await fetch(`https://finnhub.io/api/v1/calendar/economic?token=${FINNHUB_API_KEY}`);
        if (!response.ok) throw new Error(`Finnhub API responded with status ${response.status}`);
        const data = await response.json();
        broadcast({ type: 'economicCalendar', data: data.economicCalendar });
    } catch (error) {
        console.error('[ERROR] in fetchEconomicCalendar:', error.message);
    }
}

async function fetchMarketPulse() {
    if (!FINNHUB_API_KEY || !GEMINI_API_KEY) return;
    try {
        const now = new Date();
        const to = now.toISOString().split('T')[0];
        now.setDate(now.getDate() - 2);
        const from = now.toISOString().split('T')[0];

        const newsResponse = await fetch(`https://finnhub.io/api/v1/news?category=general&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`);
        if (!newsResponse.ok) throw new Error(`Finnhub News API responded with status ${newsResponse.status}`);
        const news = await newsResponse.json();
        const headlines = news.slice(0, 15).map(item => item.headline).join('\n');

        const prompt = `Проанализируй эти заголовки новостей и дай краткую сводку (2-3 предложения) об общем настроении рынка (позитивное, негативное, нейтральное или смешанное). Вот заголовки:\n\n${headlines}`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
        
        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            throw new Error(`Gemini API responded with status ${geminiResponse.status}: ${errorText}`);
        }

        const geminiData = await geminiResponse.json();
        if (!geminiData.candidates || geminiData.candidates.length === 0) {
            throw new Error('Gemini API returned no candidates in response.');
        }
        const analysis = geminiData.candidates[0].content.parts[0].text;
        
        broadcast({ type: 'marketPulse', data: analysis.trim() });
    } catch (error) {
        console.error('[ERROR] in fetchMarketPulse:', error.message);
    }
}

// --- ЗАПУСК И ПЕРИОДИЧЕСКОЕ ОБНОВЛЕНИЕ ---
fetchEconomicCalendar();
fetchMarketPulse();
setInterval(() => {
    fetchEconomicCalendar();
    fetchMarketPulse();
}, 30 * 60 * 1000);
