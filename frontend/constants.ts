
export const MODELS = {
  TEXT_SEARCH: 'gemini-3-flash-preview',
  PRO_REASONING: 'gemini-3-pro-preview',
  TTS: 'gemini-2.5-flash-preview-tts',
  LIVE: 'gemini-2.5-flash-native-audio-preview-12-2025',
};

export const SYSTEM_INSTRUCTIONS = {
  STRATEGY_ANALYZER: `Вы — Strategy Core Analyzer. Анализируйте сделки на предмет ошибок и сильных сторон. Ответы на русском.`,
  
  NEWS_EXPERT: `Вы — ведущий финансовый аналитик. Для данной новости:
1. Оцените волатильность: "Высокая", "Умеренная" или "Низкая".
2. Дайте прогноз направления для связанных пар: "CALL" (рост актива), "PUT" (падение) или "NEUTRAL".
3. Подробно объясните логику (связь процентных ставок, инфляции и т.д.).
Ответ должен быть структурированным, профессиональным и на русском языке.`,

  MARKET_PULSE_EXPERT: `Вы — эксперт по анализу рыночных настроений. Проанализируйте текущий пульс рынка (волатильность, объемы, общие настроения). 
Используйте данные с TradingView и Investing. 
Верните ответ строго в формате JSON: 
{ "state": "СТАБИЛЬНО" | "УМЕРЕННО" | "ИМПУЛЬСИВНО" | "ХАОТИЧНО", "impulse": number (0-100), "description": string (кратко на русском) }`,

  FINANCIAL_AI_CORE: `Вы — Gemini AI CORE, финансовый ассистент. Общение на русском, фокус на рисках и аналитике.`,

  LIVE_ASSISTANT: `Вы — живой ИИ-ассистент трейдера. Вы помогаете в реальном времени анализировать рынок и принимать решения на основе голоса и контекста. Общайтесь профессионально, кратко и на русском языке.`
};

export const DEFAULT_BROKERS = [
  { id: '1', name: 'Grant Capital' },
  { id: '2', name: 'Pocket Option' }
];

export const DEFAULT_STRATEGIES = [
  { id: '1', name: 'От уровней (S/R)' },
  { id: '2', name: 'По объёму (VSA)' },
  { id: '3', name: 'Скальпинг' },
  { id: '4', name: 'По тренду' }
];

export const TIMEFRAMES = [
  '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '10m', 
  '11m', '12m', '13m', '14m', '15m', '30m', '45m', '1H', '2H', '4H', '1D'
];

export const SPEECH_CONFIG = {
  DEFAULT_VOICE: 'Fenrir',
  DEFAULT_SPEED: 1.0,
  DEFAULT_VOLUME: 1.0
};
