import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Sparkles, RefreshCw, Loader2, History as HistoryIcon } from 'lucide-react';
import { ai, MODELS, safeGenerateContent } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { HistorySidebar } from '../components/HistorySidebar';
import { saveHistory, HistoryItem } from '../lib/history';

export const DivinationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState<('head' | 'tail')[]>([]);
  const [question, setQuestion] = useState('');
  const [tossCount, setTossCount] = useState(0);
  const [resultType, setResultType] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const tossCoins = async () => {
    if (tossCount >= 3) {
      setError("Bạn đã gieo đủ 3 lần. Vui lòng quay lại sau hoặc gieo quẻ khác.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    setTossCount(prev => prev + 1);
    
    // Simulate coin toss
    const newCoins: ('head' | 'tail')[] = [
      Math.random() > 0.5 ? 'head' : 'tail',
      Math.random() > 0.5 ? 'head' : 'tail'
    ];
    setCoins(newCoins);

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

    try {
      const prompt = `Tôi vừa gieo đài âm dương và nhận được kết quả: ${type}. 
      Câu hỏi của tôi: "${question}"
      Lần gieo thứ: ${tossCount + 1}/3
      Hãy giải nghĩa chi tiết kết quả này theo phong tục dân gian Việt Nam, dựa sát vào nội dung câu hỏi để đưa ra lời khuyên thực tế nhất.`;

      const response = await safeGenerateContent({
        model: MODELS.TEXT,
        contents: [{ parts: [{ text: prompt }] }],
      });
      const resultText = response.text || "Không thể giải đài.";
      setResult(resultText);

      // Save to history
      saveHistory({
        type: 'divination',
        title: question || `Gieo Đài Âm Dương (${typeName})`,
        result: {
          question,
          tossCount: tossCount + 1,
          coins: newCoins,
          resultType: typeName,
          interpretation: resultText
        }
      });
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
        setError("Hệ thống đang quá tải (Rate Limit). Vui lòng đợi 1-2 phút và thử lại.");
      } else {
        setError("Đã xảy ra lỗi khi giải đài. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setQuestion(item.result.question || '');
    setTossCount(item.result.tossCount);
    setCoins(item.result.coins);
    setResultType(item.result.resultType);
    setResult(item.result.interpretation);
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all text-mystic-gold text-sm font-bold uppercase tracking-widest"
        >
          <HistoryIcon className="w-4 h-4" /> Lịch sử
        </button>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Gieo Đài Âm Dương</h1>
        <p className="text-mystic-gold tracking-[0.2em] uppercase text-sm">
          Xin keo, hỏi ý thần linh theo phong tục cổ truyền
        </p>
      </div>

      <div className="flex flex-col items-center gap-12">
        <div className="w-full max-w-2xl">
          <div className="glass-morphism p-6 rounded-2xl border-mystic-gold/20 mb-8">
            <label className="block text-mystic-gold text-xs uppercase tracking-widest mb-2 font-bold">Câu hỏi của bạn (Bắt buộc)</label>
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Nhập vấn đề bạn muốn xin đài..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-all"
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-gray-500 text-xs italic">Thành tâm khấn nguyện trước khi gieo</p>
              <p className="text-mystic-gold text-xs font-bold">Lần gieo: {tossCount}/3</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-12">
            {coins.length > 0 ? (
              coins.map((side, i) => (
                <div key={i} className="w-32 h-48 flex flex-col items-center gap-4">
                  <motion.div
                    initial={{ rotateY: 0, y: -100 }}
                    animate={{ rotateY: side === 'head' ? 360 : 180, y: 0 }}
                    transition={{ duration: 0.8, type: 'spring' }}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-mystic-gold/20 to-black border-2 border-mystic-gold flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.2)] overflow-hidden relative group"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-mystic-gold/10 via-transparent to-transparent opacity-50" />
                    <img 
                      src={side === 'head' 
                        ? "https://img.icons8.com/fluency/240/sun.png" 
                        : "https://img.icons8.com/fluency/240/full-moon.png"
                      }
                      alt={side}
                      className="w-20 h-20 object-contain z-10 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-mystic-gold/5 to-transparent" />
                  </motion.div>
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-serif font-bold text-mystic-gold uppercase tracking-tighter">
                      {side === 'head' ? 'NGỬA' : 'SẤP'}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      {side === 'head' ? '(Dương)' : '(Âm)'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-gray-700">
                  <Coins className="w-12 h-12" />
                </div>
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-gray-700">
                  <Coins className="w-12 h-12" />
                </div>
              </>
            )}
          </div>
          
          <div className="bg-mystic-gold/10 px-6 py-2 rounded-full border border-mystic-gold/20 flex flex-col items-center gap-1">
            {resultType && (
              <motion.p 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-mystic-gold font-serif font-bold text-lg tracking-widest mb-1"
              >
                KẾT QUẢ: {resultType}
              </motion.p>
            )}
            <p className="text-mystic-gold text-[10px] font-bold text-center max-w-md tracking-wide opacity-60">
              QUY TẮC: 1 SẤP 1 NGỬA (THÁNH ĐÀI - TỐT) • 2 NGỬA (TIẾU ĐÀI - CƯỜI) • 2 SẤP (ÂM ĐÀI - KHÔNG ĐƯỢC)
            </p>
          </div>
        </div>

        <button
          disabled={loading || !question.trim() || tossCount >= 3}
          onClick={tossCoins}
          className="px-12 py-4 bg-mystic-gold text-black rounded-full font-bold tracking-widest uppercase hover:bg-mystic-gold/80 transition-all gold-glow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang xin đài...' : tossCount >= 3 ? 'Đã hết lượt gieo' : 'Gieo Đài'}
        </button>
        {!question.trim() && (
          <p className="text-red-500/70 text-xs font-bold animate-pulse -mt-8">Vui lòng nhập câu hỏi trước khi gieo đài</p>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-morphism p-8 rounded-3xl border-mystic-gold/30 w-full markdown-body"
            >
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-mystic-gold" />
                <h2 className="text-2xl font-serif font-bold text-mystic-gold">Lời Giải Đài</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
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
    </div>
  );
};
