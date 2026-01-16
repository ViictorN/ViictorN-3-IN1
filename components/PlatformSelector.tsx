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

  const getColor = (p: Platform) => {
    switch (p) {
      case Platform.Twitch: return 'hover:text-twitch hover:shadow-[0_0_10px_rgba(145,70,255,0.4)]';
      case Platform.YouTube: return 'hover:text-youtube hover:shadow-[0_0_10px_rgba(255,0,0,0.4)]';
      case Platform.Kick: return 'hover:text-kick hover:shadow-[0_0_10px_rgba(83,252,24,0.4)]';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.95 }}
          className="flex gap-1.5 p-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-[18px] shadow-2xl"
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
                  relative p-2 rounded-[14px] transition-all duration-300 group
                  ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-neutral-500 bg-transparent hover:bg-white/5'}
                  ${getColor(p)}
                `}
                aria-label={`Switch to ${p}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePlatformGlow"
                    className="absolute inset-0 rounded-[14px] border border-white/20"
                    transition={{ duration: 0.3 }}
                  />
                )}
                <div className={`relative z-10 w-4 h-4 ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'} transition-transform`}>
                  {getIcon(p, "w-full h-full")}
                </div>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlatformSelector;