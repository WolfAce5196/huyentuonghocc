
import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NavigationArrows: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    // Scroll to just above the footer
    const footer = document.querySelector('footer');
    if (footer) {
      const footerTop = footer.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: footerTop - window.innerHeight + 100, // Adjust to show the end of content
        behavior: 'smooth',
      });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex flex-col gap-2">
      <motion.button
        animate={{ opacity: 0.3, scale: 1 }}
        whileHover={{ opacity: 1, scale: 1.2, backgroundColor: "rgba(255,255,255,0.1)" }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollToTop}
        className="p-2 md:p-2.5 bg-white/[0.03] text-white hover:text-mystic-gold rounded-full shadow-2xl backdrop-blur-xl border border-white/10 hover:border-mystic-gold/50 transition-all duration-300 group"
        title="Lên đầu trang"
      >
        <ChevronUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
      </motion.button>
      <motion.button
        animate={{ opacity: 0.3, scale: 1 }}
        whileHover={{ opacity: 1, scale: 1.2, backgroundColor: "rgba(255,255,255,0.1)" }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollToBottom}
        className="p-2 md:p-2.5 bg-white/[0.03] text-white hover:text-mystic-gold rounded-full shadow-2xl backdrop-blur-xl border border-white/10 hover:border-mystic-gold/50 transition-all duration-300 group"
        title="Xuống cuối nội dung"
      >
        <ChevronDown className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
      </motion.button>
    </div>
  );
};
