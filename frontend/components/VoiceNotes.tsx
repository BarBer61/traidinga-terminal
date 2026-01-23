
import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../services/geminiService';
import { TranscriptionItem } from '../types';

const VoiceNotes: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [notes, setNotes] = useState<TranscriptionItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setIsProcessing(true);
          try {
            const transcription = await transcribeAudio(base64);
            if (transcription) {
              setNotes(prev => [{
                id: Date.now().toString(),
                text: transcription,
                timestamp: Date.now()
              }, ...prev]);
            }
          } catch (error) {
            console.error("Транскрипция не удалась", error);
          } finally {
            setIsProcessing(false);
          }
        };
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Не удалось начать запись", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-100">Голосовые заметки</h2>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRecording ? (
            <>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Остановить и расшифровать</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Записать анализ</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {isProcessing && (
          <div className="bg-slate-800 p-4 rounded-xl animate-pulse flex items-center space-x-3">
             <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce"></div>
             <span className="text-slate-400">ИИ расшифровывает ваши мысли...</span>
          </div>
        )}
        
        {notes.length === 0 && !isProcessing && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p>Нет голосовых заметок</p>
          </div>
        )}

        {notes.map((note) => (
          <div key={note.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 transition-colors">
            <div className="text-xs text-slate-500 mb-1">
              {new Date(note.timestamp).toLocaleTimeString()} • {new Date(note.timestamp).toLocaleDateString()}
            </div>
            <p className="text-slate-200">{note.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceNotes;
