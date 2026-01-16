import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamerConfig, Platform } from '../types';
import PlatformSelector from './PlatformSelector';

interface StreamSlotProps {
  streamer: StreamerConfig;
  currentPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
}

const StreamSlot: React.FC<StreamSlotProps> = ({ streamer, currentPlatform, onPlatformChange }) => {
  const [showControls, setShowControls] = useState(false);
  const channelId = streamer.channels[currentPlatform];

  const handlePlatformSelect = (p: Platform) => {
    onPlatformChange(p);
    setShowControls(false);
  };

  const getEmbedUrl = () => {
    const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    
    if (!channelId) return '';

    switch (currentPlatform) {
      case Platform.Twitch:
        return `https://player.twitch.tv/?channel=${channelId}&parent=${parent}&muted=false`;
      case Platform.YouTube:
        // Note: For YouTube Live, channelId MUST be the Channel ID (starting with UC), not a handle (@).
        return `https://www.youtube.com/embed/live_stream?channel=${channelId}`; 
      case Platform.Kick:
        return `https://player.kick.com/${channelId}`;
      default:
        return '';
    }
  };

  const availablePlatforms = Object.keys(streamer.channels).map(k => k as Platform);

  return (
    <div 
      className="relative w-full h-full bg-neutral-900 overflow-hidden group border-r border-b border-white/5 last:border-r-0 last:border-b-0"
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Platform Indicator Label (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
        <div className={`
          px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded shadow-lg backdrop-blur-md border border-white/5
          ${currentPlatform === Platform.Twitch ? 'bg-twitch text-white' : ''}
          ${currentPlatform === Platform.YouTube ? 'bg-youtube text-white' : ''}
          ${currentPlatform === Platform.Kick ? 'bg-kick text-black' : ''}
        `}>
          {currentPlatform}
        </div>
      </div>

      {/* Manual Settings Toggle (Top Right) - Essential for interaction control */}
      <button
        onClick={(e) => {
            e.stopPropagation();
            setShowControls(prev => !prev);
        }}
        className={`
            absolute top-4 right-4 z-40 w-8 h-8 flex items-center justify-center rounded-full
            bg-black/40 backdrop-blur border border-white/10 text-white/70 
            hover:bg-white/10 hover:text-white transition-all
            ${showControls ? 'opacity-100 bg-white/20 text-white' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}
        `}
        title="Trocar Plataforma"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 20.66-1-1.73"/><path d="M11 10.27 7 3.34"/><path d="m20.66 17-1.73-1"/><path d="m3.34 7 1.73 1"/><path d="M14 12h8"/><path d="M2 12h2"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m17 3.34-1 1.73"/><path d="m11 13.73-4 6.93"/></svg>
      </button>

      {/* Video Player Container */}
      <div className="w-full h-full bg-black relative">
         {channelId ? (
            <iframe
              src={getEmbedUrl()}
              title={`${streamer.name} - ${currentPlatform}`}
              className="w-full h-full pointer-events-auto"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
         ) : (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 pointer-events-none">
             <span className="text-4xl font-black uppercase tracking-widest">{streamer.name}</span>
             <span className="text-sm font-medium tracking-wider mt-2">Offline</span>
           </div>
         )}
      </div>

      {/* Cinematic Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-30 flex flex-col justify-end pointer-events-none"
          >
             {/* Gradient Background - CRITICAL: Must be pointer-events-none to allow clicking through to video if needed, though usually overlay covers it. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

            {/* Content Container */}
            <div className="relative p-6 flex flex-col items-center justify-end h-full">
              <motion.h2 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-black uppercase tracking-tighter text-white mb-6 drop-shadow-2xl pointer-events-none"
              >
                {streamer.name}
              </motion.h2>

              <div className="pointer-events-auto">
                <PlatformSelector 
                  isOpen={true}
                  currentPlatform={currentPlatform}
                  availablePlatforms={availablePlatforms}
                  onSelect={handlePlatformSelect}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreamSlot;