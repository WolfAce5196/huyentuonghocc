import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { ai, MODELS, SYSTEM_PROMPTS, safeGenerateContent } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';

export const IChingPage: React.FC = () => {
  const [lines, setLines] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [hexNumber, setHexNumber] = useState<number | null>(null);
  const [hexName, setHexName] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [startTime, setStartTime] = useState<string | null>(null);

  const castLine = () => {
    if (lines.length >= 6) return;
    
    if (lines.length === 0) {
      const now = new Date();
      setStartTime(now.toLocaleString('vi-VN'));
    }

    // 0: Yin (broken), 1: Yang (solid)
    const newLine = Math.random() > 0.5 ? 1 : 0;
    setLines([...lines, newLine]);
    setError(null);
    
    if (lines.length === 5) {
      analyzeHexagram([...lines, newLine]);
    }
  };

  const analyzeHexagram = async (finalLines: number[]) => {
    setLoading(true);
    setError(null);
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
        contents: [{ parts: [{ text: SYSTEM_PROMPTS.ICHING + "\n\n" + prompt }] }],
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text || "{}");
      setResult(data.interpretation || "Không thể giải quẻ.");
      setHexNumber(data.hexagramNumber || null);
      setHexName(data.hexagramName || null);

      // Generate AI Illustration
      if (data.hexagramNumber && data.hexagramName) {
        generateIllustration(data.hexagramNumber, data.hexagramName);
      }
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
        setError("Hệ thống đang quá tải (Rate Limit). Vui lòng đợi 1-2 phút và thử lại.");
      } else {
        setError("Đã xảy ra lỗi khi giải quẻ. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
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
          setGeneratedImageUrl(`data:image/png;base64,${part.inlineData.data}`);
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

  return (
    <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Gieo Quẻ Kinh Dịch</h1>
        <p className="text-mystic-gold tracking-[0.2em] uppercase text-sm">
          Thấu hiểu quy luật biến hóa của đất trời
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-12">
        <div className="glass-morphism p-6 rounded-2xl border-mystic-purple/20">
          <label className="block text-mystic-gold text-xs uppercase tracking-widest mb-2 font-bold">Câu hỏi của bạn</label>
          <input 
            type="text" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Nhập vấn đề bạn muốn xin quẻ..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-all"
          />
          {startTime && (
            <div className="mt-4 flex items-center gap-2 text-mystic-purple text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Giờ động tâm: <span className="text-mystic-gold font-bold">{startTime}</span></span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col items-center">
          <div className="w-64 h-80 glass-morphism rounded-3xl p-8 flex flex-col-reverse gap-6 justify-center items-center border-mystic-purple/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] [perspective:1200px]">
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
            className="mt-8 px-12 py-4 bg-mystic-purple rounded-full font-bold tracking-widest uppercase hover:bg-mystic-purple/80 transition-all mystic-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {lines.length < 6 ? `Gieo hào ${lines.length + 1}` : 'Đã gieo xong'}
          </button>
          {!question.trim() && (
            <p className="mt-2 text-red-500/70 text-xs font-bold animate-pulse">Vui lòng nhập câu hỏi trước khi gieo quẻ</p>
          )}
          <p className="mt-4 text-gray-500 text-sm italic">Nhấn 6 lần để hoàn thành quẻ</p>
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
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-morphism p-8 rounded-3xl border-mystic-gold/30 h-full overflow-y-auto max-h-[600px] markdown-body"
              >
                <div className="prose prose-invert max-w-none">
                  {hexNumber && (
                    <div className="mb-10 flex flex-col items-center gap-6">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative group w-full max-w-md"
                      >
                        {/* Mystic Background Glow */}
                        <div className="absolute -inset-4 bg-mystic-gold/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative aspect-square bg-black/40 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-mystic-gold/30 overflow-hidden flex items-center justify-center">
                          {imageLoading ? (
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="w-10 h-10 text-mystic-gold animate-spin" />
                              <span className="text-mystic-gold text-xs uppercase tracking-widest animate-pulse">Đang họa hình tượng...</span>
                            </div>
                          ) : generatedImageUrl ? (
                            <img 
                              src={generatedImageUrl}
                              alt={`Hình tượng quẻ ${hexName}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="p-6 bg-white rounded-2xl">
                              <img 
                                src={`https://raw.githubusercontent.com/pete-otaqui/iching/master/images/hexagrams/${hexNumber}.png`}
                                alt={`Quẻ số ${hexNumber}`}
                                className="w-32 h-32 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                          
                          {/* Small traditional symbol overlay */}
                          {generatedImageUrl && (
                            <div className="absolute bottom-4 right-4 p-2 bg-white/90 rounded-lg shadow-lg border border-mystic-gold/50">
                              <img 
                                src={`https://raw.githubusercontent.com/pete-otaqui/iching/master/images/hexagrams/${hexNumber}.png`}
                                alt="Symbol"
                                className="w-10 h-10 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                      <div className="text-center">
                        <span className="block text-mystic-gold font-serif text-3xl font-bold mb-1">Quẻ số {hexNumber}: {hexName}</span>
                        <span className="block text-mystic-purple text-xs uppercase tracking-[0.3em] font-bold">Hình tượng quẻ dịch</span>
                      </div>
                    </div>
                  )}
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
                <button
                  onClick={reset}
                  className="mt-8 flex items-center gap-2 text-mystic-gold hover:underline"
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
    </div>
  );
};
