import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { TarotCard } from '../constants/tarotData';
import { cn } from '../lib/utils';

interface TarotFlipCardProps {
  card: TarotCard;
  isReversed: boolean;
  onReveal: () => void;
  label?: string;
  isInitialFlipped?: boolean;
}

const CARD_BACK_URL = "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/RWS_Tarot_card_back.jpg&width=500";

export const TarotFlipCard: React.FC<TarotFlipCardProps> = ({ card, isReversed, onReveal, label, isInitialFlipped = false }) => {
  const [isFlipped, setIsFlipped] = useState(isInitialFlipped);
  const [imageError, setImageError] = useState(false);

  // Sync flipped state if it changes from outside (e.g. reset)
  useEffect(() => {
    setIsFlipped(isInitialFlipped);
  }, [isInitialFlipped]);

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      onReveal();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="perspective-1000">
        <motion.div
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative w-[140px] h-[240px] sm:w-[220px] sm:h-[380px] md:w-[280px] md:h-[480px] lg:w-[320px] lg:h-[540px] cursor-pointer"
          onClick={handleFlip}
        >
          {/* Mặt sau (Rider-Waite Back) */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden border-2 border-mystic-purple/50 shadow-[0_0_20px_rgba(126,34,206,0.3)] bg-mystic-bg"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <img 
              src={CARD_BACK_URL} 
              alt="Tarot Back" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/RWS_Tarot_card_back.jpg/800px-RWS_Tarot_card_back.jpg";
              }}
            />
            <div className="absolute inset-0 bg-mystic-purple/10 flex items-center justify-center">
              <div className="w-[85%] h-[85%] border border-mystic-gold/20 rounded-xl flex flex-col items-center justify-center gap-2 sm:gap-4 bg-black/20 backdrop-blur-sm">
                <Sparkles className="w-6 h-6 sm:w-12 sm:h-12 text-mystic-gold animate-pulse" />
                <p className="text-mystic-gold/60 font-serif tracking-[0.2em] uppercase text-[8px] sm:text-[10px]">Huyền Tướng Học</p>
              </div>
            </div>
          </div>

          {/* Mặt trước (Wikimedia RWS Front) */}
          <div 
            className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl overflow-hidden border-4 border-mystic-gold shadow-[0_0_40px_rgba(250,204,21,0.6)] bg-mystic-bg"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)' 
            }}
          >
            <motion.div
              animate={isFlipped ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="w-full h-full relative"
            >
              <img
                src={imageError ? card.fallback_url : card.image_url}
                alt={card.name_en}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-500",
                  isReversed && "rotate-180"
                )}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (!imageError) {
                    setImageError(true);
                  } else {
                    // Final fallback to picsum if even sacred-texts fails
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/tarot${card.id}/500/800`;
                  }
                }}
              />
              {/* Overlay glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(250,204,21,0.3)]" />
              
              {/* Floating particles (sparks) */}
              {isFlipped && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 0, x: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0], 
                        y: [0, -100 - Math.random() * 100],
                        x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200]
                      }}
                      transition={{ 
                        duration: 2 + Math.random() * 2, 
                        repeat: Infinity,
                        delay: 0.8 + Math.random() * 2
                      }}
                      className="absolute bottom-0 left-1/2 w-1 h-1 bg-mystic-gold rounded-full blur-[1px]"
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Thông tin lá bài sau khi lật */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center max-w-[140px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[320px]"
          >
            <p className="text-xs sm:text-lg md:text-2xl font-bold text-mystic-gold tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] mb-1 sm:mb-2 uppercase font-serif">
              {card.name_en}
            </p>
            
            <div className="flex justify-center mb-1 sm:mb-3">
              {isReversed ? (
                <span className="px-1.5 py-0.5 sm:px-3 sm:py-1 bg-mystic-purple/20 text-mystic-purple border border-mystic-purple/50 rounded-full text-[8px] sm:text-xs font-bold flex items-center gap-1 animate-pulse">
                  Ngược ↓
                </span>
              ) : (
                <span className="px-1.5 py-0.5 sm:px-3 sm:py-1 bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/50 rounded-full text-[8px] sm:text-xs font-bold flex items-center gap-1 animate-pulse">
                  Xuôi ↑
                </span>
              )}
            </div>

            <p className="text-gray-400 italic text-[10px] sm:text-sm font-sans line-clamp-2 sm:line-clamp-3 leading-tight sm:leading-relaxed">
              {isReversed ? card.reversed_desc_short : card.upright_desc_short}
            </p>
            
            {label && (
              <p className="mt-1 sm:mt-4 text-mystic-purple font-sans font-bold tracking-[0.2em] uppercase text-[8px] sm:text-[11px]">
                {label}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
