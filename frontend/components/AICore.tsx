import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

// ... (константы QUICK_PROMPTS, VOICE_OPTIONS остаются без изменений)
const QUICK_PROMPTS = [
  { label: 'ВОЛАТИЛЬНОСТЬ', prompt: 'Проанализируй текущую волатильность пар на основе последних новостей.' },
  { label: 'ОШИБКИ', prompt: 'Найди системную ошибку в моих последних сделках.' },
  { label: 'ПСИХОЛОГИЯ', prompt: 'Дай совет по дисциплине после серии убытков.' }
];
const VOICE_OPTIONS = [
  { id: 'Fenrir', label: 'Мужской (Fenrir)' },
  { id: 'Charon', label: 'Мужской (Charon)' },
  { id: 'Puck', label: 'Мужской (Puck)' },
  { id: 'Kore', label: 'Женский (Kore)' },
  { id: 'Zephyr', label: 'Нейтральный (Zephyr)' }
];


interface AICoreProps {
  ws: WebSocket | null;
}

const AICore: React.FC<AICoreProps> = ({ ws }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('ai_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // ... (остальные состояния и рефы остаются без изменений)
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [autoRead, setAutoRead] = useState(() => localStorage.getItem('autoRead') === 'true');
  const [voiceName, setVoiceName] = useState(() => localStorage.getItem('voiceName') || 'Fenrir');
  const [voiceSpeed, setVoiceSpeed] = useState(() => Number(localStorage.getItem('voiceSpeed')) || 1.0);
  const [voiceVolume, setVoiceVolume] = useState(() => Number(localStorage.getItem('voiceVolume')) || 1.0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- ОБНОВЛЕННАЯ ЛОГИКА ---

  useEffect(() => {
    localStorage.setItem('ai_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Эффект для прослушивания ответов от Gemini через WebSocket
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      if (message.type === 'GEMINI_RESPONSE') {
        const aiMsg: ChatMessage = { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: message.payload.text, 
          timestamp: Date.now() 
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
        // TODO: Добавить авточтение, если нужно
      } else if (message.type === 'ERROR') {
        // Обработка ошибок с сервера
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: `Произошла ошибка на сервере: ${message.payload}`,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMsg]);
        setIsLoading(false);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  const handleSend = async (text: string) => {
    if (!text.trim() || !ws || ws.readyState !== WebSocket.OPEN) {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert("Нет подключения к AI-серверу. Проверьте соединение.");
      }
      return;
    }
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Отправляем запрос на наш бэкенд через WebSocket
    ws.send(JSON.stringify({
      type: 'GEMINI_REQUEST',
      payload: {
        prompt: text,
        history: messages.slice(-6).map(m => ({ role: m.role, parts: [{ text: m.text }] }))
      }
    }));
  };

  // ... (функции handlePlayAudio, startRecording, stopRecording и разметка остаются без изменений)
  // ВАЖНО: Функции generateSpeech, playRawAudio, transcribeAudio теперь должны быть в отдельном файле и не должны содержать API-ключей.
  // Если они у вас были в geminiService.ts, их нужно будет пересмотреть. Предполагается, что они работают с внешними сервисами или браузерными API.
  
  // ... (остальная часть компонента без изменений)
  return (
    <div className="flex flex-col h-full bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
      <div className="h-1 w-full bg-zinc-950 shrink-0">
         <div className={`h-full transition-all duration-1000 ${isLoading ? 'bg-indigo-500 w-full animate-pulse' : 'bg-indigo-500 w-1'}`}></div>
      </div>

      <div className="px-5 py-4 flex justify-between items-center border-b border-zinc-900 shrink-0">
         <div className="flex items-center space-x-2">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">INTELLIGENCE STREAM</span>
         </div>
         <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowVoiceSettings(!showVoiceSettings)} 
              className={`p-1.5 rounded-lg transition-colors ${showVoiceSettings ? 'text-indigo-500 bg-indigo-500/10' : 'text-zinc-600 hover:text-zinc-300'}`}
            >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
            <button onClick={() => setMessages([])} className="text-zinc-600 hover:text-red-500 p-1 transition-colors">
               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
         </div>
      </div>

      {showVoiceSettings && (
        <div className="absolute top-[50px] inset-x-0 mx-4 z-50 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
           {/* ... разметка настроек голоса без изменений */}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-black/10">
        {/* ... разметка сообщений без изменений */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <svg className="w-10 h-10 text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <p className="text-[10px] font-black uppercase tracking-widest text-center">TraidingA AI Активен</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`w-full max-w-[95%] p-3.5 rounded-2xl border relative ${m.role === 'user' ? 'bg-zinc-800/50 border-zinc-700 text-zinc-200' : 'bg-indigo-600/5 border-indigo-600/20 text-zinc-100 shadow-lg shadow-indigo-500/5'}`}>
              <div className="text-[11px] leading-relaxed font-medium">{m.text}</div>
              {/* ... остальная разметка сообщения */}
            </div>
            <span className="text-[7px] font-black text-zinc-700 mt-1 uppercase px-1">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
        {isLoading && <div className="flex items-center space-x-2 p-2"><div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div><span className="text-[9px] font-black text-indigo-500 uppercase">ОБРАБОТКА...</span></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 bg-black/40 border-t border-zinc-900 space-y-3 shrink-0">
        {/* ... разметка инпута без изменений */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1">
          {QUICK_PROMPTS.map((qp, i) => (
            <button key={i} onClick={() => handleSend(qp.prompt)} className="whitespace-nowrap bg-zinc-900/80 border border-zinc-800 hover:border-indigo-500/50 px-3 py-1.5 rounded-xl text-[8px] font-black text-zinc-500 hover:text-indigo-400 transition-all active:scale-95">{qp.label}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative flex items-center space-x-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="ЗАПРОС..." className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-xl py-3 px-4 text-[11px] text-zinc-200 placeholder-zinc-700 outline-none focus:border-indigo-500 transition-all" />
          <button type="submit" disabled={!input.trim() || isLoading || !ws} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-20 shadow-lg shadow-indigo-600/20"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7" /></svg></button>
        </form>
      </div>
    </div>
  );
};

export default AICore;
