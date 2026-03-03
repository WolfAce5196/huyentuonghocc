import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Home, User, CreditCard, Hash, Coins, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { name: 'Trang chủ', path: '/', icon: Home },
  { name: 'Nhân Tướng', path: '/physiognomy', icon: User },
  { name: 'Tarot', path: '/tarot', icon: CreditCard },
  { name: 'Gieo Quẻ Kinh Dịch', path: '/iching', icon: Hash },
  { name: 'Gieo Đài Âm Dương', path: '/divination', icon: Coins },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setIsOpen(false)}>
          <div className="relative">
            <Eye className="w-8 h-8 text-mystic-gold group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-mystic-gold/20 blur-lg rounded-full animate-pulse" />
          </div>
          <span className="text-xl font-serif font-bold tracking-widest text-white group-hover:text-mystic-gold transition-colors">
            HUYỀN TƯỚNG HỌC
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative text-sm font-medium tracking-wide transition-all hover:text-mystic-gold flex items-center gap-2",
                  isActive ? "text-mystic-gold" : "text-gray-400"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-mystic-gold"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-mystic-gold hover:bg-white/5 rounded-lg transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-mystic-bg/95 backdrop-blur-xl border-t border-white/5"
          >
            <div className="flex flex-col p-4 gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all",
                      isActive 
                        ? "bg-mystic-purple/20 text-mystic-gold border border-mystic-purple/30" 
                        : "text-gray-400 hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
