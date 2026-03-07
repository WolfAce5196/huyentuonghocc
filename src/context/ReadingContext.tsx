
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ReadingPageData {
  loading?: boolean;
  error?: string | null;
  [key: string]: any;
}

interface ReadingState {
  physiognomy: ReadingPageData | null;
  tarot: ReadingPageData | null;
  iching: ReadingPageData | null;
  divination: ReadingPageData | null;
  numerology: ReadingPageData | null;
}

const STORAGE_KEY = 'mystic_reading_states';

interface ReadingContextType {
  states: ReadingState;
  updateState: (page: keyof ReadingState, data: Partial<ReadingPageData>) => void;
  resetState: (page: keyof ReadingState) => void;
  startLoading: (page: keyof ReadingState) => void;
  finishLoading: (page: keyof ReadingState, resultData: any, error?: string | null) => void;
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

export const ReadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [states, setStates] = useState<ReadingState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ReadingState;
        // Reset any page that was loading when refreshed
        (Object.keys(parsed) as Array<keyof ReadingState>).forEach(key => {
          if (parsed[key]?.loading) {
            parsed[key] = null;
          }
        });
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved states:", e);
      }
    }
    return {
      physiognomy: null,
      tarot: null,
      iching: null,
      divination: null,
      numerology: null,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  }, [states]);

  const updateState = (page: keyof ReadingState, data: Partial<ReadingPageData>) => {
    setStates((prev) => {
      const currentPageData = prev[page] || {};
      // Deep check if data is actually different to prevent unnecessary re-renders
      const isDifferent = Object.entries(data).some(([key, value]) => currentPageData[key] !== value);
      if (!isDifferent) return prev;
      
      return {
        ...prev,
        [page]: { ...currentPageData, ...data }
      };
    });
  };

  const startLoading = (page: keyof ReadingState) => {
    setStates((prev) => ({
      ...prev,
      [page]: { ...(prev[page] || {}), loading: true, error: null }
    }));
  };

  const finishLoading = (page: keyof ReadingState, resultData: any, error: string | null = null) => {
    setStates((prev) => ({
      ...prev,
      [page]: { ...(prev[page] || {}), ...resultData, loading: false, error }
    }));
  };

  const resetState = (page: keyof ReadingState) => {
    setStates((prev) => ({ ...prev, [page]: null }));
  };

  return (
    <ReadingContext.Provider value={{ states, updateState, resetState, startLoading, finishLoading }}>
      {children}
    </ReadingContext.Provider>
  );
};

export const useReading = () => {
  const context = useContext(ReadingContext);
  if (!context) {
    throw new Error('useReading must be used within a ReadingProvider');
  }
  return context;
};
