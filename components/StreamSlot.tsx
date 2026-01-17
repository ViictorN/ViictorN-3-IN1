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

  const origin = useMemo(() => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
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

    // Robust Parent Logic for Twitch
    const domains = new Set<string>();
    domains.add('viictornmultistream.vercel.app');
    
    if (hostname) {
        domains.add(hostname);
        const root = hostname.replace(/^www\./, '');
        domains.add(root);
        domains.add(`www.${root}`);
    }

    const twitchParentParams = Array.from(domains)
        .map(d => `parent=${d}`)
        .join('&');

    switch (currentPlatform) {
      case Platform.Twitch:
        // Twitch often needs muted=true to autoplay without user interaction
        return `https://player.twitch.tv/?channel=${channelId}&${twitchParentParams}&muted=true&autoplay=true`;
        
      case Platform.YouTube:
        // YouTube needs mute=1
        return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&controls=1&playsinline=1&origin=${origin}`; 
        
      case Platform.Kick:
        // Kick player
        return `https://player.kick.com/${channelId}?autoplay=true&muted=true`;
        
      default:
        return '';
    }
  }, [channelId, currentPlatform, hostname, origin]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      
      {/* 1. VIDEO LAYER (Z-0) */}
      <div className="absolute inset-0 z-0">
         {channelId ? (
            <iframe
              key={`${currentPlatform}-${refreshKey}`} 
              src={embedUrl}
              title={`${streamer.name} - ${currentPlatform}`}
              className="w-full h-full border-none"
              style={{ pointerEvents: 'auto' }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; interactive-widget"
              // REMOVED SANDBOX ATTRIBUTE: This was blocking click events on players like Twitch/Kick
            />
         ) : (
           <div className="flex flex-col items-center justify-center w-full h-full text-white/10 select-none">
             <span className="text-4xl font-black uppercase tracking-widest">{streamer.name}</span>
             <span className="text-sm font-medium tracking-wider mt-2">Offline</span>
           </div>
         )}
      </div>

      {/* 2. HUD - BADGE (Top Left, Z-10) */}
      {/* pointer-events-none on container, auto on child to ensure transparent area isn't clickable */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className={`
          pointer-events-auto cursor-default select-none
          px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded shadow-lg backdrop-blur-md border border-white/5
          ${currentPlatform === Platform.Twitch ? 'bg-twitch text-white' : ''}
          ${currentPlatform === Platform.YouTube ? 'bg-youtube text-white' : ''}
          ${currentPlatform === Platform.Kick ? 'bg-kick text-black' : ''}
        `}>
          {currentPlatform}
        </div>
      </div>

      {/* 3. HUD - CONTROLS (Top Right, Z-10) */}
      {/* pointer-events-none on container ensures the gap between buttons doesn't block video */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 pointer-events-none">
            {/* Reload Button */}
            <button
                onClick={handleReload}
                className="pointer-events-auto w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
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
                    pointer-events-auto w-8 h-8 flex items-center justify-center rounded-full
                    transition-all duration-200 cursor-pointer
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

      {/* 4. SETTINGS OVERLAY (Z-20) */}
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