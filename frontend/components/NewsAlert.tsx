import React, { useState, useEffect } from 'react';

interface NewsEvent {
    event: string;
    currency: string;
    impact: string;
    countdown: number; // в секундах
}

interface NewsAlertProps {
    alert: NewsEvent | null;
    onClose: () => void;
}

const NewsAlert: React.FC<NewsAlertProps> = ({ alert, onClose }) => {
    const [timeLeft, setTimeLeft] = useState(alert?.countdown || 0);

    useEffect(() => {
        if (!alert) return;
        setTimeLeft(alert.countdown);
        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    onClose();
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [alert, onClose]);

    if (!alert) return null;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isHigh = alert.impact === 'high';

    return (
        <div className={`fixed bottom-20 md:bottom-5 right-5 text-white p-4 rounded-2xl shadow-2xl z-[200] w-80 animate-in slide-in-from-right duration-500 backdrop-blur-xl border ${
            isHigh ? 'bg-red-600/80 border-red-400' : 'bg-amber-600/80 border-amber-400'
        }`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest">{isHigh ? 'ВАЖНАЯ НОВОСТЬ' : 'НОВОСТЬ СРЕДНЕЙ ВАЖНОСТИ'}</p>
                    <p className="font-bold mt-1">{alert.event} ({alert.currency})</p>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white">&times;</button>
            </div>
            <div className="mt-3 text-center">
                <p className="text-3xl font-mono font-black">{`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</p>
                <p className="text-[8px] font-bold text-white/80 uppercase">ДО ВЫХОДА</p>
            </div>
        </div>
    );
};

export default NewsAlert;
