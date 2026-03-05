import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Save, Share2, History as HistoryIcon, Calculator, User, Calendar, Info, TrendingUp, Pyramid, Layout, Moon, Sun, Star, Download, RefreshCw } from 'lucide-react';
import { MODELS, SYSTEM_PROMPTS, safeGenerateContent, getCurrentContext } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HistorySidebar } from '../components/HistorySidebar';
import { saveHistory, HistoryItem } from '../lib/history';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { useReading } from '../context/ReadingContext';
import { DownloadModal, UserData } from '../components/DownloadModal';
import { downloadAsFile } from '../lib/download';
import { downloadAsPDF } from '../lib/pdf';
import { extractJSON } from '../lib/utils';

interface NumerologyResult {
  mainNumber: string;
  overview: string;
  coreNumbers: { name: string; value: string; meaning: string }[];
  strengths: string[];
  weaknesses: string[];
  advice: string[];
  nineYearCycle: { year: number; value: number; interpretation: string }[];
  pyramids: { age: number; value: number; meaning: string }[];
}

export const NumerologyPage: React.FC = () => {
  const { states, updateState, resetState, startLoading, finishLoading } = useReading();
  const pageState = states.numerology || {};

  const [name, setName] = useState(pageState.name || '');
  const [birthDate, setBirthDate] = useState(pageState.birthDate || '');
  const [loading, setLoading] = useState(pageState.loading || false);
  const [result, setResult] = useState<NumerologyResult | null>(pageState.result || null);
  const [error, setError] = useState<string | null>(pageState.error || null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'core' | 'cycle' | 'pyramids'>(pageState.activeTab || 'overview');
  const [isMobile, setIsMobile] = useState(false);

  // Sync with context
  useEffect(() => {
    if (pageState.loading !== undefined && pageState.loading !== loading) setLoading(pageState.loading);
    if (pageState.result !== undefined && JSON.stringify(pageState.result) !== JSON.stringify(result)) setResult(pageState.result);
    if (pageState.error !== undefined && pageState.error !== error) setError(pageState.error);
    if (pageState.name !== undefined && pageState.name !== name) setName(pageState.name);
    if (pageState.birthDate !== undefined && pageState.birthDate !== birthDate) setBirthDate(pageState.birthDate);
    if (pageState.activeTab !== undefined && pageState.activeTab !== activeTab) setActiveTab(pageState.activeTab);
  }, [pageState]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleReset = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setName('');
      setBirthDate('');
      setResult(null);
      setActiveTab('overview');
      resetState('numerology');
      setIsRefreshing(false);
    }, 600);
  };

  const analyzeNumerology = async () => {
    if (!name || !birthDate) return;
    startLoading('numerology');

    try {
      const prompt = `
        Tên: ${name}
        Ngày sinh: ${birthDate}
        
        Hãy thực hiện phân tích Thần Số Học dựa trên thông tin trên.
      `;

      const response = await safeGenerateContent({
        model: MODELS.TEXT,
        contents: [{ parts: [{ text: SYSTEM_PROMPTS.NUMEROLOGY + "\n\n" + getCurrentContext() }, { text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const resultText = response.text || "";
      try {
        const parsedResult = extractJSON(resultText) as NumerologyResult;
        
        if (!parsedResult || !parsedResult.mainNumber) {
          throw new Error("Invalid structure");
        }
        saveHistory({
          type: 'numerology',
          title: `Thần Số Học: ${name} (${birthDate})`,
          result: {
            name,
            birthDate,
            interpretation: parsedResult
          }
        });

        finishLoading('numerology', { result: parsedResult });
      } catch (e) {
        console.error("JSON Parse Error:", e);
        finishLoading('numerology', {}, "Không thể xử lý dữ liệu từ AI. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Đã xảy ra lỗi trong quá trình phân tích. Vui lòng thử lại.";
      if (err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
        errorMsg = "Hệ thống đang quá tải (Rate Limit). Vui lòng đợi 1-2 phút và thử lại.";
      }
      finishLoading('numerology', {}, errorMsg);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setName(item.result.name);
    setBirthDate(item.result.birthDate);
    setResult(item.result.interpretation);
    setActiveTab('overview');
    
    updateState('numerology', {
      name: item.result.name,
      birthDate: item.result.birthDate,
      result: item.result.interpretation,
      activeTab: 'overview'
    });
  };

  const handleDownload = (userData: UserData, format: 'txt' | 'pdf') => {
    if (!result) return;
    if (format === 'pdf') {
      downloadAsPDF('numerology-result', 'than-so-hoc.pdf', userData);
    } else {
      const content = `
SỐ CHỦ ĐẠO: ${result.mainNumber}

TỔNG QUAN:
${result.overview}

CÁC CHỈ SỐ CỐT LÕI:
${result.coreNumbers.map(c => `- ${c.name}: ${c.value}\n  ${c.meaning}`).join('\n')}

ĐIỂM MẠNH:
${result.strengths.map(s => `- ${s}`).join('\n')}

ĐIỂM YẾU:
${result.weaknesses.map(w => `- ${w}`).join('\n')}

LỜI KHUYÊN:
${result.advice.map(a => `- ${a}`).join('\n')}
`;
      downloadAsFile(content, 'than-so-hoc.txt', userData);
    }
  };

  const getEnergyLevel = (personalYear: number) => {
    const mapping: Record<number, number> = {
      1: 85,
      2: 65,
      3: 45,
      4: 25,
      5: 55,
      6: 85,
      7: 35,
      8: 75,
      9: 100
    };
    return mapping[personalYear] || 50;
  };

  const cycleData = useMemo(() => {
    if (!result || !result.nineYearCycle) return [];
    
    const currentYear = new Date().getFullYear();
    const currentYearItem = result.nineYearCycle.find(d => d.year === currentYear) || result.nineYearCycle.find(d => d.year === 2026);
    
    if (!currentYearItem) {
      return result.nineYearCycle.slice(0, 9).map(item => ({ 
        ...item, 
        energy: getEnergyLevel(item.value), 
        isCurrentCycle: true 
      }));
    }

    // Find the start of the current 9-year block
    // A block starts at value 1 and ends at value 9
    const currentIndex = result.nineYearCycle.indexOf(currentYearItem);
    let startIndex = currentIndex;
    while (startIndex > 0 && result.nineYearCycle[startIndex].value !== 1) {
      startIndex--;
    }
    
    let endIndex = currentIndex;
    while (endIndex < result.nineYearCycle.length - 1 && result.nineYearCycle[endIndex].value !== 9) {
      endIndex++;
    }

    // Ensure we have a 9-year window if possible
    return result.nineYearCycle.slice(startIndex, endIndex + 1).map(item => ({
      ...item,
      energy: getEnergyLevel(item.value),
      isCurrentCycle: true
    }));
  }, [result]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-morphism p-4 border border-mystic-gold/30 rounded-xl shadow-2xl">
          <p className="text-mystic-gold font-serif font-bold mb-2 text-lg border-b border-white/10 pb-1">{label}</p>
          <div className="space-y-1 mb-3">
            <p className="text-white text-sm flex justify-between gap-4">
              <span className="text-gray-400">Năm cá nhân:</span>
              <span className="font-bold text-mystic-purple">Số {data.value}</span>
            </p>
            <p className="text-white text-sm flex justify-between gap-4">
              <span className="text-gray-400">Mức độ năng lượng:</span>
              <span className="font-bold text-emerald-400">{data.energy}%</span>
            </p>
          </div>
          {data.interpretation && (
            <div className="text-gray-300 text-xs mt-2 max-w-[220px] leading-relaxed italic border-t border-white/5 pt-2">
              {data.interpretation.length > 100 
                ? data.interpretation.substring(0, 100) + "..." 
                : data.interpretation}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, result]);

  const currentYearData = useMemo(() => {
    return result?.nineYearCycle?.find(item => item.year === 2026);
  }, [result]);

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-serif font-bold mb-4"
        >
          Thần Số Học
        </motion.h1>
        <p className="text-mystic-gold tracking-[0.2em] uppercase text-sm mb-6">
          “Khám phá bản đồ cuộc đời qua những con số”
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

      {/* Horizontal Input Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism p-6 rounded-3xl border-mystic-purple/30 mb-12"
      >
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold uppercase tracking-widest text-mystic-gold mb-2 flex items-center gap-2">
              <User className="w-3 h-3" /> Họ và tên (đầy đủ)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                updateState('numerology', { name: e.target.value });
              }}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-colors"
            />
          </div>

          <div className="w-full md:w-64">
            <label className="block text-xs font-bold uppercase tracking-widest text-mystic-gold mb-2 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Ngày tháng năm sinh
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => {
                setBirthDate(e.target.value);
                updateState('numerology', { birthDate: e.target.value });
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-colors"
            />
          </div>

          <button
            disabled={!name || !birthDate || loading}
            onClick={analyzeNumerology}
            className="w-full md:w-auto py-3.5 px-8 bg-mystic-purple hover:bg-mystic-purple/80 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-xl font-bold tracking-widest uppercase flex items-center justify-center gap-3 transition-all mystic-glow whitespace-nowrap"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Calculator className="w-5 h-5" />
                Phân tích
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Result Section */}
      <div className="min-h-[600px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 border-4 border-mystic-purple/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-mystic-gold rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-12 h-12 text-mystic-gold animate-pulse" />
              </div>
              <h3 className="text-2xl font-serif mb-2">Đang kết nối với tri thức Pythagoras</h3>
              <p className="text-gray-500">AI đang phân tích các tần số rung động từ tên và ngày sinh của bạn...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-red-500/20 rounded-3xl"
            >
              <h3 className="text-xl font-serif text-red-500 mb-2">Thông báo</h3>
              <p className="text-gray-400 max-w-xs">{error}</p>
            </motion.div>
          ) : result ? (
            <motion.div
              id="numerology-result"
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Main Number - Prominent Display */}
              <div className="flex flex-col items-center justify-center py-12 md:py-20 min-h-[50vh] md:min-h-[60vh]">
                <motion.p 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-mystic-gold uppercase tracking-[0.2em] md:tracking-[0.4em] text-[10px] md:text-sm font-bold mb-2 md:mb-4 text-center px-4"
                >
                  Con Số Chủ Đạo Của Bạn
                </motion.p>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[8rem] sm:text-[12rem] md:text-[18rem] font-serif font-black leading-none animate-text-pattern select-none"
                >
                  {result.mainNumber}
                </motion.h2>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: 150 }}
                  className="h-0.5 md:h-1 bg-gradient-to-r from-transparent via-mystic-gold to-transparent mt-4 md:mt-8"
                />
              </div>

              {/* Tabs Navigation - 2 columns on mobile, flex on desktop */}
              <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-2 md:gap-4 border-b border-white/10 pb-4">
                {[
                  { id: 'overview', label: 'Tổng Quan', icon: Layout },
                  { id: 'core', label: 'Chỉ Số Chính', icon: Info },
                  { id: 'cycle', label: 'Chu Kỳ 9 Năm', icon: TrendingUp },
                  { id: 'pyramids', label: 'Kim Tự Tháp', icon: Pyramid },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      updateState('numerology', { activeTab: tab.id as any });
                    }}
                    className={`flex items-center justify-center gap-2 px-3 md:px-6 py-2.5 md:py-3 rounded-xl font-bold text-[10px] md:text-sm transition-all ${
                      activeTab === tab.id 
                        ? 'bg-mystic-purple text-white shadow-lg shadow-mystic-purple/20' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="glass-morphism p-5 md:p-12 rounded-3xl border-mystic-gold/20">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-white/10 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 md:p-3 rounded-2xl bg-mystic-gold/10">
                            <Layout className="w-5 h-5 md:w-6 md:h-6 text-mystic-gold" />
                          </div>
                          <div>
                            <h3 className="text-lg md:text-xl font-bold text-white">Bản Đồ Vận Mệnh Toàn Diện</h3>
                            <p className="text-gray-400 text-xs md:text-sm">Phân tích chuyên sâu & Bóc tách đa chiều</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => window.print()}
                          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-all text-sm"
                        >
                          <Share2 className="w-4 h-4" />
                          Xuất báo cáo
                        </button>
                      </div>
                      
                      <div className="glass-morphism p-6 md:p-10 rounded-3xl border-mystic-gold/20 relative overflow-hidden">
                        {/* Decorative background for overview */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-mystic-purple/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-mystic-gold/5 blur-[100px] rounded-full -ml-32 -mb-32" />
                        
                        <div className="relative z-10 markdown-body prose prose-invert max-w-none prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.overview}</ReactMarkdown>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/10">
                        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                          <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Thế mạnh cốt lõi
                          </h4>
                          <ul className="space-y-2">
                            {result.strengths?.map((s, i) => (
                              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                <span className="text-emerald-500 mt-1">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
                          <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Thách thức & Bài học
                          </h4>
                          <ul className="space-y-2">
                            {result.weaknesses?.map((w, i) => (
                              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-6 rounded-2xl bg-mystic-gold/5 border border-mystic-gold/10">
                          <h4 className="text-mystic-gold font-bold mb-3 flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Lời khuyên chiến lược
                          </h4>
                          <ul className="space-y-2">
                            {result.advice?.map((a, i) => (
                              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                <span className="text-mystic-gold mt-1">•</span> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'core' && (
                    <motion.div
                      key="core"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8 md:space-y-12"
                    >
                      {/* Core Numbers Cards - Responsive Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {result.coreNumbers?.map((item, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-6 md:p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 hover:border-mystic-gold/40 transition-all duration-500 group relative overflow-hidden"
                          >
                            {/* Subtle card glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-mystic-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <div className="relative z-10 flex flex-col h-full">
                              <div className="flex items-start justify-between mb-6">
                                <div className="space-y-1">
                                  <h4 className="text-mystic-gold text-xs md:text-sm font-black uppercase tracking-[0.2em] drop-shadow-sm">{item.name}</h4>
                                  <div className="h-0.5 w-8 bg-mystic-gold/30 rounded-full group-hover:w-12 transition-all duration-500" />
                                </div>
                                
                                <motion.div 
                                  animate={{ 
                                    y: [0, -4, 0],
                                    filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"]
                                  }}
                                  transition={{ 
                                    duration: 4, 
                                    repeat: Infinity, 
                                    ease: "easeInOut",
                                    delay: idx * 0.5
                                  }}
                                  className="relative"
                                >
                                  {/* Glow effect behind number */}
                                  <div className="absolute inset-0 bg-mystic-purple/40 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                  
                                  <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-mystic-purple to-purple-900 text-white flex items-center justify-center text-2xl md:text-3xl font-serif font-black shadow-[0_10px_20px_rgba(126,34,206,0.3)] border border-white/20">
                                    {item.value}
                                  </div>
                                </motion.div>
                              </div>
                              
                              <p className="text-gray-300 text-sm md:text-base leading-relaxed font-light">
                                {item.meaning}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                        <div className="p-5 md:p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                          <h4 className="text-emerald-500 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-4">Điểm Mạnh</h4>
                          <ul className="space-y-2">
                            {result.strengths?.map((s, i) => (
                              <li key={i} className="text-xs md:text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-emerald-500 mt-1">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-5 md:p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                          <h4 className="text-red-500 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-4">Điểm Yếu</h4>
                          <ul className="space-y-2">
                            {result.weaknesses?.map((w, i) => (
                              <li key={i} className="text-xs md:text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-5 md:p-6 rounded-2xl bg-mystic-gold/5 border border-mystic-gold/20">
                          <h4 className="text-mystic-gold font-bold uppercase tracking-widest text-[10px] md:text-xs mb-4">Lời Khuyên</h4>
                          <ul className="space-y-2">
                            {result.advice?.map((a, i) => (
                              <li key={i} className="text-xs md:text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-mystic-gold mt-1">•</span> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'cycle' && (
                    <motion.div
                      key="cycle"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-12"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                          <h3 className="text-xl md:text-2xl font-serif font-bold text-mystic-gold flex items-center gap-3">
                            <Moon className="w-5 h-5 md:w-6 md:h-6" /> Biểu Đồ Chu Kỳ 9 Năm
                          </h3>
                          <p className="text-gray-400 text-xs md:text-sm">Hành trình năng lượng từ Gieo hạt đến Thu hoạch</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[10px] md:text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-mystic-gold shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                            <span className="text-gray-300 whitespace-nowrap">Năm Hiện Tại (2026)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-mystic-purple" />
                            <span className="text-gray-300 whitespace-nowrap">Tiến Trình Chu Kỳ</span>
                          </div>
                          <div className="group relative cursor-help">
                            <Info className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500 hover:text-mystic-gold transition-colors" />
                            <div className="absolute bottom-full right-0 mb-2 w-56 md:w-64 p-3 bg-black/90 border border-white/10 rounded-xl text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                              <p className="font-bold text-mystic-gold mb-1 uppercase tracking-widest">Mức độ năng lượng (%)</p>
                              <p>Đại diện cho cường độ rung động của các con số trong chu kỳ 9 năm. Năm số 9 là đỉnh cao thu hoạch (100%), trong khi năm số 4 và 7 là các điểm trũng để nghỉ ngơi và chiêm nghiệm.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="relative h-[300px] md:h-[500px] w-full bg-black/40 rounded-3xl border border-white/5 overflow-hidden p-2 md:p-8">
                        {/* Mystical Background Elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-mystic-purple/10 blur-[100px] rounded-full" />
                          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-mystic-gold/10 blur-[100px] rounded-full" />
                          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                        </div>

                        <div className="relative z-10 h-full flex flex-col">
                          <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={cycleData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="mysticGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7e22ce" stopOpacity={0.4}/>
                                    <stop offset="50%" stopColor="#7e22ce" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#7e22ce" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis 
                                  dataKey="year" 
                                  stroke="rgba(255,255,255,0.2)" 
                                  fontSize={isMobile ? 10 : 12} 
                                  tickLine={false} 
                                  axisLine={false}
                                  dy={10}
                                  interval={isMobile ? 1 : 0}
                                />
                                <YAxis hide domain={[0, 110]} />
                                <Tooltip 
                                  content={<CustomTooltip />} 
                                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="energy" 
                                  stroke="#a855f7" 
                                  strokeWidth={3}
                                  fillOpacity={1} 
                                  fill="url(#mysticGradient)" 
                                  animationDuration={3000}
                                  dot={(props: any) => {
                                    const { cx, cy, payload, index } = props;
                                    if (cx === undefined || cy === undefined) return null;
                                    
                                    const currentYear = new Date().getFullYear();
                                    const isCurrentYear = payload.year === 2026 || payload.year === currentYear;
                                    const isPeak = payload.value === 9;
                                    const isDip = payload.value === 4 || payload.value === 7;
                                    
                                    return (
                                      <g key={`dot-${index}`}>
                                        {isCurrentYear && (
                                          <motion.circle 
                                            cx={cx} cy={cy} r={15} 
                                            fill="#facc15" 
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.5, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                          />
                                        )}
                                        <circle 
                                          cx={cx} cy={cy} r={isCurrentYear ? (isMobile ? 5 : 6) : (isMobile ? 3 : 4)} 
                                          fill={isCurrentYear ? "#facc15" : (isPeak ? "#a855f7" : (isDip ? "#f43f5e" : "#7e22ce"))}
                                          stroke={isCurrentYear ? "#fff" : "none"}
                                          strokeWidth={2}
                                          className="cursor-pointer transition-all hover:r-8"
                                        />
                                        <text 
                                          x={cx} y={cy - (isMobile ? 15 : 25)} 
                                          textAnchor="middle" 
                                          fill={isCurrentYear ? "#facc15" : "#fff"} 
                                          fontSize={isCurrentYear ? (isMobile ? 18 : 28) : (isMobile ? 12 : 18)}
                                          fontWeight="black"
                                          className="pointer-events-none font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                        >
                                          {payload.value}
                                        </text>
                                      </g>
                                    );
                                  }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-8 backdrop-blur-xl">
                            <h4 className="text-lg md:text-xl font-serif font-bold text-mystic-gold mb-4 md:mb-6 flex items-center gap-3">
                              <Sun className="w-4 h-4 md:w-5 md:h-5" /> Ý Nghĩa Các Giai Đoạn
                            </h4>
                            <div className="space-y-4 md:space-y-6">
                              {[
                                { range: 'Năm 1, 2, 3', label: 'Giai đoạn Gieo hạt & Khởi đầu', color: 'text-emerald-400' },
                                { range: 'Năm 4', label: 'Điểm trũng 1: Củng cố & Nghỉ ngơi', color: 'text-red-400' },
                                { range: 'Năm 5, 6', label: 'Giai đoạn Thay đổi & Mở rộng', color: 'text-mystic-purple' },
                                { range: 'Năm 7', label: 'Điểm trũng 2: Chiêm nghiệm & Học hỏi', color: 'text-red-400' },
                                { range: 'Năm 8, 9', label: 'Giai đoạn Gặt hái & Hoàn tất', color: 'text-mystic-gold' },
                              ].map((phase, i) => (
                                <div key={i} className="flex items-start gap-3 md:gap-4 group">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-mystic-gold transition-colors" />
                                  <div>
                                    <span className={`text-xs md:text-sm font-bold ${phase.color}`}>{phase.range}:</span>
                                    <p className="text-gray-400 text-[10px] md:text-sm mt-0.5 md:mt-1">{phase.label}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-6 md:mt-8 p-3 md:p-4 bg-white/5 rounded-xl border border-white/10">
                              <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed italic">
                                <span className="text-mystic-gold font-bold">Lưu ý về Mức độ năng lượng:</span> Đây là chỉ số (0-100%) thể hiện cường độ rung động và khả năng xoay chuyển vận thế trong năm đó.
                              </p>
                            </div>
                          </div>

                          <div className="bg-mystic-purple/10 border border-mystic-purple/20 rounded-3xl p-5 md:p-8 backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                              <Star className="w-10 h-10 md:w-12 md:h-12 text-mystic-gold animate-pulse" />
                            </div>
                            <h4 className="text-lg md:text-xl font-serif font-bold text-white mb-4 md:mb-6">
                              Tiêu Điểm Năm Hiện Tại: {currentYearData?.year}
                            </h4>
                            <div className="flex items-center gap-4 mb-4 md:mb-6">
                              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-mystic-gold flex items-center justify-center text-2xl md:text-3xl font-serif font-black text-mystic-dark shadow-lg shadow-mystic-gold/20">
                                {currentYearData?.value}
                              </div>
                              <div>
                                <p className="text-mystic-gold font-bold text-sm md:text-base">Năm Cá Nhân Số {currentYearData?.value}</p>
                                <p className="text-gray-400 text-[10px] md:text-xs">Vận thế hiện tại của bạn</p>
                              </div>
                            </div>
                            <div className="markdown-body prose prose-invert prose-sm max-w-none">
                              <ReactMarkdown>{currentYearData?.interpretation || ""}</ReactMarkdown>
                            </div>
                          </div>
                        </div>

                      {/* Detailed Interpretations for All Years */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-white/10" />
                          <h4 className="text-mystic-gold font-serif font-bold uppercase tracking-widest text-sm">
                            Luận Giải Chi Tiết Toàn Chu Kỳ
                          </h4>
                          <div className="h-px flex-1 bg-white/10" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:gap-6">
                          {cycleData && cycleData.map((item: any, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              className={`p-5 md:p-8 rounded-3xl border transition-all ${
                                item.year === 2026 
                                  ? 'bg-mystic-gold/5 border-mystic-gold/30 shadow-[0_0_30px_rgba(250,204,21,0.05)]' 
                                  : item.isCurrentCycle
                                    ? 'bg-white/5 border-white/10 hover:border-white/20'
                                    : 'bg-white/2 border-white/5 opacity-40 grayscale'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                                <div className="flex-shrink-0">
                                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center font-serif border ${
                                    item.year === 2026 
                                      ? 'bg-mystic-gold text-mystic-dark border-mystic-gold' 
                                      : item.isCurrentCycle
                                        ? 'bg-white/5 text-mystic-gold border-white/10'
                                        : 'bg-white/5 text-gray-500 border-white/5'
                                  }`}>
                                    <span className="text-[10px] uppercase font-bold tracking-tighter opacity-60">Năm</span>
                                    <span className="text-2xl md:text-3xl font-black leading-none">{item.value}</span>
                                    <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest mt-1">{item.year}</span>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3 md:mb-4">
                                    <h5 className={`text-base md:text-lg font-bold ${
                                      item.year === 2026 
                                        ? 'text-mystic-gold' 
                                        : item.isCurrentCycle ? 'text-white' : 'text-gray-500'
                                    }`}>
                                      Năm Cá Nhân Số {item.value} ({item.year})
                                      {item.year === 2026 && <span className="ml-2 text-[10px] bg-mystic-gold/20 text-mystic-gold px-2 py-0.5 rounded uppercase tracking-widest">Hiện tại</span>}
                                    </h5>
                                  </div>
                                  <div className="markdown-body prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed">
                                    <ReactMarkdown>{item.interpretation}</ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'pyramids' && (
                    <motion.div
                      key="pyramids"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-12"
                    >
                      {/* Visual Pyramid Chart - Fully Responsive */}
                      <div className="relative w-full bg-black/40 rounded-3xl border border-white/5 p-4 md:p-8">
                        <div className="w-full">
                          <div className="relative z-10 text-center mb-8 md:mb-12">
                            <h3 className="text-xl md:text-2xl font-serif font-bold text-mystic-gold flex items-center justify-center gap-3">
                              <Pyramid className="w-5 h-5 md:w-6 md:h-6" /> 4 Đỉnh Cao Kim Tự Tháp
                            </h3>
                            <p className="text-gray-400 text-[10px] md:text-sm mt-2">Đại diện cho 27 năm rực rỡ nhất trong cuộc đời</p>
                          </div>

                          <div className="relative h-auto aspect-[4/5] md:aspect-[4/3] md:h-[450px] w-full max-w-3xl mx-auto">
                            <svg 
                              viewBox={isMobile ? "100 0 600 500" : "0 0 800 500"} 
                              className="w-full h-full drop-shadow-2xl overflow-visible"
                            >
                            {/* Connection Lines */}
                            <g stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="5,5">
                              {/* Base to Level 1 */}
                              <line x1="150" y1="450" x2="275" y2="300" />
                              <line x1="400" y1="450" x2="275" y2="300" />
                              <line x1="400" y1="450" x2="525" y2="300" />
                              <line x1="650" y1="450" x2="525" y2="300" />
                              {/* Level 1 to Level 2 */}
                              <line x1="275" y1="300" x2="400" y2="150" />
                              <line x1="525" y1="300" x2="400" y2="150" />
                              {/* Level 2 to Level 3 */}
                              <line x1="400" y1="150" x2="400" y2="50" />
                            </g>

                            {/* Base Nodes */}
                            {[
                              { x: 150, y: 450, label: 'Tháng', val: isNaN(new Date(birthDate).getTime()) ? 0 : new Date(birthDate).getMonth() + 1 },
                              { x: 400, y: 450, label: 'Ngày', val: isNaN(new Date(birthDate).getTime()) ? 0 : new Date(birthDate).getDate() },
                              { x: 650, y: 450, label: 'Năm', val: isNaN(new Date(birthDate).getTime()) ? 0 : String(new Date(birthDate).getFullYear()).split('').reduce((a,b) => a + Number(b), 0) }
                            ].map((node, i) => (
                              <g key={`base-${i}`}>
                                <circle cx={node.x} cy={node.y} r={isMobile ? "35" : "30"} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" />
                                <text x={node.x} y={node.y + (isMobile ? 8 : 5)} textAnchor="middle" fill="#666" fontSize={isMobile ? "22" : "18"} fontWeight="bold">{node.val > 9 && node.val !== 11 && node.val !== 22 ? String(node.val).split('').reduce((a,b) => a + Number(b), 0) : node.val}</text>
                                <text x={node.x} y={node.y + (isMobile ? 60 : 50)} textAnchor="middle" fill="#444" fontSize={isMobile ? "14" : "12"} letterSpacing="2">{node.label.toUpperCase()}</text>
                              </g>
                            ))}

                            {/* Peak Nodes */}
                            {result.pyramids?.map((peak, i) => {
                              const coords = [
                                { x: 275, y: 300 }, // Peak 1
                                { x: 525, y: 300 }, // Peak 2
                                { x: 400, y: 150 }, // Peak 3
                                { x: 400, y: 50 }   // Peak 4
                              ];
                              
                              if (i >= coords.length) return null;
                              const { x, y } = coords[i];
                              
                              const birthYear = new Date(birthDate).getFullYear();
                              const currentAge = isNaN(birthYear) ? 0 : 2026 - birthYear;
                              let isCurrent = false;
                              if (i === 0) isCurrent = currentAge <= result.pyramids[0].age;
                              else if (i === 1 && result.pyramids[0]) isCurrent = currentAge > result.pyramids[0].age && currentAge <= result.pyramids[1]?.age;
                              else if (i === 2 && result.pyramids[1]) isCurrent = currentAge > result.pyramids[1].age && currentAge <= result.pyramids[2]?.age;
                              else if (i === 3 && result.pyramids[2]) isCurrent = currentAge > result.pyramids[2].age;
                              
                              return (
                                <g key={`peak-${i}`} className="cursor-pointer group">
                                  <defs>
                                    <filter id={`glow-${i}`}>
                                      <feGaussianBlur stdDeviation={isCurrent ? "8" : "3"} result="coloredBlur"/>
                                      <feMerge>
                                        <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                                      </feMerge>
                                    </filter>
                                  </defs>
                                  {isCurrent && (
                                    <motion.circle
                                      cx={x} cy={y} r="45"
                                      fill="none"
                                      stroke={i === 3 ? "#facc15" : "#a855f7"}
                                      strokeWidth="2"
                                      strokeDasharray="4 4"
                                      initial={{ rotate: 0 }}
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    />
                                  )}
                                  <circle 
                                    cx={x} cy={y} r={isMobile ? "35" : "35"} 
                                    fill={isCurrent ? (i === 3 ? "rgba(250,204,21,0.3)" : "rgba(168,85,247,0.3)") : (i === 3 ? "rgba(250,204,21,0.05)" : "rgba(126,34,206,0.05)")} 
                                    stroke={isCurrent ? "#fff" : (i === 3 ? "#facc15" : "#7e22ce")} 
                                    strokeWidth={isCurrent ? (isMobile ? "3" : "4") : "2"}
                                    filter={`url(#glow-${i})`}
                                    className="transition-all duration-500"
                                  />
                                  <text x={x} y={y + (isMobile ? 8 : 8)} textAnchor="middle" fill="#fff" fontSize={isMobile ? "24" : "24"} fontWeight="black" className="drop-shadow-md">{peak.value}</text>
                                  <text x={x + (isMobile ? 45 : 50)} y={y - (isMobile ? 5 : 0)} textAnchor="start" fill={isCurrent ? "#fff" : "#888"} fontSize={isMobile ? "14" : "12"} fontWeight={isCurrent ? "bold" : "normal"}>Đỉnh {i+1}</text>
                                  <text x={x + (isMobile ? 45 : 50)} y={y + (isMobile ? 15 : 15)} textAnchor="start" fill="#facc15" fontSize={isMobile ? "16" : "14"} fontWeight="bold" className={isCurrent ? "animate-pulse" : ""}>{peak.age} tuổi</text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    </div>

                      {/* Detailed Interpretations */}
                      <div className="grid grid-cols-1 gap-6 md:gap-8">
                        {result.pyramids && result.pyramids.map((item, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className={`p-6 md:p-8 rounded-3xl border transition-all relative overflow-hidden group hover:border-mystic-gold/30 ${
                              (() => {
                                const birthYear = new Date(birthDate).getFullYear();
                                const currentAge = isNaN(birthYear) ? 0 : 2026 - birthYear;
                                const isCurrent = (idx === 0 && currentAge <= item.age) ||
                                                 (idx === 1 && result.pyramids[0] && currentAge > result.pyramids[0].age && currentAge <= item.age) ||
                                                 (idx === 2 && result.pyramids[1] && currentAge > result.pyramids[1].age && currentAge <= item.age) ||
                                                 (idx === 3 && result.pyramids[2] && currentAge > result.pyramids[2].age);
                                return isCurrent 
                                  ? 'bg-mystic-gold/5 border-mystic-gold/30 shadow-[0_0_30px_rgba(250,204,21,0.05)]' 
                                  : 'bg-white/5 border-white/10';
                              })()
                            }`}
                          >
                            {(() => {
                              const birthYear = new Date(birthDate).getFullYear();
                              const currentAge = isNaN(birthYear) ? 0 : 2026 - birthYear;
                              const isCurrent = (idx === 0 && currentAge <= item.age) ||
                                               (idx === 1 && result.pyramids[0] && currentAge > result.pyramids[0].age && currentAge <= item.age) ||
                                               (idx === 2 && result.pyramids[1] && currentAge > result.pyramids[1].age && currentAge <= item.age) ||
                                               (idx === 3 && result.pyramids[2] && currentAge > result.pyramids[2].age);
                              return isCurrent && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-mystic-gold" />
                              );
                            })()}
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                              <Pyramid className="w-24 h-24 md:w-32 md:h-32 text-mystic-gold" />
                            </div>
                            <div className="relative z-10">
                              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-6 md:mb-8">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-mystic-gold flex flex-col items-center justify-center text-mystic-dark shadow-xl shadow-mystic-gold/20">
                                  <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-tighter opacity-70 leading-none mb-1">Đỉnh</span>
                                  <span className="text-3xl md:text-4xl font-serif font-black leading-none">{item.value}</span>
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                                    <h4 className="text-lg md:text-2xl font-serif font-bold text-white">Đỉnh Cao Thứ {idx + 1}</h4>
                                    <span className="px-2 py-0.5 bg-mystic-gold/20 text-mystic-gold rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest">
                                      {item.age} Tuổi
                                    </span>
                                    {(() => {
                                      const currentAge = 2026 - new Date(birthDate).getFullYear();
                                      const isCurrent = (idx === 0 && currentAge <= item.age) ||
                                                       (idx === 1 && currentAge > result.pyramids[0].age && currentAge <= item.age) ||
                                                       (idx === 2 && currentAge > result.pyramids[1].age && currentAge <= item.age) ||
                                                       (idx === 3 && currentAge > result.pyramids[2].age);
                                      return isCurrent && (
                                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-[8px] md:text-[10px] font-bold uppercase tracking-widest animate-pulse">
                                          Giai đoạn hiện tại
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <p className="text-mystic-gold font-medium text-xs md:text-base">Con số rung động: {item.value}</p>
                                </div>
                              </div>
                              <div className="markdown-body prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed">
                                <ReactMarkdown>{item.meaning}</ReactMarkdown>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-3xl"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Calculator className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-serif text-gray-400 mb-2">Chưa có dữ liệu phân tích</h3>
              <p className="text-gray-600 max-w-xs">Nhập thông tin của bạn để bắt đầu khám phá bản thân qua các con số.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <HistorySidebar
        type="numerology"
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={handleSelectHistory}
      />
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        onDownload={handleDownload}
        title="Thần Số Học"
      />
    </div>
  );
};
