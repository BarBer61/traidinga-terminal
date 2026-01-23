
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  JOURNAL = 'JOURNAL',
  ANALYTICS = 'ANALYTICS',
  CALENDAR = 'CALENDAR',
  AI_CORE = 'AI_CORE',
  SETTINGS = 'SETTINGS'
}

export interface Trade {
  id: string;
  entryTime: string;
  exitTime: string;
  asset: string;
  timeframe: string;
  direction: 'CALL' | 'PUT';
  payout: number;
  amount: number;
  result: 'WIN' | 'LOSS' | 'REFUND';
  brokerId: string;
  strategyId: string;
  confidence: number; // 1-5
  mood: 'Спокойствие' | 'Эйфория' | 'Тильт' | 'Страх';
  comment?: string;
}

export interface Broker {
  id: string;
  name: string;
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  winRate?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  timestamp: number;
  impact: 'High' | 'Medium' | 'Low';
  asset: string;
  relatedInstruments: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: { title: string; uri: string }[];
  isAudioLoading?: boolean;
}

export interface RiskSettings {
  balance: number;
  riskPerTrade: number;
  dailyLimit: number;
  weeklyLimit: number;
  maxDrawdownLimit: number; // % от баланса
  currency: 'USD' | 'RUB';
  isAuthorized?: boolean;
}

export interface TranscriptionItem {
  id: string;
  text: string;
  timestamp: number;
}
