import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { MysticBackground } from './components/MysticBackground';
import { HomePage } from './pages/HomePage';
import { PhysiognomyPage } from './pages/PhysiognomyPage';
import { TarotPage } from './pages/TarotPage';
import { IChingPage } from './pages/IChingPage';
import { DivinationPage } from './pages/DivinationPage';
import { NumerologyPage } from './pages/NumerologyPage';
import { ReadingProvider } from './context/ReadingContext';
import { NavigationArrows } from './components/NavigationArrows';

import { Toaster } from 'react-hot-toast';

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
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/physiognomy" element={<PhysiognomyPage />} />
              <Route path="/tarot" element={<TarotPage />} />
              <Route path="/iching" element={<IChingPage />} />
              <Route path="/divination" element={<DivinationPage />} />
              <Route path="/numerology" element={<NumerologyPage />} />
            </Routes>
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
