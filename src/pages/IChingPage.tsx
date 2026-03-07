import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Sparkles, RefreshCw, Loader2, History as HistoryIcon, Download } from 'lucide-react';
import { ai, MODELS, SYSTEM_PROMPTS, safeGenerateContent, getCurrentContext } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HistorySidebar } from '../components/HistorySidebar';
import { saveHistory, HistoryItem } from '../lib/history';
import { useReading } from '../context/ReadingContext';
import { DownloadModal, UserData } from '../components/DownloadModal';
import { downloadAsFile } from '../lib/download';
import { downloadIChingPDF, preRenderPDFContent } from '../lib/pdf';
import { extractJSON } from '../lib/utils';

export const IChingPage: React.FC = () => {
  const { states, updateState, resetState, startLoading, finishLoading } = useReading();
  const pageState = states.iching || {};

  const [lines, setLines] = useState<number[]>(pageState.lines || []);
  const [loading, setLoading] = useState(pageState.loading || false);
  const [result, setResult] = useState<string | null>(pageState.result || null);
  const [hexNumber, setHexNumber] = useState<number | null>(pageState.hexNumber || null);
  const [hexName, setHexName] = useState<string | null>(pageState.hexName || null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(pageState.generatedImageUrl || null);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(pageState.error || null);
  const [question, setQuestion] = useState(pageState.question || '');
  const [startTime, setStartTime] = useState<string | null>(pageState.startTime || null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [preRenderedPDF, setPreRenderedPDF] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync with context
  useEffect(() => {
    if (pageState.loading !== undefined && pageState.loading !== loading) setLoading(pageState.loading);
    if (pageState.result !== undefined && pageState.result !== result) setResult(pageState.result);
    if (pageState.error !== undefined && pageState.error !== error) setError(pageState.error);
    if (pageState.lines !== undefined && JSON.stringify(pageState.lines) !== JSON.stringify(lines)) setLines(pageState.lines);
    if (pageState.hexNumber !== undefined && pageState.hexNumber !== hexNumber) setHexNumber(pageState.hexNumber);
    if (pageState.hexName !== undefined && pageState.hexName !== hexName) setHexName(pageState.hexName);
    if (pageState.generatedImageUrl !== undefined && pageState.generatedImageUrl !== generatedImageUrl) setGeneratedImageUrl(pageState.generatedImageUrl);
    if (pageState.question !== undefined && pageState.question !== question) setQuestion(pageState.question);
    if (pageState.startTime !== undefined && pageState.startTime !== startTime) setStartTime(pageState.startTime);
  }, [pageState]);

  useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [result]);

  useEffect(() => {
    if (result && hexNumber) {
      const timer = setTimeout(async () => {
        try {
          const hexImage = `https://raw.githubusercontent.com/pete-otaqui/iching/master/images/hexagrams/${hexNumber}.png`;
          const resources = [
            { type: 'image' as const, content: hexImage, label: 'Hình tượng quẻ dịch' }
          ];
          if (generatedImageUrl) {
            resources.push({ type: 'image' as const, content: generatedImageUrl, label: 'Minh họa AI' });
          }
          const imgData = await preRenderPDFContent('Luận Giải Kinh Dịch', result, resources);
          setPreRenderedPDF(imgData);
        } catch (err) {
          console.error("Pre-render failed:", err);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [result, hexNumber, generatedImageUrl]);

  const handleReset = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLines([]);
      setResult(null);
      setHexNumber(null);
      setHexName(null);
      setGeneratedImageUrl(null);
      setError(null);
      setStartTime(null);
      setQuestion('');
      resetState('iching');
      setIsRefreshing(false);
    }, 600);
  };

  const castLine = () => {
    if (lines.length >= 6) return;
    
    if (lines.length === 0) {
      const now = new Date();
      const timeStr = now.toLocaleString('vi-VN');
      setStartTime(timeStr);
      updateState('iching', { startTime: timeStr });
    }

    // 0: Yin (broken), 1: Yang (solid)
    const newLine = Math.random() > 0.5 ? 1 : 0;
    const newLines = [...lines, newLine];
    setLines(newLines);
    updateState('iching', { lines: newLines });
    setError(null);
    
    if (newLines.length === 6) {
      analyzeHexagram(newLines);
    }
  };

  const analyzeHexagram = async (finalLines: number[]) => {
    startLoading('iching');
    try {
      const hexagramStr = finalLines.map(l => l === 1 ? 'Dương' : 'Âm').join(', ');
      const prompt = `Tôi vừa gieo được quẻ Kinh Dịch với các hào từ dưới lên trên như sau: ${hexagramStr}. 
      Câu hỏi của tôi: "${question}"
      Giờ động tâm: ${startTime}
      Hãy giải quẻ này. 
      QUAN TRỌNG: Hãy trả về kết quả theo định dạng JSON có cấu trúc như sau:
      {
        "hexagramNumber": number (từ 1 đến 64 theo số thứ tự King Wen),
        "hexagramName": "Tên quẻ (ví dụ: Thuần Càn)",
        "interpretation": "Nội dung luận giải chi tiết bằng Markdown..."
      }`;

      const response = await safeGenerateContent({
        model: MODELS.TEXT,
        contents: [{ parts: [{ text: SYSTEM_PROMPTS.ICHING + "\n\n" + getCurrentContext() + "\n\n" + prompt }] }],
        config: { responseMimeType: "application/json" }
      });
      
      const resultTextRaw = response.text || "";
      const data = extractJSON(resultTextRaw) || {};
      const resultText = data.interpretation || "Không thể giải quẻ.";
      const hNum = data.hexagramNumber || null;
      const hName = data.hexagramName || null;

      // Save to history
      saveHistory({
        type: 'iching',
        title: question || `Gieo Quẻ Kinh Dịch (${hName})`,
        result: {
          question,
          startTime,
          lines: finalLines,
          hexNumber: hNum,
          hexName: hName,
          interpretation: resultText
        }
      });

      finishLoading('iching', { 
        result: resultText,
        hexNumber: hNum,
        hexName: hName
      });

      // Generate AI Illustration
      if (hNum && hName) {
        generateIllustration(hNum, hName);
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Đã xảy ra lỗi khi giải quẻ. Vui lòng thử lại.";
      if (err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
        errorMsg = "Hệ thống đang quá tải (Rate Limit). Vui lòng đợi 1-2 phút và thử lại.";
      }
      finishLoading('iching', {}, errorMsg);
    }
  };

  const generateIllustration = async (num: number, name: string) => {
    setImageLoading(true);
    try {
      const imagePrompt = `A mystical and artistic illustration representing the I Ching Hexagram ${num}: ${name}. 
      The image should capture the essence of this hexagram's symbolism, specifically reflecting the energy related to the question: "${question}". 
      Style: Traditional Chinese ink wash painting mixed with modern ethereal digital art, golden accents, Zen atmosphere, cinematic lighting, high detail.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: imagePrompt }],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setGeneratedImageUrl(imageUrl);
          updateState('iching', { generatedImageUrl: imageUrl });
          break;
        }
      }
    } catch (err) {
      console.error("Failed to generate image:", err);
    } finally {
      setImageLoading(false);
    }
  };

  const reset = () => {
    setLines([]);
    setResult(null);
    setHexNumber(null);
    setHexName(null);
    setGeneratedImageUrl(null);
    setError(null);
    setStartTime(null);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setQuestion(item.result.question || '');
    setStartTime(item.result.startTime);
    setLines(item.result.lines);
    setHexNumber(item.result.hexNumber);
    setHexName(item.result.hexName);
    setResult(item.result.interpretation);
    setGeneratedImageUrl(null);
  };

  const handleDownload = (userData: UserData, format: 'txt' | 'pdf') => {
    if (!result) return;
    if (format === 'pdf') {
      const hexImage = `https://raw.githubusercontent.com/pete-otaqui/iching/master/images/hexagrams/${hexNumber}.png`;
      downloadIChingPDF(userData, result, hexImage, generatedImageUrl || undefined, preRenderedPDF || undefined);
    } else {
      downloadAsFile(result, 'kinh-dich.txt', userData);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4">Gieo Quẻ Kinh Dịch</h1>
        <p className="text-mystic-gold tracking-[0.15em] md:tracking-[0.2em] uppercase text-[10px] md:text-sm px-4 mb-6">
          Thấu hiểu quy luật biến hóa của đất trời
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

      <div className="max-w-2xl mx-auto mb-8 md:mb-12">
        <div className="glass-morphism p-5 md:p-6 rounded-2xl border-mystic-purple/20">
          <label className="block text-mystic-gold text-[10px] md:text-xs uppercase tracking-widest mb-2 font-bold">Câu hỏi của bạn</label>
          <input 
            type="text" 
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              updateState('iching', { question: e.target.value });
            }}
            placeholder="Nhập vấn đề bạn muốn xin quẻ..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-all text-sm md:text-base"
          />
          {startTime && (
            <div className="mt-3 md:mt-4 flex items-center gap-2 text-mystic-purple text-xs md:text-sm">
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Giờ động tâm: <span className="text-mystic-gold font-bold">{startTime}</span></span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[280px] md:w-64 h-72 md:h-80 glass-morphism rounded-3xl p-6 md:p-8 flex flex-col-reverse gap-4 md:gap-6 justify-center items-center border-mystic-purple/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] [perspective:1200px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleX: 0, rotateX: -60, opacity: 0, translateZ: -100 }}
                animate={{ 
                  scaleX: lines[i] !== undefined ? 1 : 0, 
                  rotateX: 0,
                  opacity: lines[i] !== undefined ? 1 : 0.1,
                  translateZ: 0
                }}
                transition={{ duration: 0.6, delay: i * 0.1, type: 'spring', stiffness: 100 }}
                className="w-full h-6 flex gap-3 [transform-style:preserve-3d]"
              >
                {lines[i] === 1 ? (
                  <div className="w-full h-full relative group [transform-style:preserve-3d]">
                    {/* Main Bar */}
                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-300 via-mystic-gold to-yellow-600 rounded-sm shadow-[0_0_20px_rgba(250,204,21,0.4)] border-t border-white/30 z-10" />
                    {/* 3D Depth Side */}
                    <div className="absolute inset-0 bg-yellow-800 rounded-sm translate-y-1.5 -translate-z-2" />
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-mystic-gold blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                  </div>
                ) : lines[i] === 0 ? (
                  <>
                    <div className="w-[45%] h-full relative group [transform-style:preserve-3d]">
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-300 via-mystic-purple to-purple-800 rounded-sm shadow-[0_0_20px_rgba(126,34,206,0.4)] border-t border-white/30 z-10" />
                      <div className="absolute inset-0 bg-purple-950 rounded-sm translate-y-1.5 -translate-z-2" />
                      <div className="absolute inset-0 bg-mystic-purple blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                    </div>
                    <div className="w-[10%] h-full" />
                    <div className="w-[45%] h-full relative group [transform-style:preserve-3d]">
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-300 via-mystic-purple to-purple-800 rounded-sm shadow-[0_0_20px_rgba(126,34,206,0.4)] border-t border-white/30 z-10" />
                      <div className="absolute inset-0 bg-purple-950 rounded-sm translate-y-1.5 -translate-z-2" />
                      <div className="absolute inset-0 bg-mystic-purple blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full border border-white/10 rounded-sm opacity-10 bg-white/5" />
                )}
              </motion.div>
            ))}
          </div>

          <button
            disabled={lines.length >= 6 || loading || !question.trim()}
            onClick={castLine}
            className="mt-6 md:mt-8 w-full max-w-[280px] md:w-auto px-8 md:px-12 py-3.5 md:py-4 bg-mystic-purple rounded-full font-bold tracking-widest uppercase hover:bg-mystic-purple/80 transition-all mystic-glow disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-base"
          >
            {lines.length < 6 ? `Gieo hào ${lines.length + 1}` : 'Đã gieo xong'}
          </button>
          {!question.trim() && (
            <p className="mt-2 text-red-500/70 text-[10px] md:text-xs font-bold animate-pulse">Vui lòng nhập câu hỏi trước khi gieo quẻ</p>
          )}
          <p className="mt-3 md:mt-4 text-gray-500 text-xs md:text-sm italic">Nhấn 6 lần để hoàn thành quẻ</p>
        </div>

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <Loader2 className="w-12 h-12 text-mystic-gold animate-spin mb-4" />
                <p className="text-mystic-gold font-serif">Đang tra cứu 64 quẻ dịch...</p>
              </motion.div>
            ) : result ? (
              <motion.div
                id="iching-result"
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-morphism p-6 md:p-8 rounded-3xl border-mystic-gold/30 h-full overflow-y-auto max-h-[600px]"
              >
                <div className="markdown-body">
                  {hexNumber && (
                    <div className="mb-8 md:mb-10 flex flex-col items-center gap-4 md:gap-6">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative group w-full max-w-sm md:max-w-md"
                      >
                        {/* Mystic Background Glow */}
                        <div className="absolute -inset-4 bg-mystic-gold/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative aspect-square bg-black/40 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 md:border-4 border-mystic-gold/30 overflow-hidden flex items-center justify-center">
                          {imageLoading ? (
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-mystic-gold animate-spin" />
                              <span className="text-mystic-gold text-[10px] md:text-xs uppercase tracking-widest animate-pulse">Đang họa hình tượng...</span>
                            </div>
                          ) : generatedImageUrl ? (
                            <img 
                              src={generatedImageUrl}
                              alt={`Hình tượng quẻ ${hexName}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="p-4 md:p-6 bg-white rounded-xl md:rounded-2xl">
                              <img 
                                src={`https://raw.githubusercontent.com/pete-otaqui/iching/master/images/hexagrams/${hexNumber}.png`}
                                alt={`Quẻ số ${hexNumber}`}
                                className="w-24 h-24 md:w-32 md:h-32 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                          
                          {/* Small traditional symbol overlay */}
                          {generatedImageUrl && (
                            <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 p-1.5 md:p-2 bg-white/90 rounded-lg shadow-lg border border-mystic-gold/50">
                              <img 
                                src={`https://raw.githubusercontent.com/pete-otaqui/iching/master/images/hexagrams/${hexNumber}.png`}
                                alt="Symbol"
                                className="w-8 h-8 md:w-10 md:h-10 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                      <div className="text-center">
                        <span className="block text-mystic-gold font-serif text-2xl md:text-3xl font-bold mb-1">Quẻ số {hexNumber}: {hexName}</span>
                        <span className="block text-mystic-purple text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold">Hình tượng quẻ dịch</span>
                      </div>
                    </div>
                  )}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
                <button
                  onClick={reset}
                  className="mt-6 md:mt-8 flex items-center gap-2 text-mystic-gold hover:underline text-sm md:text-base"
                >
                  <RefreshCw className="w-4 h-4" /> Gieo quẻ mới
                </button>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-red-500/20 rounded-3xl p-12"
              >
                <RefreshCw className="w-10 h-10 text-red-500 mb-4" />
                <h3 className="text-xl font-serif text-red-500 mb-2">Thông báo</h3>
                <p className="text-gray-500">{error}</p>
                <button
                  onClick={() => analyzeHexagram(lines)}
                  className="mt-6 text-mystic-gold hover:underline"
                >
                  Thử lại
                </button>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-white/5 rounded-3xl p-12">
                <Hash className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-500">Hãy gieo đủ 6 hào để nhận lời giải quẻ.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <HistorySidebar
        type="iching"
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={handleSelectHistory}
      />
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        onDownload={handleDownload}
        title="Gieo Quẻ Kinh Dịch"
        interpretation={result || ''}
      />
    </div>
  );
};
