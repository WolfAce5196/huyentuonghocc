import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Sparkles, RefreshCw, Loader2, History as HistoryIcon, Download } from 'lucide-react';
import { ai, MODELS, SYSTEM_PROMPTS, safeGenerateContentStream, getCurrentContext } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TAROT_CARDS_DATA, TarotCard } from '../constants/tarotData';
import { TarotFlipCard } from '../components/TarotFlipCard';
import { cn } from '../lib/utils';
import { HistorySidebar } from '../components/HistorySidebar';
import { saveHistory, HistoryItem } from '../lib/history';
import { useReading } from '../context/ReadingContext';
import { DownloadModal, UserData } from '../components/DownloadModal';
import { downloadAsFile } from '../lib/download';
import { downloadTarotPDF, preRenderPDFContent } from '../lib/pdf';

export const TarotPage: React.FC = () => {
  const { states, updateState, resetState, startLoading, finishLoading } = useReading();
  const pageState = states.tarot || {};

  const [mode, setMode] = useState<'single' | 'triple' | null>(pageState.mode || null);
  const [selectedCards, setSelectedCards] = useState<{ card: TarotCard; isReversed: boolean }[]>(pageState.selectedCards || []);
  const [loading, setLoading] = useState(pageState.loading || false);
  const [interpretation, setInterpretation] = useState<string | null>(pageState.result || null);
  const [error, setError] = useState<string | null>(pageState.error || null);
  const [revealedIndices, setRevealedIndices] = useState<number[]>(pageState.revealedIndices || []);
  const [question, setQuestion] = useState(pageState.question || '');
  const [topic, setTopic] = useState(pageState.topic || 'Tổng quan');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [preRenderedPDF, setPreRenderedPDF] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Sync with context - only when pageState changes from OUTSIDE (e.g. background finish or history select)
  useEffect(() => {
    if (pageState.loading !== undefined && pageState.loading !== loading) setLoading(pageState.loading);
    if (pageState.result !== undefined && pageState.result !== interpretation) setInterpretation(pageState.result);
    if (pageState.error !== undefined && pageState.error !== error) setError(pageState.error);
    if (pageState.mode !== undefined && pageState.mode !== mode) setMode(pageState.mode);
    if (pageState.selectedCards !== undefined && JSON.stringify(pageState.selectedCards) !== JSON.stringify(selectedCards)) {
      setSelectedCards(pageState.selectedCards);
    }
    if (pageState.revealedIndices !== undefined && JSON.stringify(pageState.revealedIndices) !== JSON.stringify(revealedIndices)) {
      setRevealedIndices(pageState.revealedIndices);
    }
    if (pageState.question !== undefined && pageState.question !== question) setQuestion(pageState.question);
    if (pageState.topic !== undefined && pageState.topic !== topic) setTopic(pageState.topic);
  }, [pageState]);

  // Scroll to top of content when mode or topic changes
  useEffect(() => {
    if (mode || topic !== 'Tổng quan') {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [mode, topic]);

  useEffect(() => {
    if (interpretation) {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [interpretation]);

  useEffect(() => {
    if (interpretation && selectedCards.length > 0) {
      const timer = setTimeout(async () => {
        try {
          const resources = selectedCards.map(card => ({
            type: 'image' as const,
            content: card.card.image_url,
            label: card.card.name_en
          }));
          const imgData = await preRenderPDFContent('Luận Giải Bài Tarot', interpretation, resources);
          setPreRenderedPDF(imgData);
        } catch (err) {
          console.error("Pre-render failed:", err);
        }
      }, 1000); // Wait for animations to settle
      return () => clearTimeout(timer);
    }
  }, [interpretation, selectedCards]);

  const handleReset = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setMode(null);
      setSelectedCards([]);
      setInterpretation(null);
      setRevealedIndices([]);
      setQuestion('');
      setTopic('Tổng quan');
      resetState('tarot');
      setIsRefreshing(false);
    }, 600);
  };

  const topics = ['Tổng quan', 'Tình duyên', 'Sự nghiệp', 'Tài chính', 'Sức khỏe', 'Mối quan hệ'];

  const drawCards = (count: number) => {
    const shuffled = [...TAROT_CARDS_DATA].sort(() => Math.random() - 0.5);
    const drawn = shuffled.slice(0, count).map(card => ({
      card,
      isReversed: Math.random() > 0.5 // 50/50 chance for reversed
    }));
    
    const newMode = count === 1 ? 'single' : 'triple';
    setMode(newMode);
    setSelectedCards(drawn);
    setRevealedIndices([]);
    setInterpretation(null);
    setError(null);
    
    updateState('tarot', { 
      mode: newMode, 
      selectedCards: drawn, 
      revealedIndices: [], 
      result: null, 
      error: null 
    });
  };

  const handleReveal = (index: number) => {
    setRevealedIndices(prev => {
      if (prev.includes(index)) return prev;
      const nextIndices = [...prev, index];
      updateState('tarot', { revealedIndices: nextIndices });
      if (nextIndices.length === selectedCards.length) {
        analyzeReading();
      }
      return nextIndices;
    });
  };

  const analyzeReading = async () => {
    startLoading('tarot');
    setInterpretation(''); // Clear previous interpretation
    try {
      const cardDetails = selectedCards.map((c, idx) => {
        const position = mode === 'triple' 
          ? (idx === 0 ? 'Quá khứ' : idx === 1 ? 'Hiện tại' : 'Tương lai')
          : 'Lời khuyên';
        return `- Vị trí ${position}: Lá ${c.card.name_en} (${c.isReversed ? 'Ngược' : 'Xuôi'})`;
      }).join('\n');

      const prompt = `Tôi vừa rút được các lá bài Tarot sau:\n${cardDetails}\n\nChế độ xem: ${mode === 'single' ? 'Lời khuyên/Thông điệp' : 'Trải bài 3 lá (Quá khứ - Hiện tại - Tương lai)'}.\n\nBối cảnh quan trọng:\n- Câu hỏi cụ thể: "${question}"\n- Lĩnh vực: ${topic}\n\nYêu cầu luận giải:\n1. Hãy giải mã ý nghĩa của từng lá bài dựa TRỰC TIẾP và SÁT NGHĨA nhất với câu hỏi và lĩnh vực đã chọn.\n2. Đưa ra lời khuyên thực tế, cụ thể cho vấn đề này.\n3. Giữ phong cách huyền bí nhưng phải rõ ràng, không chung chung.`;

      const stream = safeGenerateContentStream({
        model: MODELS.TEXT,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_PROMPTS.TAROT + "\n\n" + getCurrentContext()
        }
      });

      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        setInterpretation(fullText);
      }
      
      // Save to history
      saveHistory({
        type: 'tarot',
        title: question || `Xem Tarot (${topic})`,
        result: {
          mode,
          topic,
          question,
          interpretation: fullText,
          cards: selectedCards.map(c => ({ name: c.card.name_en, isReversed: c.isReversed }))
        }
      });

      finishLoading('tarot', { result: fullText });
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Đã có lỗi xảy ra khi kết nối với vũ trụ. Vui lòng thử lại.";
      if (err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
        errorMsg = "Hệ thống đang quá tải (Rate Limit). Vui lòng đợi 1-2 phút và thử lại.";
      }
      finishLoading('tarot', {}, errorMsg);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    const q = item.result.question || '';
    const t = item.result.topic || 'Tổng quan';
    const m = item.result.mode;
    const interp = item.result.interpretation;
    
    setQuestion(q);
    setTopic(t);
    setMode(m);
    setInterpretation(interp);
    
    // Find cards from data
    const restoredCards = item.result.cards.map((c: any) => ({
      card: TAROT_CARDS_DATA.find(tc => tc.name_en === c.name) || TAROT_CARDS_DATA[0],
      isReversed: c.isReversed
    }));
    setSelectedCards(restoredCards);
    const indices = restoredCards.map((_: any, i: number) => i);
    setRevealedIndices(indices);
    
    updateState('tarot', {
      question: q,
      topic: t,
      mode: m,
      result: interp,
      selectedCards: restoredCards,
      revealedIndices: indices
    });
  };

  const handleDownload = (userData: UserData, format: 'txt' | 'pdf') => {
    if (!interpretation) return;
    if (format === 'pdf') {
      const cards = selectedCards.map(c => ({
        name: c.card.name_en,
        image: c.card.image_url
      }));
      downloadTarotPDF(userData, interpretation, cards, preRenderedPDF || undefined);
    } else {
      downloadAsFile(interpretation, 'tarot.txt', userData);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto" ref={contentRef}>
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4">Bói Bài Tarot</h1>
        <p className="text-mystic-gold tracking-[0.15em] md:tracking-[0.2em] uppercase text-[10px] md:text-sm px-4 mb-6">
          Lắng nghe thông điệp từ vũ trụ qua những lá bài
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
          {interpretation && (
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

      {!mode ? (
        <div className="max-w-4xl mx-auto">
          <div className="glass-morphism p-5 md:p-8 rounded-3xl mb-8 md:mb-12 border-mystic-purple/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              <div>
                <label className="block text-mystic-gold text-[10px] md:text-xs uppercase tracking-widest mb-2 font-bold">
                  Bạn đang trăn trở điều gì? <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                  }}
                  placeholder="Ví dụ: Công việc sắp tới của tôi thế nào?..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-all text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-mystic-gold text-[10px] md:text-xs uppercase tracking-widest mb-2 font-bold">
                  Lĩnh vực quan tâm <span className="text-red-500">*</span>
                </label>
                <select 
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-all appearance-none cursor-pointer text-sm md:text-base"
                >
                  {topics.map(t => <option key={t} value={t} className="bg-mystic-bg">{t}</option>)}
                </select>
              </div>
            </div>
            {!question.trim() && (
              <p className="text-red-500/70 text-center text-[10px] md:text-xs font-bold animate-pulse">
                Vui lòng nhập câu hỏi để kết nối với năng lượng vũ trụ
              </p>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center items-center">
            <motion.button
              whileHover={question.trim() ? { scale: 1.05 } : {}}
              whileTap={question.trim() ? { scale: 0.95 } : {}}
              disabled={!question.trim()}
              onClick={() => { setMode('single'); drawCards(1); }}
              className="glass-morphism p-8 md:p-12 rounded-3xl w-full max-w-sm group hover:border-mystic-gold transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-12 h-12 md:w-16 md:h-16 text-mystic-purple mb-4 md:mb-6 mx-auto group-hover:scale-110 transition-transform" />
              <h3 className="text-xl md:text-2xl font-serif font-bold mb-2">Rút 1 Lá</h3>
              <p className="text-gray-500 text-sm">Thông điệp & Lời khuyên nhanh</p>
            </motion.button>
            <motion.button
              whileHover={question.trim() ? { scale: 1.05 } : {}}
              whileTap={question.trim() ? { scale: 0.95 } : {}}
              disabled={!question.trim()}
              onClick={() => { setMode('triple'); drawCards(3); }}
              className="glass-morphism p-8 md:p-12 rounded-3xl w-full max-w-sm group hover:border-mystic-gold transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="flex gap-2 justify-center mb-4 md:mb-6">
                <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-mystic-purple group-hover:rotate-[-10deg] transition-transform" />
                <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-mystic-purple group-hover:translate-y-[-5px] transition-transform" />
                <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-mystic-purple group-hover:rotate-[10deg] transition-transform" />
              </div>
              <h3 className="text-xl md:text-2xl font-serif font-bold mb-2">Rút 3 Lá</h3>
              <p className="text-gray-500 text-sm">Quá khứ - Hiện tại - Tương lai</p>
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
                  onReveal={() => handleReveal(idx)}
                  isInitialFlipped={revealedIndices.includes(idx)}
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
                id="tarot-result"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-morphism p-6 md:p-12 rounded-3xl border-mystic-gold/30 max-w-5xl mx-auto shadow-[0_0_50px_rgba(126,34,206,0.1)]"
              >
                <div className="flex items-center gap-4 mb-6 md:mb-8 border-b border-mystic-gold/20 pb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-mystic-gold/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-mystic-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-mystic-gold">Luận Giải Chi Tiết</h2>
                </div>
                
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{interpretation}</ReactMarkdown>
                </div>
                
                <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <p className="text-gray-500 text-xs md:text-sm italic text-center md:text-left">Hãy suy ngẫm về những thông điệp này trong không gian yên tĩnh.</p>
                  <button
                    onClick={() => { setMode(null); setSelectedCards([]); setInterpretation(null); setRevealedIndices([]); }}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-8 md:px-10 py-3.5 md:py-4 bg-mystic-purple/20 hover:bg-mystic-purple/40 text-mystic-purple rounded-full transition-all border border-mystic-purple/30 font-bold tracking-widest uppercase text-[10px] md:text-xs"
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
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        onDownload={handleDownload}
        title="Bói Bài Tarot"
        interpretation={interpretation || ''}
      />
    </div>
  );
};
