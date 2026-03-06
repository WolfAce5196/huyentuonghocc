import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, Sparkles, Loader2, Save, Share2, User, RefreshCw, History as HistoryIcon, Download } from 'lucide-react';
import { ai, MODELS, SYSTEM_PROMPTS, safeGenerateContent, getCurrentContext } from '../lib/gemini';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HistorySidebar } from '../components/HistorySidebar';
import { saveHistory, HistoryItem, getHistory } from '../lib/history';
import { useReading } from '../context/ReadingContext';
import { DownloadModal, UserData } from '../components/DownloadModal';
import { downloadAsFile } from '../lib/download';
import { downloadPhysiognomyPDF, preRenderPDFContent } from '../lib/pdf';

export const PhysiognomyPage: React.FC = () => {
  const { states, updateState, resetState, startLoading, finishLoading } = useReading();
  const pageState = states.physiognomy || {};

  const [image, setImage] = useState<string | null>(pageState.image || null);
  const [loading, setLoading] = useState(pageState.loading || false);
  const [result, setResult] = useState<string | null>(pageState.result || null);
  const [error, setError] = useState<string | null>(pageState.error || null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [preRenderedPDF, setPreRenderedPDF] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with context
  useEffect(() => {
    if (pageState.loading !== undefined && pageState.loading !== loading) setLoading(pageState.loading);
    if (pageState.result !== undefined && pageState.result !== result) setResult(pageState.result);
    if (pageState.error !== undefined && pageState.error !== error) setError(pageState.error);
    if (pageState.image !== undefined && pageState.image !== image) setImage(pageState.image);
  }, [pageState.loading, pageState.result, pageState.error, pageState.image, loading, result, error, image]);

  useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [result]);

  useEffect(() => {
    if (result && image && !preRenderedPDF) {
      const timer = setTimeout(async () => {
        try {
          const resources = [
            { type: 'image' as const, content: image, label: 'Hình ảnh nhân tướng' }
          ];
          const imgData = await preRenderPDFContent('Luận Giải Nhân Tướng Học', result, resources);
          setPreRenderedPDF(imgData);
        } catch (err) {
          console.error("Pre-render failed:", err);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [result, image, preRenderedPDF]);

  const handleReset = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setImage(null);
      setResult(null);
      setError(null);
      resetState('physiognomy');
      setIsRefreshing(false);
    }, 600);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setImage(imageData);
        updateState('physiognomy', { image: imageData, error: null });
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeFace = async () => {
    if (!image) return;
    startLoading('physiognomy');

    try {
      const history = getHistory('physiognomy');
      const base64Data = image.split(',')[1];
      
      const parts: any[] = [
        { text: SYSTEM_PROMPTS.PHYSIOGNOMY + "\n\n" + getCurrentContext() },
      ];

      if (history.length > 0) {
        parts.push({ text: "DỮ LIỆU QUÁ KHỨ (CHỈ DÙNG ĐỂ ĐỐI CHIẾU NHẤT QUÁN, KHÔNG HIỂN THỊ TRONG KẾT QUẢ):" });
        history.slice(-2).forEach((item, index) => {
          const histBase64 = item.result.image.split(',')[1];
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: histBase64,
            },
          });
          parts.push({ text: `Luận giải quá khứ ${index + 1}: ${item.result.interpretation}` });
        });
        parts.push({ text: "HÌNH ẢNH MỚI CẦN LUẬN GIẢI:" });
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
      
      // Save to history
      saveHistory({
        type: 'physiognomy',
        title: `Xem Nhân Tướng (${new Date().toLocaleDateString('vi-VN')})`,
        result: {
          image,
          interpretation: resultText
        }
      });

      finishLoading('physiognomy', { result: resultText });
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Đã xảy ra lỗi trong quá trình phân tích. Vui lòng kiểm tra lại hình ảnh.";
      if (err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
        errorMsg = "Hệ thống đang quá tải (Rate Limit). Vui lòng đợi 1-2 phút và thử lại.";
      }
      finishLoading('physiognomy', {}, errorMsg);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setImage(item.result.image);
    setResult(item.result.interpretation);
  };

  const handleDownload = (userData: UserData, format: 'txt' | 'pdf') => {
    if (!result || !image) return;
    if (format === 'pdf') {
      downloadPhysiognomyPDF(userData, result, image, preRenderedPDF || undefined);
    } else {
      downloadAsFile(result, 'nhan-tuong-hoc.txt', userData);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-8 md:mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4"
        >
          Xem Nhân Tướng AI
        </motion.h1>
        <p className="text-mystic-gold tracking-[0.15em] md:tracking-[0.2em] uppercase text-[10px] md:text-sm px-4 mb-6">
          “Khuôn mặt là cuốn sách vận mệnh – Hãy để AI đọc giúp bạn”
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Upload Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-morphism p-5 md:p-8 rounded-3xl border-mystic-purple/30"
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
                  <Camera className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
              </>
            ) : (
              <div className="text-center p-4 md:p-6">
                <Upload className="w-12 h-12 md:w-16 md:h-16 text-mystic-purple mb-4 mx-auto group-hover:text-mystic-gold transition-colors" />
                <p className="text-base md:text-lg font-medium mb-2">Tải ảnh khuôn mặt</p>
                <p className="text-gray-500 text-xs md:text-sm">Hỗ trợ JPG, PNG. Chụp rõ nét, đủ ánh sáng.</p>
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
            className="w-full mt-6 md:mt-8 py-3.5 md:py-4 px-8 bg-mystic-purple hover:bg-mystic-purple/80 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-xl font-bold tracking-widest uppercase flex items-center justify-center gap-3 transition-all mystic-glow text-sm md:text-base"
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
                id="physiognomy-result"
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-morphism p-5 md:p-8 rounded-3xl border-mystic-gold/30 h-full overflow-y-auto max-h-[600px] md:max-h-[800px]"
              >
                <div className="flex items-center justify-between mb-6 md:mb-8 border-b border-mystic-gold/20 pb-4">
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-mystic-gold">Kết Quả Luận Giải</h2>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <Save className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
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
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        onDownload={handleDownload}
        title="Nhân Tướng Học"
      />
    </div>
  );
};
