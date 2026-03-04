import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '../lib/utils';

export const HomePage: React.FC = () => {
  const { scrollY } = useScroll();
  
  // Parallax transforms - move slower than foreground (0.2x speed)
  const backgroundY = useTransform(scrollY, [0, 1000], [0, 200]);
  const rotatingY = useTransform(scrollY, [0, 1000], [0, 150]);
  const glowY = useTransform(scrollY, [0, 1000], [0, 100]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-[#050505]">
      {/* Mystical Background Elements - Optimized for maximum smoothness */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        {/* Static Base Background - High quality image instead of multiple filters */}
        <motion.div 
          style={{
            y: backgroundY,
            backgroundImage: `url('https://images.unsplash.com/photo-1515405299443-f71bb768a795?q=80&w=2670&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'saturate(1.5) brightness(0.6) hue-rotate(-10deg)',
          }}
          className="absolute inset-0 opacity-40"
        />

        {/* Single Slow Rotating Layer - Hardware accelerated */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          style={{
            y: rotatingY,
            backgroundImage: `url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'invert(1) sepia(1) saturate(2)',
            transform: 'translateZ(0)',
          }}
          className="absolute inset-[-50%] opacity-20 will-change-transform"
        />

        {/* Central Glow - Simple opacity pulse instead of complex scale/blur */}
        <motion.div 
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            y: glowY,
            x: '-50%',
            top: '50%',
            left: '50%',
          }}
          className="absolute -translate-y-1/2 w-[600px] h-[600px] bg-mystic-gold/20 blur-[120px] rounded-full mix-blend-screen will-change-[opacity]" 
        />

        {/* Deep Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#050505_100%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center py-12 md:py-20 mt-12 md:mt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 md:mb-8 text-mystic-gold tracking-tight relative px-4">
            <span className="drop-shadow-[0_0_30px_rgba(212,175,55,0.5)]">
              Huyền Tướng Học
            </span>
          </h1>
          <p className="text-gray-300 text-sm md:text-xl max-w-3xl mx-auto mb-10 md:mb-20 font-light tracking-wide leading-relaxed opacity-90 px-6">
            Khám phá bí ẩn vận mệnh qua nhân tướng, bài Tarot, Kinh Dịch và thuật âm dương cổ truyền.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 px-4">
            {[
              { title: 'Xem Nhân Tướng', desc: 'Đọc vị khuôn mặt qua AI Vision', path: '/physiognomy', color: 'purple' },
              { title: 'Bốc Bài Tarot', desc: 'Giải mã 78 lá bài huyền bí', path: '/tarot', color: 'gold' },
              { title: 'Thần Số Học', desc: 'Khám phá con số định mệnh', path: '/numerology', color: 'purple' },
              { title: 'Gieo Quẻ Kinh Dịch', desc: '64 quẻ Kinh Dịch cổ điển', path: '/iching', color: 'gold' },
              { title: 'Gieo Đài Âm Dương', desc: 'Âm Dương dân gia Việt Nam', path: '/divination', color: 'purple' },
            ].map((item, idx) => (
              <Link key={idx} to={item.path} className="group">
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative p-6 md:p-8 rounded-3xl text-left h-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-colors overflow-hidden will-change-transform"
                >
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.1),transparent_70%)]" />
                  
                  <div className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-6 md:mb-8 transition-transform group-hover:scale-110 duration-500",
                    item.color === 'purple' ? "bg-mystic-purple/20 text-mystic-purple" : "bg-mystic-gold/20 text-mystic-gold"
                  )}>
                    <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-serif font-bold mb-2 md:mb-3 group-hover:text-mystic-gold transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6 md:mb-8">
                    {item.desc}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-mystic-gold/60 group-hover:text-mystic-gold transition-colors duration-300">
                    Khám phá <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
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
