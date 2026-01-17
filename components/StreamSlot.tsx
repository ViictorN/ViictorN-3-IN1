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
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  // Robust Hostname Detection
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const channelId = streamer.channels[currentPlatform];
  const hasValidChannel = Boolean(channelId && channelId.trim().length > 0 && !channelId.includes('Inserir'));

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsIframeLoaded(false);
    setRefreshKey(prev => prev + 1);
  };

  const embedUrl = useMemo(() => {
    if (!hasValidChannel || !channelId) return '';

    // --- TWITCH PARENT LOGIC ---
    // Twitch requires 'parent' to match the domain where the iframe is embedded.
    // We construct a list of all potential environments.
    const parents = new Set<string>();
    
    parents.add('viictornmultistream.vercel.app'); // Production
    parents.add('localhost'); // Local Dev
    parents.add('127.0.0.1'); // Local Dev IP
    
    if (hostname) {
        parents.add(hostname);
        // Handle www variations
        if (hostname.startsWith('www.')) {
            parents.add(hostname.replace('www.', ''));
        } else {
            parents.add(`www.${hostname}`);
        }
    }

    const parentQuery = Array.from(parents).map(p => `parent=${p}`).join('&');

    switch (currentPlatform) {
      case Platform.Twitch:
        return `https://player.twitch.tv/?channel=${channelId}&${parentQuery}&muted=true&autoplay=true`;
        
      case Platform.YouTube:
        // 'origin' parameter helps with CORS policies on YouTube embeds
        return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&controls=1&playsinline=1&origin=${origin}`; 
        
      case Platform.Kick:
        return `https://player.kick.com/${channelId}?autoplay=true&muted=true`;
        
      default:
        return '';
    }
  }, [channelId, currentPlatform, hostname, origin, hasValidChannel]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      
      {/* 1. IFRAME CONTAINER */}
      <div className="absolute inset-0 z-0 bg-black">
         {hasValidChannel && embedUrl ? (
            <>
                {/* Loading Spinner - Disappears when iframe loads */}
                {!isIframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-0">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-white/10 border-t-white/80 rounded-full animate-spin"></div>
                            <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase">Conectando {currentPlatform}...</span>
                        </div>
                    </div>
                )}

                <iframe
                    key={`${currentPlatform}-${refreshKey}`} 
                    src={embedUrl}
                    title={`${streamer.name} - ${currentPlatform}`}
                    className={`w-full h-full border-none transition-opacity duration-500 ${isIframeLoaded ? 'opacity-100' : 'opacity-0'}`}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    onLoad={() => setIsIframeLoaded(true)}
                />
            </>
         ) : (
           // OFFLINE / INVALID STATE
           <div className="flex flex-col items-center justify-center w-full h-full text-white/20 select-none p-4 text-center">
                <span className="text-3xl md:text-4xl font-black uppercase tracking-widest opacity-50">{streamer.name}</span>
                <span className="text-xs md:text-sm font-medium tracking-wider mt-3 opacity-40">
                    {channelId ? 'Carregando...' : 'Canal Offline / Não Configurado'}
                </span>
                {/* Debug Info for User */}
                <div className="mt-4 text-[9px] font-mono opacity-30">
                    {currentPlatform} • {channelId || 'No ID'}
                </div>
           </div>
         )}
      </div>

      {/* 2. HUD LAYER */}
      <div className="absolute inset-0 z-10 pointer-events-none p-4 flex flex-col justify-between">
          
          {/* Top Row */}
          <div className="flex justify-between items-start w-full">
              {/* Badge */}
              <div className={`
                pointer-events-auto cursor-default select-none shadow-xl
                px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md backdrop-blur-md border border-white/10
                ${currentPlatform === Platform.Twitch ? 'bg-[#9146FF] text-white' : ''}
                ${currentPlatform === Platform.YouTube ? 'bg-[#FF0000] text-white' : ''}
                ${currentPlatform === Platform.Kick ? 'bg-[#53FC18] text-black' : ''}
              `}>
                {currentPlatform}
              </div>

              {/* Controls */}
              <div className="flex gap-2 pointer-events-auto">
                  <button
                      onClick={handleReload}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                      title="Recarregar Player"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                  </button>

                  <button
                      onClick={(e) => {
                          e.stopPropagation();
                          setShowControls(true);
                      }}
                      className={`
                          w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200
                          bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:bg-white/10 hover:text-white
                      `}
                      title="Configurar Streamer"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
              </div>
          </div>
      </div>

      {/* 3. CONTROLS OVERLAY (Modal) */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 flex flex-col justify-end"
          >
             {/* Backdrop Click to Close */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
                onClick={() => setShowControls(false)}
            />

            {/* Content */}
            <div className="relative p-6 flex flex-col items-center justify-end z-50 pointer-events-none h-full pb-10">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-black uppercase tracking-tighter text-white mb-6 drop-shadow-2xl select-none text-center"
              >
                {streamer.name}
              </motion.h2>

              <div className="pointer-events-auto shadow-2xl">
                <PlatformSelector 
                  isOpen={true}
                  currentPlatform={currentPlatform}
                  availablePlatforms={Object.keys(streamer.channels).map(k => k as Platform)}
                  onSelect={(p) => {
                      onPlatformChange(p);
                      setShowControls(false);
                      setIsIframeLoaded(false);
                      setRefreshKey(prev => prev + 1);
                  }}
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