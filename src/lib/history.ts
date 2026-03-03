
export interface HistoryItem {
  id: string;
  timestamp: number;
  type: 'physiognomy' | 'tarot' | 'iching' | 'divination';
  title: string;
  result: any;
}

const MAX_HISTORY = 10;

export const saveHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  const history = getHistory(item.type);
  const newItem: HistoryItem = {
    ...item,
    id: Math.random().toString(36).substring(2, 11),
    timestamp: Date.now(),
  };
  
  const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(`history_${item.type}`, JSON.stringify(updatedHistory));
};

export const getHistory = (type: HistoryItem['type']): HistoryItem[] => {
  const data = localStorage.getItem(`history_${type}`);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const clearHistory = (type: HistoryItem['type']) => {
  localStorage.removeItem(`history_${type}`);
};
