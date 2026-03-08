import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { MysticBackground } from './components/MysticBackground';
import { ReadingProvider } from './context/ReadingContext';
import { NavigationArrows } from './components/NavigationArrows';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const PhysiognomyPage = lazy(() => import('./pages/PhysiognomyPage').then(m => ({ default: m.PhysiognomyPage })));
const TarotPage = lazy(() => import('./pages/TarotPage').then(m => ({ default: m.TarotPage })));
const IChingPage = lazy(() => import('./pages/IChingPage').then(m => ({ default: m.IChingPage })));
const DivinationPage = lazy(() => import('./pages/DivinationPage').then(m => ({ default: m.DivinationPage })));
const NumerologyPage = lazy(() => import('./pages/NumerologyPage').then(m => ({ default: m.NumerologyPage })));

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
    {/* Background Glows */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-mystic-purple/10 blur-[120px] rounded-full" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-mystic-gold/5 blur-[80px] rounded-full" />
    
    <div className="relative z-10 flex flex-col items-center">
      <motion.div 
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          rotate: { duration: 3, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
        className="w-20 h-20 md:w-24 md:h-24 mb-8 relative"
      >
        <div className="absolute inset-0 border-2 border-mystic-gold/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-t-mystic-gold rounded-full" />
        <div className="absolute inset-4 border border-mystic-purple/30 rounded-full animate-pulse" />
        <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-mystic-gold opacity-50" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h2 className="text-mystic-gold font-serif text-xl md:text-2xl mb-2 tracking-widest uppercase">Huyền Tướng Học</h2>
        <p className="text-gray-500 font-light tracking-[0.3em] uppercase text-[10px] md:text-xs animate-pulse">
          Đang khởi tạo không gian huyền bí...
        </p>
      </motion.div>
    </div>
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default function App() {
  return (
    <ReadingProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <ScrollToTop />
        <div className="min-h-screen text-white selection:bg-mystic-purple selection:text-white">
          <MysticBackground />
          <Navbar />
          <main className="relative z-10">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/physiognomy" element={<PhysiognomyPage />} />
                <Route path="/tarot" element={<TarotPage />} />
                <Route path="/iching" element={<IChingPage />} />
                <Route path="/divination" element={<DivinationPage />} />
                <Route path="/numerology" element={<NumerologyPage />} />
              </Routes>
            </Suspense>
          </main>
          
          <NavigationArrows />

          <footer className="relative z-10 py-12 border-t border-white/5 glass-morphism mt-20">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-gray-500 text-sm font-light tracking-widest uppercase">
                &copy; 2026 HUYỀN TƯỚNG HỌC - AI Powered Mystic Platform
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </ReadingProvider>
  );
}
