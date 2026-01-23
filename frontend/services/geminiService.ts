
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { MODELS, SYSTEM_INSTRUCTIONS, SPEECH_CONFIG } from "../constants";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const fetchLatestNews = async () => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODELS.TEXT_SEARCH,
    contents: "Найди 8-10 наиболее актуальных экономических новостей на сегодня с TradingView. Обязательно включи события с высокой (High) и средней (Medium) важностью. Для каждой новости укажи: заголовок, актив (валюта), точное время и важность.",
    config: {
      systemInstruction: "Ты — финансовый аналитик. Верни результат строго в формате JSON массива объектов: {id: string, title: string, timestamp: number, impact: 'High'|'Medium'|'Low', asset: string, relatedInstruments: string[]}. Весь текст внутри JSON должен быть на РУССКОМ языке. Если время события неизвестно, ставь текущее время + случайное смещение.",
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }]
    }
  });
  
  try {
    const text = response.text.trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Ошибка парсинга новостей", e);
    return [];
  }
};

export const fetchMarketPulse = async () => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODELS.TEXT_SEARCH,
    contents: "Проанализируй текущий фон волатильности и состояние рынка на основе данных TradingView.",
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS.MARKET_PULSE_EXPERT,
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }]
    }
  });
  
  try {
    const text = response.text.trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Ошибка получения пульса рынка", e);
    return null;
  }
};

export const analyzeNewsImpact = async (newsTitle: string, asset: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODELS.TEXT_SEARCH,
    contents: `Проанализируй новость: "${newsTitle}" для актива ${asset}. Дай прогноз волатильности и направления. Ответ на русском.`,
    config: { systemInstruction: SYSTEM_INSTRUCTIONS.NEWS_EXPERT, tools: [{ googleSearch: {} }] }
  });
  return response.text;
};

export const analyzePerformance = async (tradesJson: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODELS.PRO_REASONING,
    contents: `Проанализируй эти сделки: ${tradesJson}. Найди ошибки и точки роста. Ответ на русском.`,
    config: { systemInstruction: SYSTEM_INSTRUCTIONS.STRATEGY_ANALYZER }
  });
  return response.text;
};

export const transcribeAudio = async (base64: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODELS.TEXT_SEARCH,
    contents: {
      parts: [
        { inlineData: { mimeType: 'audio/wav', data: base64 } },
        { text: "Расшифруй это аудио на русском языке." }
      ]
    }
  });
  return response.text;
};

export const askAICore = async (text: string, history: any[]) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODELS.TEXT_SEARCH,
    contents: history.length > 0 
      ? [...history, { role: 'user', parts: [{ text }] }] 
      : [{ role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS.FINANCIAL_AI_CORE,
      tools: [{ googleSearch: {} }]
    }
  });
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((chunk: any) => chunk.web).map((chunk: any) => ({
    title: chunk.web.title || 'Источник',
    uri: chunk.web.uri
  })) || [];

  return { text: response.text, sources };
};

export const generateSpeech = async (text: string, voiceName: string = SPEECH_CONFIG.DEFAULT_VOICE) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODELS.TTS,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName }
        }
      }
    }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const playRawAudio = async (base64: string, volume: number = 1.0, speed: number = 1.0) => {
  const bytes = decode(base64);
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const buffer = await decodeAudioData(bytes, ctx, 24000, 1);
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = speed;

  const gainNode = ctx.createGain();
  gainNode.gain.value = volume;

  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  source.start();
};
