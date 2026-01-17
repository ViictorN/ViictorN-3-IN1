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
  
  // Get hostname safely for SSR
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

    const domains = new Set<string>();
    domains.add('viictornmultistream.vercel.app'); // Production Domain
    
    if (hostname) {
        domains.add(hostname);
        // Robust logic for subdomains (e.g. www.)
        const parts = hostname.split('.');
        if (parts.length > 2) {
             domains.add(parts.slice(1).join('.')); 
        }
    }

    const twitchParentParams = Array.from(domains)
        .map(d => `parent=${d}`)
        .join('&');

    switch (currentPlatform) {
      case Platform.Twitch:
        return `https://player.twitch.tv/?channel=${channelId}&${twitchParentParams}&muted=true&autoplay=true`;
        
      case Platform.YouTube:
        // Origin is crucial for YouTube API interaction
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&controls=1&playsinline=1&origin=${origin}`; 
        
      case Platform.Kick:
        return `https://player.kick.com/${channelId}?autoplay=true&muted=true`;
        
      default:
        return '';
    }
  }, [channelId, currentPlatform, hostname]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      
      {/* 1. IFRAME LAYER - BASE (Z-0) */}
      {/* Absolute positioning ensures it fills the parent exactly. */}
      {channelId ? (
        <iframe
            key={`${currentPlatform}-${refreshKey}`} 
            src={embedUrl}
            title={`${streamer.name} - ${currentPlatform}`}
            className="absolute inset-0 w-full h-full border-none z-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; interactive-widget"
            // IMPORTANT: No sandbox attribute ensures full interactivity for Twitch/Kick players
        />
      ) : (
        <div className="absolute inset-0 w-full h-full z-0 flex flex-col items-center justify-center text-white/10 select-none">
            <span className="text-4xl font-black uppercase tracking-widest">{streamer.name}</span>
            <span className="text-sm font-medium tracking-wider mt-2">Offline</span>
        </div>
      )}

      {/* 2. HUD LAYER - OVERLAY (Z-10) */}
      {/* 
          CRITICAL FIX: 
          pointer-events-none on this container means clicks PASS THROUGH to the video.
          We only re-enable pointer-events-auto on the specific buttons inside.
      */}
      <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col justify-between">
          
          {/* Top Bar */}
          <div className="flex justify-between items-start">
              
              {/* Badge - Not clickable, just visual */}
              <div className={`
                pointer-events-auto cursor-default select-none
                px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded shadow-lg backdrop-blur-md border border-white/5
                ${currentPlatform === Platform.Twitch ? 'bg-twitch text-white' : ''}
                ${currentPlatform === Platform.YouTube ? 'bg-youtube text-white' : ''}
                ${currentPlatform === Platform.Kick ? 'bg-kick text-black' : ''}
              `}>
                {currentPlatform}
              </div>

              {/* Controls Group - Re-enable clicks here */}
              <div className="flex gap-2 pointer-events-auto">
                  {/* Reload Button */}
                  <button
                      onClick={handleReload}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                      title="Recarregar Player"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                  </button>

                  {/* Settings Button */}
                  <button
                      onClick={(e) => {
                          e.stopPropagation();
                          setShowControls(true);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                      title="Trocar Plataforma"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
              </div>
          </div>
      </div>

      {/* 3. SETTINGS OVERLAY - MODAL (Z-50) */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 flex flex-col justify-end"
          >
             {/* Backdrop - Click to close */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
                onClick={() => setShowControls(false)}
            />

            {/* Menu Content */}
            <div className="relative p-6 flex flex-col items-center justify-center h-full pointer-events-none">
              <div className="pointer-events-auto flex flex-col items-center">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6 drop-shadow-2xl select-none">
                    {streamer.name}
                  </h2>
                  <PlatformSelector 
                    isOpen={true}
                    currentPlatform={currentPlatform}
                    availablePlatforms={Object.keys(streamer.channels).map(k => k as Platform)}
                    onSelect={handlePlatformSelect}
                  />
                  
                   {/* Explicit Close Button */}
                   <button 
                    onClick={() => setShowControls(false)}
                    className="mt-8 p-2 text-white/30 hover:text-white transition-colors rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreamSlot;