import React, { useState, useEffect, useMemo } from 'react';
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
  const [hostname, setHostname] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
    }
  }, []);

  const channelId = streamer.channels[currentPlatform];

  const handlePlatformSelect = (p: Platform) => {
    onPlatformChange(p);
    setShowControls(false);
  };

  // Memoize the URL to prevent iframe reloading on minor parent re-renders
  const embedUrl = useMemo(() => {
    if (!channelId) return '';

    // Base allowed domains
    const domains = new Set([
      'localhost',
      'viictornmultistream.vercel.app',
      'www.viictornmultistream.vercel.app',
      '127.0.0.1'
    ]);
    
    // Add current hostname if valid
    if (hostname) {
      domains.add(hostname);
    }

    switch (currentPlatform) {
      case Platform.Twitch:
        const parentParams = Array.from(domains).map(d => `parent=${d}`).join('&');
        // muted=true is safer for autoplay. 
        // We use autoplay=true so it starts buffering immediately.
        return `https://player.twitch.tv/?channel=${channelId}&${parentParams}&muted=true&autoplay=true`;
        
      case Platform.YouTube:
        // YouTube requires 'live_stream' embed type for channel IDs
        return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1`; 

      case Platform.Kick:
        // Kick simple player
        return `https://player.kick.com/${channelId}?autoplay=true&muted=true`;
        
      default:
        return '';
    }
  }, [channelId, currentPlatform, hostname]);

  const availablePlatforms = Object.keys(streamer.channels).map(k => k as Platform);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      
      {/* 1. VIDEO LAYER */}
      <div className="absolute inset-0 z-0 bg-black">
         {channelId ? (
            <iframe
              src={embedUrl}
              title={`${streamer.name} - ${currentPlatform}`}
              className="w-full h-full border-none pointer-events-auto"
              // REMOVED SANDBOX: Essential for Desktop interaction (Click to Play).
              // Twitch and Kick scripts often fail silently inside any sandbox environment on PC browsers.
              referrerPolicy="origin"
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

      {/* 2. HUD ELEMENTS */}
      
      {/* Platform Badge - Non-interactive background, text is fine */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className={`
          pointer-events-auto
          px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded shadow-lg backdrop-blur-md border border-white/5
          ${currentPlatform === Platform.Twitch ? 'bg-twitch text-white' : ''}
          ${currentPlatform === Platform.YouTube ? 'bg-youtube text-white' : ''}
          ${currentPlatform === Platform.Kick ? 'bg-kick text-black' : ''}
        `}>
          {currentPlatform}
        </div>
      </div>

      {/* Settings Toggle */}
      <button
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowControls(prev => !prev);
        }}
        className={`
            absolute top-4 right-4 z-10
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

      {/* 3. SETTINGS OVERLAY */}
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