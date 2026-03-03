import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-[#050505]">
      {/* Mystical Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none flex items-center justify-center">
        {/* Central Sun/Core Glow */}
        <div className="absolute w-[400px] h-[400px] bg-mystic-gold/40 blur-[100px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute w-[200px] h-[200px] bg-white/30 blur-[50px] rounded-full mix-blend-screen" />

        {/* Dense Swirling Golden Smoke Layers - Using a more ornate pattern */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                rotate: i % 2 === 0 ? [0, 360] : [360, 0],
                scale: [1, 1.15, 0.95, 1],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ 
                rotate: { duration: 50 + i * 15, repeat: Infinity, ease: "linear" },
                scale: { duration: 12 + i * 4, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 10 + i * 3, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute w-[180%] h-[180%] opacity-30 mix-blend-screen"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1515405299443-f71bb768a795?q=80&w=2670&auto=format&fit=crop')`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                filter: `hue-rotate(${i * 10}deg) saturate(2.5) brightness(1.3) contrast(1.4) blur(${i}px)`,
                transform: `rotate(${i * 60}deg)`,
              }}
            />
          ))}
        </div>
        
        {/* Ornate Filigree Overlay - Simulating the intricate patterns in the image */}
        <motion.div
          animate={{ 
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute inset-0 opacity-15 mix-blend-color-dodge"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'invert(1) brightness(0.5) sepia(1) saturate(5) hue-rotate(-10deg)',
          }}
        />

        {/* Sharp Light Rays - More numerous and prominent */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
          className="absolute w-[400%] aspect-square opacity-40"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, 
              transparent 0deg, 
              rgba(212, 175, 55, 0.4) 1deg, 
              transparent 2deg,
              rgba(212, 175, 55, 0.4) 45deg,
              transparent 89deg,
              rgba(212, 175, 55, 0.4) 90deg,
              transparent 91deg,
              rgba(212, 175, 55, 0.4) 135deg,
              transparent 179deg,
              rgba(212, 175, 55, 0.4) 180deg,
              transparent 181deg,
              rgba(212, 175, 55, 0.4) 225deg,
              transparent 269deg,
              rgba(212, 175, 55, 0.4) 270deg,
              transparent 271deg,
              rgba(212, 175, 55, 0.4) 315deg,
              transparent 359deg,
              rgba(212, 175, 55, 0.4) 360deg)`
          }}
        />

        {/* Deep Vignette - Concentrating light in the center */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#050505_90%)]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-8xl font-serif font-bold mb-6 text-mystic-gold drop-shadow-[0_0_40px_rgba(212,175,55,0.8)] tracking-tight relative">
            <motion.span
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(212,175,55,0.4)",
                  "0 0 60px rgba(212,175,55,1)",
                  "0 0 20px rgba(212,175,55,0.4)"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              Huyền Tướng Học
            </motion.span>
          </h1>
          <p className="text-gray-200 text-lg md:text-xl max-w-3xl mx-auto mb-16 font-light tracking-[0.05em] leading-relaxed opacity-90 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
            Khám phá bí ẩn vận mệnh qua nhân tướng, bài Tarot, Kinh Dịch và thuật âm dương cổ truyền.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { title: 'Nhân Tướng', desc: 'Đọc vị khuôn mặt qua AI Vision', path: '/physiognomy', color: 'purple' },
              { title: 'Tarot', desc: 'Giải mã 78 lá bài huyền bí', path: '/tarot', color: 'gold' },
              { title: 'Kinh Dịch', desc: '64 quẻ Kinh Dịch cổ điển', path: '/iching', color: 'purple' },
              { title: 'Gieo Đài', desc: 'Âm Dương dân gian Việt Nam', path: '/divination', color: 'gold' },
            ].map((item, idx) => (
              <Link key={idx} to={item.path}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="glass-morphism p-8 rounded-2xl text-left group cursor-pointer h-full border-white/10 hover:border-mystic-gold/40 transition-all bg-black/60 backdrop-blur-3xl"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-6 transition-all group-hover:scale-110",
                    item.color === 'purple' ? "bg-mystic-purple/20 text-mystic-purple" : "bg-mystic-gold/20 text-mystic-gold"
                  )}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-2 group-hover:text-mystic-gold transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-xs font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity text-mystic-gold">
                    Khám phá <ArrowRight className="w-3 h-3" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

import { cn } from '../lib/utils';
