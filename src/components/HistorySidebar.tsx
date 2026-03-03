
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Clock, Trash2 } from 'lucide-react';
import { HistoryItem, getHistory, clearHistory } from '../lib/history';
import { cn } from '../lib/utils';

interface HistorySidebarProps {
  type: HistoryItem['type'];
  onSelect: (item: HistoryItem) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ type, onSelect, isOpen, onClose }) => {
  const [history, setHistory] = React.useState<HistoryItem[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setHistory(getHistory(type));
    }
  }, [isOpen, type]);

  const handleClear = () => {
    clearHistory(type);
    setHistory([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-mystic-bg border-l border-white/10 z-50 flex flex-col"
          >
            <div className="p-6 border-bottom border-white/10 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-mystic-gold" />
                <h2 className="text-xl font-serif font-bold text-white">Lịch sử xem</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-20 opacity-40">
                  <Clock className="w-12 h-12 mx-auto mb-4" />
                  <p>Chưa có lịch sử nào</p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-mystic-gold font-bold uppercase tracking-wider">
                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <h3 className="text-white font-medium line-clamp-1">{item.title}</h3>
                  </motion.div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <div className="p-6 border-t border-white/10">
                <button
                  onClick={handleClear}
                  className="w-full py-3 flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all font-bold text-sm uppercase tracking-widest"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa tất cả lịch sử
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
