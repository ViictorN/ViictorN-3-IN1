import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Platform } from '../types';
import { TwitchIcon, YouTubeIcon, KickIcon } from '../constants';

interface PlatformSelectorProps {
  currentPlatform: Platform;
  availablePlatforms: Platform[];
  onSelect: (platform: Platform) => void;
  isOpen: boolean;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  currentPlatform,
  availablePlatforms,
  onSelect,
  isOpen,
}) => {
  const getIcon = (p: Platform, className: string) => {
    switch (p) {
      case Platform.Twitch: return <TwitchIcon className={className} />;
      case Platform.YouTube: return <YouTubeIcon className={className} />;
      case Platform.Kick: return <KickIcon className={className} />;
    }
  };

  const getActiveStyle = (p: Platform) => {
    switch (p) {
      case Platform.Twitch: 
        return 'text-[#9146FF] bg-[#9146FF]/10 border-[#9146FF]/30';
      case Platform.YouTube: 
        return 'text-[#FF0000] bg-[#FF0000]/10 border-[#FF0000]/30';
      case Platform.Kick: 
        return 'text-[#53FC18] bg-[#53FC18]/10 border-[#53FC18]/30';
      default: return 'text-white bg-white/10';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="flex flex-col gap-1 p-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl min-w-[130px] origin-bottom"
        >
          {availablePlatforms.map((p) => {
            const isActive = currentPlatform === p;
            return (
              <button
                key={p}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(p);
                }}
                className={`
                  relative group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border
                  ${isActive 
                    ? getActiveStyle(p)
                    : 'bg-transparent border-transparent text-neutral-400 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <div className={`w-4 h-4 flex-shrink-0 opacity-80 ${isActive ? 'opacity-100' : 'group-hover:opacity-100'}`}>
                  {getIcon(p, "w-full h-full")}
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider flex-1 text-left">
                    {p}
                </span>

                {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                )}
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlatformSelector;