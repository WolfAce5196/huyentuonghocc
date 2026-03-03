import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Sparkles, RefreshCw, Loader2, History as HistoryIcon } from 'lucide-react';
import { ai, MODELS, SYSTEM_PROMPTS, safeGenerateContent } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import { TAROT_CARDS_DATA, TarotCard } from '../constants/tarotData';
import { TarotFlipCard } from '../components/TarotFlipCard';
import { cn } from '../lib/utils';
import { HistorySidebar } from '../components/HistorySidebar';
import { saveHistory, HistoryItem } from '../lib/history';

export const TarotPage: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'triple' | null>(null);
  const [selectedCards, setSelectedCards] = useState<{ card: TarotCard; isReversed: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [question, setQuestion] = useState('');
  const [topic, setTopic] = useState('Tổng quan');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const topics = ['Tổng quan', 'Tình duyên', 'Sự nghiệp', 'Tài chính', 'Sức khỏe', 'Mối quan hệ'];

  const drawCards = (count: number) => {
    const shuffled = [...TAROT_CARDS_DATA].sort(() => Math.random() - 0.5);
    const drawn = shuffled.slice(0, count).map(card => ({
      card,
      isReversed: Math.random() > 0.5 // 50/50 chance for reversed
    }));
    setSelectedCards(drawn);
    setRevealedCount(0);
    setInterpretation(null);
    setError(null);
  };

  const handleReveal = () => {
    setRevealedCount(prev => {
      const next = prev + 1;
      if (next === selectedCards.length) {
        analyzeReading();
      }
      return next;
    });
  };

  const analyzeReading = async () => {
    setLoading(true);
    setError(null);
    try {
      const cardDetails = selectedCards.map((c, idx) => {
        const position = mode === 'triple' 
          ? (idx === 0 ? 'Quá khứ' : idx === 1 ? 'Hiện tại' : 'Tương lai')
          : 'Lời khuyên';
        return `- Vị trí ${position}: Lá ${c.card.name_en} (${c.isReversed ? 'Ngược' : 'Xuôi'})`;
      }).join('\n');

      const prompt = `Tôi vừa rút được các lá bài Tarot sau:\n${cardDetails}\n\nChế độ xem: ${mode === 'single' ? 'Lời khuyên/Thông điệp' : 'Trải bài 3 lá (Quá khứ - Hiện tại - Tương lai)'}.\n\nBối cảnh quan trọng:\n- Câu hỏi cụ thể: "${question}"\n- Lĩnh vực: ${topic}\n\nYêu cầu luận giải:\n1. Hãy giải mã ý nghĩa của từng lá bài dựa TRỰC TIẾP và SÁT NGHĨA nhất với câu hỏi và lĩnh vực đã chọn.\n2. Đưa ra lời khuyên thực tế, cụ thể cho vấn đề này.\n3. Giữ phong cách huyền bí nhưng phải rõ ràng, không chung chung.`;

      const response = await safeGenerateContent({
        model: MODELS.TEXT,
        contents: [{ parts: [{ text: SYSTEM_PROMPTS.TAROT + "\n\n" + prompt }] }],
      });
      const resultText = response.text || "Không thể giải mã.";
      setInterpretation(resultText);
      
      // Save to history
      saveHistory({
        type: 'tarot',
        title: question || `Xem Tarot (${topic})`,
        result: {
          mode,
          topic,
          question,
          interpretation: resultText,
          cards: selectedCards.map(c => ({ name: c.card.name_en, isReversed: c.isReversed }))
        }
      });
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
        setError("Hệ thống đang quá tải (Rate Limit). Vui lòng đợi 1-2 phút và thử lại.");
      } else {
        setError("Đã có lỗi xảy ra khi kết nối với vũ trụ. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setQuestion(item.result.question || '');
    setTopic(item.result.topic || 'Tổng quan');
    setMode(item.result.mode);
    setInterpretation(item.result.interpretation);
    // Find cards from data
    const restoredCards = item.result.cards.map((c: any) => ({
      card: TAROT_CARDS_DATA.find(tc => tc.name_en === c.name) || TAROT_CARDS_DATA[0],
      isReversed: c.isReversed
    }));
    setSelectedCards(restoredCards);
    setRevealedCount(restoredCards.length);
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all text-mystic-gold text-sm font-bold uppercase tracking-widest"
        >
          <HistoryIcon className="w-4 h-4" /> Lịch sử
        </button>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Bói Bài Tarot</h1>
        <p className="text-mystic-gold tracking-[0.2em] uppercase text-sm">
          Lắng nghe thông điệp từ vũ trụ qua những lá bài
        </p>
      </div>

      {!mode ? (
        <div className="max-w-4xl mx-auto">
          <div className="glass-morphism p-8 rounded-3xl mb-12 border-mystic-purple/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-mystic-gold text-xs uppercase tracking-widest mb-2 font-bold">
                  Bạn đang trăn trở điều gì? <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ví dụ: Công việc sắp tới của tôi thế nào?..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-mystic-gold text-xs uppercase tracking-widest mb-2 font-bold">
                  Lĩnh vực quan tâm <span className="text-red-500">*</span>
                </label>
                <select 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-all appearance-none cursor-pointer"
                >
                  {topics.map(t => <option key={t} value={t} className="bg-mystic-bg">{t}</option>)}
                </select>
              </div>
            </div>
            {!question.trim() && (
              <p className="text-red-500/70 text-center text-xs font-bold animate-pulse">
                Vui lòng nhập câu hỏi để kết nối với năng lượng vũ trụ
              </p>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <motion.button
              whileHover={question.trim() ? { scale: 1.05 } : {}}
              whileTap={question.trim() ? { scale: 0.95 } : {}}
              disabled={!question.trim()}
              onClick={() => { setMode('single'); drawCards(1); }}
              className="glass-morphism p-12 rounded-3xl w-full max-w-sm group hover:border-mystic-gold transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-16 h-16 text-mystic-purple mb-6 mx-auto group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-serif font-bold mb-2">Rút 1 Lá</h3>
              <p className="text-gray-500">Thông điệp & Lời khuyên nhanh</p>
            </motion.button>
            <motion.button
              whileHover={question.trim() ? { scale: 1.05 } : {}}
              whileTap={question.trim() ? { scale: 0.95 } : {}}
              disabled={!question.trim()}
              onClick={() => { setMode('triple'); drawCards(3); }}
              className="glass-morphism p-12 rounded-3xl w-full max-w-sm group hover:border-mystic-gold transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="flex gap-2 justify-center mb-6">
                <CreditCard className="w-10 h-10 text-mystic-purple group-hover:rotate-[-10deg] transition-transform" />
                <CreditCard className="w-10 h-10 text-mystic-purple group-hover:translate-y-[-5px] transition-transform" />
                <CreditCard className="w-10 h-10 text-mystic-purple group-hover:rotate-[10deg] transition-transform" />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-2">Rút 3 Lá</h3>
              <p className="text-gray-500">Quá khứ - Hiện tại - Tương lai</p>
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="space-y-20">
          <div className={cn(
            "grid gap-2 sm:gap-6 md:gap-12 justify-center items-start mx-auto w-full px-2 sm:px-4",
            mode === 'triple' 
              ? "grid-cols-3 max-w-6xl" 
              : "grid-cols-1 max-w-sm"
          )}>
            {selectedCards.map((item, idx) => (
              <div key={idx} className="flex justify-center">
                <TarotFlipCard
                  card={item.card}
                  isReversed={item.isReversed}
                  onReveal={handleReveal}
                  label={mode === 'triple' ? (idx === 0 ? 'Quá khứ' : idx === 1 ? 'Hiện tại' : 'Tương lai') : undefined}
                />
              </div>
            ))}
          </div>

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="relative w-20 h-20 mb-6">
                  <Loader2 className="w-full h-full text-mystic-gold animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-mystic-gold animate-pulse" />
                </div>
                <p className="text-mystic-gold font-serif italic text-xl">Đang giải mã thông điệp từ các vì sao...</p>
              </motion.div>
            )}

            {interpretation && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-morphism p-8 md:p-12 rounded-3xl border-mystic-gold/30 max-w-5xl mx-auto markdown-body shadow-[0_0_50px_rgba(126,34,206,0.1)]"
              >
                <div className="flex items-center gap-4 mb-8 border-b border-mystic-gold/20 pb-6">
                  <div className="w-12 h-12 rounded-full bg-mystic-gold/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-mystic-gold" />
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-mystic-gold">Luận Giải Chi Tiết</h2>
                </div>
                
                <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-mystic-gold prose-strong:text-mystic-purple">
                  <ReactMarkdown>{interpretation}</ReactMarkdown>
                </div>
                
                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <p className="text-gray-500 text-sm italic">Hãy suy ngẫm về những thông điệp này trong không gian yên tĩnh.</p>
                  <button
                    onClick={() => { setMode(null); setSelectedCards([]); setInterpretation(null); }}
                    className="flex items-center gap-2 px-10 py-4 bg-mystic-purple/20 hover:bg-mystic-purple/40 text-mystic-purple rounded-full transition-all border border-mystic-purple/30 font-bold tracking-widest uppercase text-xs"
                  >
                    <RefreshCw className="w-4 h-4" /> Rút lại bộ bài mới
                  </button>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-morphism p-8 rounded-3xl border-red-500/30 max-w-2xl mx-auto text-center"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RefreshCw className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-serif text-red-500 mb-2">Thông báo</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <button
                  onClick={analyzeReading}
                  className="px-8 py-3 bg-mystic-gold text-black rounded-full font-bold uppercase text-xs tracking-widest"
                >
                  Thử lại
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <HistorySidebar
        type="tarot"
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={handleSelectHistory}
      />
    </div>
  );
};
