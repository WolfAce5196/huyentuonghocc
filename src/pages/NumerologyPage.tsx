import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Save, Share2, History as HistoryIcon, Calculator, User, Calendar, Info, TrendingUp, Pyramid, Layout, Moon, Sun, Star } from 'lucide-react';
import { MODELS, SYSTEM_PROMPTS, safeGenerateContent, getCurrentContext } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HistorySidebar } from '../components/HistorySidebar';
import { saveHistory, HistoryItem } from '../lib/history';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';

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
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NumerologyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'core' | 'cycle' | 'pyramids'>('overview');

  const analyzeNumerology = async () => {
    if (!name || !birthDate) return;
    setLoading(true);
    setResult(null);
    setError(null);

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
        const parsedResult = JSON.parse(resultText) as NumerologyResult;
        setResult(parsedResult);

        // Save to history
        saveHistory({
          type: 'numerology',
          title: `Thần Số Học: ${name} (${birthDate})`,
          result: {
            name,
            birthDate,
            interpretation: parsedResult
          }
        });
      } catch (e) {
        console.error("JSON Parse Error:", e);
        setError("Không thể xử lý dữ liệu từ AI. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Đã xảy ra lỗi trong quá trình phân tích. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setName(item.result.name);
    setBirthDate(item.result.birthDate);
    setResult(item.result.interpretation);
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
    return result?.nineYearCycle.map(item => ({
      ...item,
      energy: getEnergyLevel(item.value)
    })) || [];
  }, [result]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-morphism p-4 border border-mystic-gold/30 rounded-xl">
          <p className="text-mystic-gold font-bold mb-1">{label}</p>
          <p className="text-white text-sm">Chỉ số: <span className="font-bold">{payload[0].value}</span></p>
          {payload[0].payload.interpretation && (
            <p className="text-gray-400 text-xs mt-2 max-w-[200px] leading-relaxed">
              {payload[0].payload.interpretation}
            </p>
          )}
          {payload[0].payload.meaning && (
            <p className="text-gray-400 text-xs mt-2 max-w-[200px] leading-relaxed">
              {payload[0].payload.meaning}
            </p>
          )}
        </div>
      );
    }
    return null;
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
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-serif font-bold mb-4"
        >
          Thần Số Học
        </motion.h1>
        <p className="text-mystic-gold tracking-[0.2em] uppercase text-sm">
          “Khám phá bản đồ cuộc đời qua những con số”
        </p>
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
              onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setBirthDate(e.target.value)}
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
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Main Number - Prominent Display */}
              <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
                <motion.p 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-mystic-gold uppercase tracking-[0.4em] text-sm font-bold mb-4"
                >
                  Con Số Chủ Đạo Của Bạn
                </motion.p>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[12rem] md:text-[18rem] font-serif font-black leading-none animate-text-pattern select-none"
                >
                  {result.mainNumber}
                </motion.h2>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: 200 }}
                  className="h-1 bg-gradient-to-r from-transparent via-mystic-gold to-transparent mt-8"
                />
              </div>

              {/* Tabs Navigation */}
              <div className="flex flex-wrap justify-center gap-4 border-b border-white/10 pb-4">
                {[
                  { id: 'overview', label: 'Tổng Quan', icon: Layout },
                  { id: 'core', label: 'Các Chỉ Số Chính', icon: Info },
                  { id: 'cycle', label: 'Chu Kỳ 9 Năm', icon: TrendingUp },
                  { id: 'pyramids', label: 'Kim Tự Tháp', icon: Pyramid },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                      activeTab === tab.id 
                        ? 'bg-mystic-purple text-white shadow-lg shadow-mystic-purple/20' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="glass-morphism p-8 md:p-12 rounded-3xl border-mystic-gold/20">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-mystic-gold/10">
                            <Layout className="w-6 h-6 text-mystic-gold" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Bản Đồ Vận Mệnh Toàn Diện</h3>
                            <p className="text-gray-400 text-sm">Phân tích chuyên sâu & Bóc tách đa chiều</p>
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
                      
                      <div className="markdown-body prose prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.overview}</ReactMarkdown>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/10">
                        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                          <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Thế mạnh cốt lõi
                          </h4>
                          <ul className="space-y-2">
                            {result.strengths.map((s, i) => (
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
                            {result.weaknesses.map((w, i) => (
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
                            {result.advice.map((a, i) => (
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
                      className="space-y-12"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="py-4 px-6 text-mystic-gold font-serif uppercase tracking-widest text-sm">Chỉ số</th>
                              <th className="py-4 px-6 text-mystic-gold font-serif uppercase tracking-widest text-sm text-center">Con số</th>
                              <th className="py-4 px-6 text-mystic-gold font-serif uppercase tracking-widest text-sm">Ý nghĩa tóm tắt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.coreNumbers.map((item, idx) => (
                              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6 font-bold text-white">{item.name}</td>
                                <td className="py-4 px-6 text-center">
                                  <span className="inline-block px-3 py-1 bg-mystic-purple/20 text-mystic-purple rounded-lg font-bold">
                                    {item.value}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-gray-400 text-sm leading-relaxed">{item.meaning}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                          <h4 className="text-emerald-500 font-bold uppercase tracking-widest text-xs mb-4">Điểm Mạnh</h4>
                          <ul className="space-y-2">
                            {result.strengths.map((s, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-emerald-500 mt-1">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                          <h4 className="text-red-500 font-bold uppercase tracking-widest text-xs mb-4">Điểm Yếu</h4>
                          <ul className="space-y-2">
                            {result.weaknesses.map((w, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-6 rounded-2xl bg-mystic-gold/5 border border-mystic-gold/20">
                          <h4 className="text-mystic-gold font-bold uppercase tracking-widest text-xs mb-4">Lời Khuyên</h4>
                          <ul className="space-y-2">
                            {result.advice.map((a, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
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
                      <div className="relative h-[500px] w-full bg-black/40 rounded-3xl border border-white/5 overflow-hidden p-8">
                        {/* Mystical Background Elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-mystic-purple/10 blur-[100px] rounded-full" />
                          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-mystic-gold/10 blur-[100px] rounded-full" />
                          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                        </div>

                        <div className="relative z-10 h-full flex flex-col">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h3 className="text-2xl font-serif font-bold text-mystic-gold flex items-center gap-3">
                                <Moon className="w-6 h-6" /> Biểu Đồ Chu Kỳ 9 Năm
                              </h3>
                              <p className="text-gray-400 text-sm">Hành trình năng lượng từ Gieo hạt đến Thu hoạch</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-mystic-gold shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                                <span className="text-gray-300">Năm Hiện Tại (2026)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-mystic-purple" />
                                <span className="text-gray-300">Tiến Trình Chu Kỳ</span>
                              </div>
                            </div>
                          </div>

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
                                  fontSize={12} 
                                  tickLine={false} 
                                  axisLine={false}
                                  dy={10}
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
                                    
                                    const isCurrentYear = payload.year === 2026;
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
                                          cx={cx} cy={cy} r={isCurrentYear ? 6 : 4} 
                                          fill={isCurrentYear ? "#facc15" : (isPeak ? "#a855f7" : (isDip ? "#f43f5e" : "#7e22ce"))}
                                          stroke={isCurrentYear ? "#fff" : "none"}
                                          strokeWidth={2}
                                          className="cursor-pointer transition-all hover:r-8"
                                        />
                                        <text 
                                          x={cx} y={cy - 15} 
                                          textAnchor="middle" 
                                          fill={isCurrentYear ? "#facc15" : "#fff"} 
                                          fontSize={isCurrentYear ? 16 : 12}
                                          fontWeight={isCurrentYear ? "bold" : "normal"}
                                          className="pointer-events-none font-serif"
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                          <h4 className="text-xl font-serif font-bold text-mystic-gold mb-6 flex items-center gap-3">
                            <Sun className="w-5 h-5" /> Ý Nghĩa Các Giai Đoạn
                          </h4>
                          <div className="space-y-6">
                            {[
                              { range: 'Năm 1, 2, 3', label: 'Giai đoạn Gieo hạt & Khởi đầu', color: 'text-emerald-400' },
                              { range: 'Năm 4', label: 'Điểm trũng 1: Củng cố & Nghỉ ngơi', color: 'text-red-400' },
                              { range: 'Năm 5, 6', label: 'Giai đoạn Thay đổi & Mở rộng', color: 'text-mystic-purple' },
                              { range: 'Năm 7', label: 'Điểm trũng 2: Chiêm nghiệm & Học hỏi', color: 'text-red-400' },
                              { range: 'Năm 8, 9', label: 'Giai đoạn Gặt hái & Hoàn tất', color: 'text-mystic-gold' },
                            ].map((phase, i) => (
                              <div key={i} className="flex items-start gap-4 group">
                                <div className="mt-1 w-2 h-2 rounded-full bg-white/20 group-hover:bg-mystic-gold transition-colors" />
                                <div>
                                  <span className={`font-bold ${phase.color}`}>{phase.range}:</span>
                                  <p className="text-gray-400 text-sm mt-1">{phase.label}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-mystic-purple/10 border border-mystic-purple/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Star className="w-12 h-12 text-mystic-gold animate-pulse" />
                          </div>
                          <h4 className="text-xl font-serif font-bold text-white mb-6">
                            Tiêu Điểm Năm Hiện Tại: {result.nineYearCycle[0].year}
                          </h4>
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-mystic-gold flex items-center justify-center text-3xl font-serif font-black text-mystic-dark shadow-lg shadow-mystic-gold/20">
                              {result.nineYearCycle[0].value}
                            </div>
                            <div>
                              <p className="text-mystic-gold font-bold">Năm Cá Nhân Số {result.nineYearCycle[0].value}</p>
                              <p className="text-gray-400 text-xs">Vận thế hiện tại của bạn</p>
                            </div>
                          </div>
                          <div className="markdown-body prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{result.nineYearCycle[0].interpretation}</ReactMarkdown>
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

                        <div className="grid grid-cols-1 gap-6">
                          {result.nineYearCycle.map((item, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              className={`p-8 rounded-3xl border transition-all ${
                                item.year === 2026 
                                  ? 'bg-mystic-gold/5 border-mystic-gold/30 shadow-[0_0_30px_rgba(250,204,21,0.05)]' 
                                  : 'bg-white/5 border-white/10 hover:border-white/20'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-shrink-0">
                                  <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-serif border ${
                                    item.year === 2026 
                                      ? 'bg-mystic-gold text-mystic-dark border-mystic-gold' 
                                      : 'bg-white/5 text-mystic-gold border-white/10'
                                  }`}>
                                    <span className="text-xs uppercase font-bold tracking-tighter opacity-60">Năm</span>
                                    <span className="text-3xl font-black leading-none">{item.value}</span>
                                    <span className="text-[10px] uppercase font-bold tracking-widest mt-1">{item.year}</span>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-4">
                                    <h5 className={`text-lg font-bold ${item.year === 2026 ? 'text-mystic-gold' : 'text-white'}`}>
                                      Năm Cá Nhân Số {item.value} ({item.year})
                                      {item.year === 2026 && <span className="ml-3 text-xs bg-mystic-gold/20 text-mystic-gold px-2 py-1 rounded-md uppercase tracking-widest">Hiện tại</span>}
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
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={result.pyramids}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis 
                              dataKey="age" 
                              stroke="#666" 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={false} 
                              label={{ value: 'Độ tuổi', position: 'insideBottom', offset: -5, fill: '#666' }}
                            />
                            <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} domain={[0, 12]} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line 
                              type="stepAfter" 
                              dataKey="value" 
                              stroke="#facc15" 
                              strokeWidth={3}
                              dot={{ r: 6, fill: '#facc15', strokeWidth: 2, stroke: '#0a0a0f' }}
                              activeDot={{ r: 8, strokeWidth: 0 }}
                              animationDuration={2000}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {result.pyramids.map((item, idx) => (
                          <div key={idx} className="p-8 rounded-3xl bg-white/5 border border-mystic-gold/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                              <Pyramid className="w-24 h-24 text-mystic-gold" />
                            </div>
                            <div className="relative z-10">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-mystic-gold/20 flex items-center justify-center text-mystic-gold font-serif text-2xl font-bold">
                                  {item.value}
                                </div>
                                <div>
                                  <p className="text-mystic-gold text-xs uppercase tracking-widest font-bold">Đỉnh cao số {idx + 1}</p>
                                  <p className="text-white font-bold">Độ tuổi: {item.age}</p>
                                </div>
                              </div>
                              <p className="text-gray-400 leading-relaxed">{item.meaning}</p>
                            </div>
                          </div>
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
    </div>
  );
};
