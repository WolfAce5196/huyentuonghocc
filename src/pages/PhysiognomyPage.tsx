import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, Sparkles, Loader2, Save, Share2, User, RefreshCw, History as HistoryIcon } from 'lucide-react';
import { ai, MODELS, SYSTEM_PROMPTS, safeGenerateContent } from '../lib/gemini';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { HistorySidebar } from '../components/HistorySidebar';
import { saveHistory, HistoryItem, getHistory } from '../lib/history';

export const PhysiognomyPage: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeFace = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const history = getHistory('physiognomy').slice(0, 2);
      const base64Data = image.split(',')[1];
      
      const parts: any[] = [
        { text: SYSTEM_PROMPTS.PHYSIOGNOMY },
      ];

      if (history.length > 0) {
        parts.push({ text: "Dưới đây là các hình ảnh và luận giải trước đó để bạn đối chiếu và đảm bảo tính nhất quán (nếu là cùng một người):" });
        history.forEach((item, index) => {
          const histBase64 = item.result.image.split(',')[1];
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: histBase64,
            },
          });
          parts.push({ text: `Luận giải trước đó cho ảnh ${index + 1}: ${item.result.interpretation}` });
        });
        parts.push({ text: "Bây giờ, hãy phân tích hình ảnh mới này:" });
      }

      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      });

      const response = await safeGenerateContent({
        model: MODELS.VISION,
        contents: [{ parts }],
      });

      const resultText = response.text || "Không thể phân tích khuôn mặt. Vui lòng thử lại.";
      setResult(resultText);

      // Save to history
      saveHistory({
        type: 'physiognomy',
        title: `Xem Nhân Tướng (${new Date().toLocaleDateString('vi-VN')})`,
        result: {
          image,
          interpretation: resultText
        }
      });
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
        setError("Hệ thống đang quá tải (Rate Limit). Vui lòng đợi 1-2 phút và thử lại.");
      } else {
        setError("Đã xảy ra lỗi trong quá trình phân tích. Vui lòng kiểm tra lại hình ảnh.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setImage(item.result.image);
    setResult(item.result.interpretation);
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-6xl mx-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all text-mystic-gold text-sm font-bold uppercase tracking-widest"
        >
          <HistoryIcon className="w-4 h-4" /> Lịch sử
        </button>
      </div>

      <div className="text-center mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-serif font-bold mb-4"
        >
          Xem Nhân Tướng AI
        </motion.h1>
        <p className="text-mystic-gold tracking-[0.2em] uppercase text-sm">
          “Khuôn mặt là cuốn sách vận mệnh – Hãy để AI đọc giúp bạn”
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Upload Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-morphism p-8 rounded-3xl border-mystic-purple/30"
        >
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative aspect-square rounded-2xl border-2 border-dashed border-mystic-purple/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-mystic-gold group",
              image ? "border-none" : "bg-mystic-purple/5"
            )}
          >
            {image ? (
              <>
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white" />
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                <Upload className="w-16 h-16 text-mystic-purple mb-4 mx-auto group-hover:text-mystic-gold transition-colors" />
                <p className="text-lg font-medium mb-2">Tải ảnh khuôn mặt</p>
                <p className="text-gray-500 text-sm">Hỗ trợ JPG, PNG. Chụp rõ nét, đủ ánh sáng.</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <button
            disabled={!image || loading}
            onClick={analyzeFace}
            className="w-full mt-8 py-4 px-8 bg-mystic-purple hover:bg-mystic-purple/80 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-xl font-bold tracking-widest uppercase flex items-center justify-center gap-3 transition-all mystic-glow"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang giải mã vận mệnh...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Bắt đầu phân tích
              </>
            )}
          </button>
        </motion.div>

        {/* Result Section */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-mystic-purple/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-mystic-gold rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-12 h-12 text-mystic-gold animate-pulse" />
                </div>
                <h3 className="text-2xl font-serif mb-2">Đang kết nối với kiến thức cổ xưa</h3>
                <p className="text-gray-500">AI đang phân tích từng đường nét trên khuôn mặt bạn...</p>
                {getHistory('physiognomy').length > 0 && (
                  <p className="text-mystic-gold/60 text-xs mt-4 animate-pulse uppercase tracking-[0.2em]">
                    Đang đối chiếu với dữ liệu lịch sử để đảm bảo tính nhất quán...
                  </p>
                )}
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-red-500/20 rounded-3xl p-12"
              >
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                  <RefreshCw className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-serif text-red-500 mb-2">Thông báo</h3>
                <p className="text-gray-400 max-w-xs">{error}</p>
                <button 
                  onClick={analyzeFace}
                  className="mt-6 text-mystic-gold hover:underline font-bold"
                >
                  Thử lại ngay
                </button>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-morphism p-8 rounded-3xl border-mystic-gold/30 h-full overflow-y-auto max-h-[800px] markdown-body"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-serif font-bold text-mystic-gold">Kết Quả Luận Giải</h2>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <Save className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-white/5 rounded-3xl p-12"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <User className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-serif text-gray-400 mb-2">Chưa có dữ liệu phân tích</h3>
                <p className="text-gray-600 max-w-xs">Tải ảnh lên và nhấn nút bắt đầu để khám phá bí mật khuôn mặt bạn.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <HistorySidebar
        type="physiognomy"
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={handleSelectHistory}
      />
    </div>
  );
};
