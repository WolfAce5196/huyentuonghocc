import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center pt-40 pb-20 px-4 overflow-hidden bg-[#050505]">
      {/* Mystical Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        {/* Central Pulsing Glow */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] aspect-square bg-mystic-gold/20 blur-[120px] rounded-full"
        />

        {/* Rotating Light Rays */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square opacity-20"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, 
              transparent 0deg, 
              rgba(212, 175, 55, 0.1) 10deg, 
              transparent 20deg,
              rgba(212, 175, 55, 0.1) 45deg,
              transparent 70deg,
              rgba(212, 175, 55, 0.1) 120deg,
              transparent 150deg,
              rgba(212, 175, 55, 0.1) 190deg,
              transparent 220deg,
              rgba(212, 175, 55, 0.1) 270deg,
              transparent 310deg,
              rgba(212, 175, 55, 0.1) 340deg,
              transparent 360deg)`
          }}
        />

        {/* Swirling Golden Aura (Simulated Ethereal Smoke) */}
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1200px] h-[700px]">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                rotate: i % 2 === 0 ? [0, 360] : [360, 0],
                scale: [1, 1.2, 0.9, 1.1, 1],
                x: [0, 20, -20, 10, 0],
                y: [0, -10, 15, -5, 0],
                opacity: [0.1, 0.3, 0.15, 0.4, 0.1]
              }}
              transition={{ 
                rotate: { duration: 30 + i * 15, repeat: Infinity, ease: "linear" },
                scale: { duration: 10 + i * 3, repeat: Infinity, ease: "easeInOut" },
                x: { duration: 12 + i * 4, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 15 + i * 5, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute inset-0 border-[2px] border-mystic-gold/5 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] blur-3xl mix-blend-screen"
              style={{
                background: `radial-gradient(circle at ${20 + i * 15}% ${30 + i * 12}%, rgba(212, 175, 55, 0.2), transparent 60%)`,
                filter: `blur(${40 + i * 10}px)`
              }}
            />
          ))}
        </div>

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505] opacity-80" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-8xl font-serif font-bold mb-6 text-mystic-gold drop-shadow-[0_0_30px_rgba(212,175,55,0.5)] tracking-tight relative">
            <motion.span
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(212,175,55,0.4)",
                  "0 0 40px rgba(212,175,55,0.8)",
                  "0 0 20px rgba(212,175,55,0.4)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Huyền Tướng Học
            </motion.span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto mb-20 font-light tracking-[0.05em] leading-relaxed opacity-90">
            Khám phá bí ẩn vận mệnh qua nhân tướng, bài Tarot, Kinh Dịch và thuật âm dương cổ truyền.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {[
              { title: 'Nhân Tướng', desc: 'Đọc vị khuôn mặt qua AI Vision', path: '/physiognomy', color: 'purple' },
              { title: 'Tarot', desc: 'Giải mã 78 lá bài huyền bí', path: '/tarot', color: 'gold' },
              { title: 'Kinh Dịch', desc: '64 quẻ Kinh Dịch cổ điển', path: '/iching', color: 'purple' },
              { title: 'Gieo Đài', desc: 'Âm Dương dân gian Việt Nam', path: '/divination', color: 'gold' },
            ].map((item, idx) => (
              <Link key={idx} to={item.path}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="glass-morphism p-8 rounded-2xl text-left group cursor-pointer h-full border-white/5 hover:border-mystic-gold/30 transition-all bg-black/20 backdrop-blur-md"
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
                  <p className="text-gray-500 text-sm leading-relaxed">
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
