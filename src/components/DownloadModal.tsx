import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, User, Phone, Mail, ChevronRight, FileText, FileJson } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (userData: UserData, format: 'txt' | 'pdf') => void;
  title: string;
  interpretation: string;
}

export interface UserData {
  fullName: string;
  phone: string;
  email: string;
}

const STORAGE_KEY = 'mystic_user_suggestions';

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, onDownload, title, interpretation }) => {
  const [formData, setFormData] = useState<UserData>({
    fullName: '',
    phone: '',
    email: '',
  });

  const [isLogging, setIsLogging] = useState(false);

  const [suggestions, setSuggestions] = useState<{
    fullName: string[];
    phone: string[];
    email: string[];
  }>({
    fullName: [],
    phone: [],
    email: [],
  });

  const [downloadFormat, setDownloadFormat] = useState<'txt' | 'pdf'>('pdf');
  const [activeField, setActiveField] = useState<keyof UserData | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSuggestions(JSON.parse(saved));
    }
  }, []);

  const saveToSuggestions = (data: UserData) => {
    const newSuggestions = { ...suggestions };
    
    (Object.keys(data) as Array<keyof UserData>).forEach((key) => {
      const val = data[key].trim();
      if (val && !newSuggestions[key].includes(val)) {
        newSuggestions[key] = [val, ...newSuggestions[key]].slice(0, 3);
      }
    });

    setSuggestions(newSuggestions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSuggestions));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    
    try {
      // Summarize on frontend (as per guidelines: NEVER call Gemini from backend)
      let summary = interpretation.substring(0, 200) + "...";
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is missing on frontend. Using fallback summary.");
      } else {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: "user", parts: [{ text: `Hãy tóm tắt bản luận giải sau đây một cách ngắn gọn, xúc tích, logic và đầy đủ nhất (khoảng 2-3 câu): \n\n${interpretation}` }] }]
          });
          if (response.text) {
            summary = response.text;
          }
        } catch (aiError) {
          console.error("AI Summarization failed on frontend:", aiError);
        }
      }

      // Log to Google Sheets via backend
      const logResponse = await fetch('/api/log-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData: formData,
          category: title,
          summary: summary
        })
      });

      if (!logResponse.ok) {
        const errorData = await logResponse.json();
        console.error("Failed to log to Google Sheets:", errorData.error);
        // We don't block the download, but we log the error
      } else {
        console.log("Successfully logged to Google Sheets");
      }
    } catch (error) {
      console.error("Failed to log submission:", error);
    } finally {
      setIsLogging(false);
      saveToSuggestions(formData);
      onDownload(formData, downloadFormat);
      onClose();
    }
  };

  const selectSuggestion = (field: keyof UserData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setActiveField(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass-morphism p-6 md:p-8 rounded-[2.5rem] border border-mystic-gold/30 shadow-[0_0_50px_rgba(250,204,21,0.2)]"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-mystic-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-mystic-gold" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-white mb-2">Tải Dữ Liệu Luận Giải</h2>
              <p className="text-mystic-gold/60 text-sm uppercase tracking-widest">{title}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <label className="block text-xs font-bold text-mystic-gold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <User className="w-3 h-3" /> Họ và Tên
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  onFocus={() => setActiveField('fullName')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-colors"
                  placeholder="Nhập họ tên của bạn"
                />
                {activeField === 'fullName' && suggestions.fullName.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-mystic-bg border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    {suggestions.fullName.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectSuggestion('fullName', s)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 transition-colors flex items-center justify-between group"
                      >
                        {s}
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-mystic-gold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Số Điện Thoại (Zalo)
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  onFocus={() => setActiveField('phone')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-colors"
                  placeholder="Nhập số điện thoại"
                />
                {activeField === 'phone' && suggestions.phone.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-mystic-bg border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    {suggestions.phone.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectSuggestion('phone', s)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 transition-colors flex items-center justify-between group"
                      >
                        {s}
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-mystic-gold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Gmail nhận tài liệu
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => setActiveField('email')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-mystic-gold outline-none transition-colors"
                  placeholder="example@gmail.com"
                />
                {activeField === 'email' && suggestions.email.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-mystic-bg border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    {suggestions.email.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectSuggestion('email', s)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 transition-colors flex items-center justify-between group"
                      >
                        {s}
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-mystic-gold uppercase tracking-widest mb-3 flex items-center gap-2">
                  Định dạng tải về
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDownloadFormat('pdf')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      downloadFormat === 'pdf'
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <FileJson className="w-4 h-4" />
                    <span className="text-xs font-bold">PDF (Đẹp)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDownloadFormat('txt')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      downloadFormat === 'txt'
                        ? 'bg-mystic-gold/20 border-mystic-gold text-mystic-gold'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-bold">TXT (Cơ bản)</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLogging}
                className={`w-full py-4 bg-mystic-purple hover:bg-mystic-purple/80 text-white rounded-xl font-bold tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(126,34,206,0.3)] flex items-center justify-center gap-3 ${
                  isLogging ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLogging ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {isLogging ? 'Đang Xử Lý...' : 'Tải Về Ngay'}
              </button>
            </form>

            <p className="mt-6 text-center text-[10px] text-gray-500 uppercase tracking-widest">
              Dữ liệu của bạn được bảo mật tuyệt đối
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
