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
  const [refreshKey, setRefreshKey] = useState(0); 
  const [hostname, setHostname] = useState<string>('');

  // Hydration fix: Get hostname only on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
    }
  }, []);

  const channelId = streamer.channels[currentPlatform];
  const hasValidChannel = Boolean(channelId && channelId.trim().length > 0 && !channelId.includes('Inserir'));

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshKey(prev => prev + 1);
  };

  const embedUrl = useMemo(() => {
    if (!hasValidChannel || !channelId) return '';

    // TWITCH PARENT LOGIC
    // Must include the current domain AND common deployment domains
    const parents = new Set<string>();
    if (hostname) parents.add(hostname);
    parents.add('viictornmultistream.vercel.app');
    parents.add('localhost');
    parents.add('127.0.0.1');

    const parentQuery = Array.from(parents).map(p => `parent=${p}`).join('&');

    switch (currentPlatform) {
      case Platform.Twitch:
        // muted=true is essential for autoplay
        return `https://player.twitch.tv/?channel=${channelId}&${parentQuery}&muted=true&autoplay=true`;
        
      case Platform.YouTube:
        // YouTube Live Embed
        // Note: This requires the channel to be actively streaming.
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&controls=1&playsinline=1&origin=${origin}`; 
        
      case Platform.Kick:
        // Kick Player
        return `https://player.kick.com/${channelId}?autoplay=true&muted=true`;
        
      default:
        return '';
    }
  }, [channelId, currentPlatform, hostname, hasValidChannel]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      
      {/* 1. IFRAME CONTAINER (Interaction Allowed) */}
      <div className="absolute inset-0 z-0 bg-black">
         {hasValidChannel && embedUrl ? (
            <iframe
              key={`${currentPlatform}-${refreshKey}`} 
              src={embedUrl}
              title={`${streamer.name} - ${currentPlatform}`}
              className="w-full h-full border-none"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              // Sandbox attribute removed: It often blocks third-party player scripts (especially Twitch/Kick)
              // referrerPolicy removed: Let browser handle defaults for best compatibility
            />
         ) : (
           // OFFLINE / INVALID STATE
           <div className="flex flex-col items-center justify-center w-full h-full text-white/20 select-none p-4 text-center">
                <span className="text-3xl md:text-4xl font-black uppercase tracking-widest opacity-50">{streamer.name}</span>
                <span className="text-xs md:text-sm font-medium tracking-wider mt-3 opacity-40">
                    {channelId ? 'Carregando Player...' : 'ID não configurado'}
                </span>
                {!channelId && (
                  <div className="mt-2 text-[10px] text-red-500 bg-red-500/10 px-2 py-1 rounded">
                     {currentPlatform}
                  </div>
                )}
           </div>
         )}
      </div>

      {/* 2. HUD LAYER (Passthrough clicks) */}
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
                      title="Recarregar"
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
                      title="Configurar"
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