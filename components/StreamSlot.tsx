import React, { useState, useMemo } from 'react';
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
  const [refreshKey, setRefreshKey] = useState(0); 
  
  const hostname = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }
    return '';
  }, []);

  const channelId = streamer.channels[currentPlatform];

  const handlePlatformSelect = (p: Platform) => {
    onPlatformChange(p);
    setShowControls(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshKey(prev => prev + 1);
  };

  const embedUrl = useMemo(() => {
    if (!channelId) return '';

    let twitchParentParams = '';
    if (hostname) {
       if (hostname === 'localhost' || hostname === '127.0.0.1') {
           twitchParentParams = `parent=localhost&parent=127.0.0.1`;
       } else {
           const rootDomain = hostname.replace(/^www\./, '');
           twitchParentParams = `parent=${rootDomain}&parent=www.${rootDomain}`;
           
           if (hostname !== rootDomain && hostname !== `www.${rootDomain}`) {
               twitchParentParams += `&parent=${hostname}`;
           }
       }
    }

    switch (currentPlatform) {
      case Platform.Twitch:
        return `https://player.twitch.tv/?channel=${channelId}&${twitchParentParams}&muted=true&autoplay=true`;
      case Platform.YouTube:
        return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&controls=1&playsinline=1`; 
      case Platform.Kick:
        return `https://player.kick.com/${channelId}?autoplay=true&muted=true`;
      default:
        return '';
    }
  }, [channelId, currentPlatform, hostname]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      
      {/* 1. LAYER 0: IFRAME - DIRECT HIT TARGET */}
      {/* No container wrapping this unless necessary. Absolute inset-0 ensures it fills space. */}
      <div className="absolute inset-0 z-0 bg-black">
         {channelId ? (
            <iframe
              key={`${currentPlatform}-${refreshKey}`} 
              src={embedUrl}
              title={`${streamer.name} - ${currentPlatform}`}
              className="w-full h-full border-none"
              style={{ pointerEvents: 'auto' }} // Explicitly allow clicks
              referrerPolicy="no-referrer" // Loosest policy to avoid origin checks blocking
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            />
         ) : (
           <div className="flex flex-col items-center justify-center w-full h-full text-white/10 select-none">
             <span className="text-4xl font-black uppercase tracking-widest">{streamer.name}</span>
             <span className="text-sm font-medium tracking-wider mt-2">Offline</span>
           </div>
         )}
      </div>

      {/* 
          2. INDEPENDENT UI ELEMENTS (Z-10)
          CRITICAL FIX: Removed the <div className="absolute inset-0 z-10"> wrapper.
          By positioning these elements individually, we ensure the center of the screen
          (where the Play button lives) is COMPLETELY free of DOM nodes.
      */}

      {/* TOP LEFT: Badge */}
      <div className="absolute top-4 left-4 z-10">
        <div className={`
          cursor-default select-none
          px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded shadow-lg backdrop-blur-md border border-white/5
          ${currentPlatform === Platform.Twitch ? 'bg-twitch text-white' : ''}
          ${currentPlatform === Platform.YouTube ? 'bg-youtube text-white' : ''}
          ${currentPlatform === Platform.Kick ? 'bg-kick text-black' : ''}
        `}>
          {currentPlatform}
        </div>
      </div>

      {/* TOP RIGHT: Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {/* Reload Button */}
        <button
            onClick={handleReload}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors pointer-events-auto"
            title="Recarregar Player"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
        </button>

        {/* Settings Button */}
        <button
            onClick={(e) => {
                e.stopPropagation();
                setShowControls(prev => !prev);
            }}
            className={`
                w-8 h-8 flex items-center justify-center rounded-full
                transition-all duration-200 cursor-pointer pointer-events-auto
                ${showControls 
                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                    : 'bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }
            `}
            title="Trocar Plataforma"
        >
            {showControls ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
        </button>
      </div>

      {/* 3. SETTINGS OVERLAY (Z-20) */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 flex flex-col justify-end"
          >
             {/* Gradient Background - Click to dismiss */}
            <div 
                className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent cursor-pointer"
                onClick={() => setShowControls(false)}
            />

            {/* Interactive Content */}
            <div 
                className="relative p-6 flex flex-col items-center justify-end h-full z-30 pointer-events-none"
            >
              <motion.h2 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-black uppercase tracking-tighter text-white mb-6 drop-shadow-2xl select-none"
              >
                {streamer.name}
              </motion.h2>

              <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <PlatformSelector 
                  isOpen={true}
                  currentPlatform={currentPlatform}
                  availablePlatforms={Object.keys(streamer.channels).map(k => k as Platform)}
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