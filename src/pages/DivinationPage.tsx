import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Sparkles, RefreshCw, Loader2, History as HistoryIcon, Download } from 'lucide-react';
import { ai, MODELS, SYSTEM_PROMPTS, safeGenerateContent, getCurrentContext } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';
import { HistorySidebar } from '../components/HistorySidebar';
import { saveHistory, HistoryItem } from '../lib/history';
import { useReading } from '../context/ReadingContext';
import { DownloadModal, UserData } from '../components/DownloadModal';
import { downloadAsFile } from '../lib/download';
import { downloadAsPDF } from '../lib/pdf';

export const DivinationPage: React.FC = () => {
  const { states, updateState, resetState, startLoading, finishLoading } = useReading();
  const pageState = states.divination || {};

  const [loading, setLoading] = useState(pageState.loading || false);
  const [result, setResult] = useState<string | null>(pageState.result || null);
  const [error, setError] = useState<string | null>(pageState.error || null);
  const [coins, setCoins] = useState<('head' | 'tail')[]>(pageState.coins || []);
  const [question, setQuestion] = useState(pageState.question || '');
  const [tossCount, setTossCount] = useState(pageState.tossCount || 0);
  const [resultType, setResultType] = useState<string | null>(pageState.resultType || null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync with context
  useEffect(() => {
    if (pageState.loading !== undefined && pageState.loading !== loading) setLoading(pageState.loading);
    if (pageState.result !== undefined && pageState.result !== result) setResult(pageState.result);
    if (pageState.error !== undefined && pageState.error !== error) setError(pageState.error);
    if (pageState.coins !== undefined && JSON.stringify(pageState.coins) !== JSON.stringify(coins)) setCoins(pageState.coins);
    if (pageState.question !== undefined && pageState.question !== question) setQuestion(pageState.question);
    if (pageState.tossCount !== undefined && pageState.tossCount !== tossCount) setTossCount(pageState.tossCount);
    if (pageState.resultType !== undefined && pageState.resultType !== resultType) setResultType(pageState.resultType);
  }, [pageState]);

  useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [result]);

  const handleReset = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setResult(null);
      setCoins([]);
      setQuestion('');
      setTossCount(0);
      setResultType(null);
      setError(null);
      resetState('divination');
      setIsRefreshing(false);
    }, 600);
  };

  const tossCoins = async () => {
    if (tossCount >= 3) {
      setError("Bạn đã gieo đủ 3 lần. Vui lòng quay lại sau hoặc gieo quẻ khác.");
      return;
    }

    startLoading('divination');
    const newTossCount = tossCount + 1;
    setTossCount(newTossCount);
    updateState('divination', { tossCount: newTossCount });
    
    // Simulate coin toss
    const newCoins: ('head' | 'tail')[] = [
      Math.random() > 0.5 ? 'head' : 'tail',
      Math.random() > 0.5 ? 'head' : 'tail'
    ];
    setCoins(newCoins);
    updateState('divination', { coins: newCoins });

    // Determine result type
    let type = "";
    let typeName = "";
    if (newCoins[0] === 'head' && newCoins[1] === 'tail' || newCoins[0] === 'tail' && newCoins[1] === 'head') {
      type = "Âm Dương (Thánh Đài) - Rất tốt, vạn sự hanh thông.";
      typeName = "THÁNH ĐÀI (TỐT)";
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7e22ce', '#facc15']
      });
    } else if (newCoins[0] === 'head' && newCoins[1] === 'head') {
      type = "Dương Dương (Tiếu Đài) - Thần linh mỉm cười, cần thành tâm hơn.";
      typeName = "TIẾU ĐÀI (CƯỜI)";
    } else {
      type = "Âm Âm (Âm Đài) - Chưa được, cần kiên nhẫn chờ đợi.";
      typeName = "ÂM ĐÀI (KHÔNG ĐƯỢC)";
    }
    setResultType(typeName);
    updateState('divination', { resultType: typeName });

    try {
      const prompt = `Tôi vừa gieo đài âm dương và nhận được kết quả: ${type}. 
      Câu hỏi của tôi: "${question}"
      Lần gieo thứ: ${newTossCount}/3
      Hãy giải nghĩa chi tiết kết quả này theo phong tục dân gian Việt Nam, dựa sát vào nội dung câu hỏi để đưa ra lời khuyên thực tế nhất.`;

      const response = await safeGenerateContent({
        model: MODELS.TEXT,
        contents: [{ parts: [{ text: SYSTEM_PROMPTS.DIVINATION + "\n\n" + getCurrentContext() }, { text: prompt }] }],
      });
      const resultText = response.text || "Không thể giải đài.";
      
      // Save to history
      saveHistory({
        type: 'divination',
        title: question || `Gieo Đài Âm Dương (${typeName})`,
        result: {
          question,
          tossCount: newTossCount,
          coins: newCoins,
          resultType: typeName,
          interpretation: resultText
        }
      });

      finishLoading('divination', { 
        result: resultText,
        coins: newCoins,
        tossCount: newTossCount,
        resultType: typeName
      });
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Đã xảy ra lỗi khi giải đài. Vui lòng thử lại.";
      if (err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
        errorMsg = "Hệ thống đang quá tải (Rate Limit). Vui lòng đợi 1-2 phút và thử lại.";
      }
      finishLoading('divination', {}, errorMsg);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setQuestion(item.result.question || '');
    setTossCount(item.result.tossCount);
    setCoins(item.result.coins);
    setResultType(item.result.resultType);
    setResult(item.result.interpretation);
  };

  const handleDownload = (userData: UserData, format: 'txt' | 'pdf') => {
    if (!result) return;
    if (format === 'pdf') {
      downloadAsPDF('divination-result', 'gieo-dai-am-duong.pdf', userData);
    } else {
      downloadAsFile(result, 'gieo-dai-am-duong.txt', userData);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4">Gieo Đài Âm Dương</h1>
        <p className="text-mystic-gold tracking-[0.15em] md:tracking-[0.2em] uppercase text-[10px] md:text-sm px-4 mb-6">
          Xin keo, hỏi ý thần linh theo phong tục cổ truyền
        </p>
        <div className="flex justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-mystic-gold/30 transition-all text-mystic-gold text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(250,204,21,0.1)] hover:shadow-[0_0_20px_rgba(250,204,21,0.2)]"
            title="Làm mới trang"
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </motion.div>
            Làm mới
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-mystic-gold/30 transition-all text-mystic-gold text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(250,204,21,0.1)] hover:shadow-[0_0_20px_rgba(250,204,21,0.2)]"
          >
            <HistoryIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /> Lịch sử
          </motion.button>
          {result && (
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDownloadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-mystic-purple/20 rounded-full border border-mystic-purple/30 transition-all text-mystic-gold text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(126,34,206,0.2)] hover:shadow-[0_0_20px_rgba(126,34,206,0.3)]"
            >
              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> Tải Dữ Liệu
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-8 md:gap-12">
        <div className="w-full max-w-2xl">
          <div className="glass-morphism p-5 md:p-6 rounded-2xl border-mystic-gold/20 mb-6 md:mb-8">
            <label className="block text-mystic-gold text-[10px] md:text-xs uppercase tracking-widest mb-2 font-bold">Câu hỏi của bạn (Bắt buộc)</label>
            <input 
              type="text" 
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                updateState('divination', { question: e.target.value });
              }}
              placeholder="Nhập vấn đề bạn muốn xin đài..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-all text-sm md:text-base"
            />
            <div className="mt-3 flex justify-between items-center">
              <p className="text-gray-500 text-[10px] md:text-xs italic">Thành tâm khấn nguyện trước khi gieo</p>
              <p className="text-mystic-gold text-[10px] md:text-xs font-bold">Lần gieo: {tossCount}/3</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 md:gap-8 w-full">
          <div className="flex gap-6 md:gap-12 justify-center w-full">
            {coins.length > 0 ? (
              coins.map((side, i) => (
                <div key={i} className="w-24 md:w-32 h-40 md:h-48 flex flex-col items-center gap-3 md:gap-4">
                  <motion.div
                    initial={{ rotateY: 0, y: -100 }}
                    animate={{ rotateY: side === 'head' ? 360 : 180, y: 0 }}
                    transition={{ duration: 0.8, type: 'spring' }}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-mystic-gold/20 to-black border-2 border-mystic-gold flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.2)] overflow-hidden relative group"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-mystic-gold/10 via-transparent to-transparent opacity-50" />
                    <img 
                      src={side === 'head' 
                        ? "https://img.icons8.com/fluency/240/sun.png" 
                        : "https://img.icons8.com/fluency/240/full-moon.png"
                      }
                      alt={side}
                      className="w-14 h-14 md:w-20 md:h-20 object-contain z-10 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-mystic-gold/5 to-transparent" />
                  </motion.div>
                  <div className="flex flex-col items-center">
                    <span className="text-base md:text-lg font-serif font-bold text-mystic-gold uppercase tracking-tighter">
                      {side === 'head' ? 'NGỬA' : 'SẤP'}
                    </span>
                    <span className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      {side === 'head' ? '(Dương)' : '(Âm)'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-gray-700">
                  <Coins className="w-8 h-8 md:w-12 md:h-12" />
                </div>
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-gray-700">
                  <Coins className="w-8 h-8 md:w-12 md:h-12" />
                </div>
              </>
            )}
          </div>
          
          <div className="bg-mystic-gold/10 px-4 md:px-6 py-2 rounded-full border border-mystic-gold/20 flex flex-col items-center gap-1 w-full max-w-sm md:max-w-md mx-auto">
            {resultType && (
              <motion.p 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-mystic-gold font-serif font-bold text-base md:text-lg tracking-widest mb-1"
              >
                KẾT QUẢ: {resultType}
              </motion.p>
            )}
            <p className="text-mystic-gold text-[8px] md:text-[10px] font-bold text-center tracking-wide opacity-60">
              QUY TẮC: 1 SẤP 1 NGỬA (THÁNH ĐÀI - TỐT) • 2 NGỬA (TIẾU ĐÀI - CƯỜI) • 2 SẤP (ÂM ĐÀI - KHÔNG ĐƯỢC)
            </p>
          </div>
        </div>

        <button
          disabled={loading || !question.trim() || tossCount >= 3}
          onClick={tossCoins}
          className="w-full max-w-[280px] md:w-auto px-10 md:px-12 py-3.5 md:py-4 bg-mystic-gold text-black rounded-full font-bold tracking-widest uppercase hover:bg-mystic-gold/80 transition-all gold-glow disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-base"
        >
          {loading ? 'Đang xin đài...' : tossCount >= 3 ? 'Đã hết lượt gieo' : 'Gieo Đài'}
        </button>
        {!question.trim() && (
          <p className="text-red-500/70 text-[10px] md:text-xs font-bold animate-pulse -mt-6 md:-mt-8">Vui lòng nhập câu hỏi trước khi gieo đài</p>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              id="divination-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-morphism p-8 rounded-3xl border-mystic-gold/30 w-full"
            >
              <div className="flex items-center gap-3 mb-6 border-b border-mystic-gold/20 pb-4">
                <Sparkles className="w-6 h-6 text-mystic-gold" />
                <h2 className="text-2xl font-serif font-bold text-mystic-gold">Lời Giải Đài</h2>
              </div>
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
              <button
                onClick={() => { setCoins([]); setResult(null); setResultType(null); }}
                className="mt-8 flex items-center gap-2 text-mystic-gold hover:underline"
              >
                <RefreshCw className="w-4 h-4" /> Gieo lại
              </button>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-morphism p-8 rounded-3xl border-red-500/30 w-full text-center"
            >
              <RefreshCw className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-serif text-red-500 mb-2">Thông báo</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={tossCoins}
                className="px-8 py-3 bg-mystic-gold text-black rounded-full font-bold uppercase text-xs tracking-widest"
              >
                Thử lại
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <HistorySidebar
        type="divination"
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={handleSelectHistory}
      />
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        onDownload={handleDownload}
        title="Gieo Đài Âm Dương"
      />
    </div>
  );
};
