
import React, { createContext, useContext, useState, ReactNode } from 'react';

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

interface ReadingContextType {
  states: ReadingState;
  updateState: (page: keyof ReadingState, data: Partial<ReadingPageData>) => void;
  resetState: (page: keyof ReadingState) => void;
  startLoading: (page: keyof ReadingState) => void;
  finishLoading: (page: keyof ReadingState, resultData: any, error?: string | null) => void;
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

export const ReadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [states, setStates] = useState<ReadingState>({
    physiognomy: null,
    tarot: null,
    iching: null,
    divination: null,
    numerology: null,
  });

  const updateState = (page: keyof ReadingState, data: Partial<ReadingPageData>) => {
    setStates((prev) => ({
      ...prev,
      [page]: { ...(prev[page] || {}), ...data }
    }));
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
