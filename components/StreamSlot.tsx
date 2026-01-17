import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamerConfig, Platform } from '../types';
import PlatformSelector from './PlatformSelector';

interface StreamSlotProps {
  streamer: StreamerConfig;
  currentPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isOtherExpanded: boolean;
}

const StreamSlot: React.FC<StreamSlotProps> = ({ 
  streamer, 
  currentPlatform, 
  onPlatformChange,
  isExpanded,
  onToggleExpand,
  isOtherExpanded
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [currentPlatform, refreshKey]);

  const rawChannelId = streamer.channels[currentPlatform];
  const channelId = rawChannelId ? rawChannelId.trim() : '';
  const hasValidChannel = Boolean(channelId && channelId.length > 0);

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  const embedUrl = useMemo(() => {
    if (!hasValidChannel || !channelId) return '';
    const parents = new Set<string>();
    parents.add('viictornmultistream.vercel.app');
    parents.add('www.viictornmultistream.vercel.app');
    if (hostname) {
        parents.add(hostname);
        if (hostname.startsWith('www.')) parents.add(hostname.replace('www.', ''));
        else parents.add(`www.${hostname}`);
    }
    parents.add('localhost');
    parents.add('127.0.0.1');

    const parentQuery = Array.from(parents).map(p => `parent=${p}`).join('&');

    switch (currentPlatform) {
      case Platform.Twitch:
        return `https://player.twitch.tv/?channel=${channelId.toLowerCase()}&${parentQuery}&muted=true&autoplay=true`;
      case Platform.YouTube:
        return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&playsinline=1&enablejsapi=1`; 
      case Platform.Kick:
        return `https://player.kick.com/${channelId}?autoplay=true&muted=true`;
      default:
        return '';
    }
  }, [channelId, currentPlatform, hostname, hasValidChannel]);

  const externalLink = useMemo(() => {
     if (!channelId) return '#';
     switch (currentPlatform) {
        case Platform.Twitch: return `https://twitch.tv/${channelId}`;
        case Platform.YouTube: return `https://youtube.com/channel/${channelId}/live`;
        case Platform.Kick: return `https://kick.com/${channelId}`;
        default: return '#';
     }
  }, [channelId, currentPlatform]);

  const getBadgeStyle = () => {
    switch (currentPlatform) {
        case Platform.Twitch: return 'border-[#9146FF] text-[#d6baff] bg-[#9146FF]/10 shadow-[0_0_15px_rgba(145,70,255,0.2)]';
        case Platform.YouTube: return 'border-[#FF0000] text-[#ffbaba] bg-[#FF0000]/10 shadow-[0_0_15px_rgba(255,0,0,0.2)]';
        case Platform.Kick: return 'border-[#53FC18] text-[#caffb8] bg-[#53FC18]/10 shadow-[0_0_15px_rgba(83,252,24,0.2)] text-shadow-sm';
        default: return 'border-white/20 text-white bg-black/50';
    }
  };

  if (isOtherExpanded) return null;

  return (
    <div 
      className="relative w-full h-full bg-black overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowSelector(false); }}
    >
      {/* 1. IFRAME LAYER */}
      <div className="absolute inset-0 z-0 bg-black">
         {hasValidChannel && embedUrl ? (
            <>
                <iframe
                    key={`${currentPlatform}-${refreshKey}`} 
                    src={embedUrl}
                    title={`${streamer.name} - ${currentPlatform}`}
                    className="w-full h-full border-none bg-black"
                    onLoad={() => setIsLoading(false)}
                    allowFullScreen
                    sandbox="allow-modals allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms allow-storage-access-by-user-activation"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; speaker; microphone"
                    referrerPolicy="no-referrer-when-downgrade"
                />
                <AnimatePresence>
                  {isLoading && (
                      <motion.div 
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-xl z-10 pointer-events-none"
                      >
                          <div className="flex flex-col items-center gap-4">
                              <div className="relative">
                                  <div className="w-12 h-12 border-4 border-white/5 rounded-full"></div>
                                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-t-white rounded-full animate-spin shadow-[0_0_20px_rgba(255,255,255,0.5)]"></div>
                              </div>
                              <span className="text-[10px] text-white/60 font-black tracking-[0.3em] uppercase animate-pulse">
                                  Carregando
                              </span>
                          </div>
                      </motion.div>
                  )}
                </AnimatePresence>
            </>
         ) : (
           <div className="flex flex-col items-center justify-center w-full h-full text-white/20 select-none p-4 text-center bg-neutral-950">
                <span className="text-3xl md:text-5xl font-black uppercase tracking-widest opacity-30">{streamer.name}</span>
                <span className="text-xs md:text-sm font-medium tracking-wider mt-3 opacity-40">
                    {channelId ? 'Canal Offline' : 'ID não configurado'}
                </span>
                {channelId && (
                    <a href={externalLink} target="_blank" rel="noopener noreferrer" className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 text-xs uppercase tracking-wider rounded-lg border border-white/5 transition-colors pointer-events-auto hover:border-white/20">
                        Abrir Externamente
                    </a>
                )}
           </div>
         )}
      </div>

      {/* 2. PERSISTENT INDICATOR */}
      {(!isHovered && !showSelector && hasValidChannel && !isLoading) && (
         <div className="absolute top-4 right-4 z-10 pointer-events-none">
             <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.8)] animate-pulse" />
         </div>
      )}

      {/* 3. HUD LAYER */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: (isHovered || showSelector || isLoading) ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-20 pointer-events-none p-4 flex flex-col justify-between bg-gradient-to-b from-black/60 via-transparent to-black/60"
      >
          {/* Top Bar */}
          <div className="relative flex justify-between items-start w-full pointer-events-auto">
              {/* Badge & Selector Container */}
              <div className="relative">
                  <div 
                    onClick={(e) => { e.stopPropagation(); setShowSelector(!showSelector); }}
                    className={`
                      cursor-pointer select-none
                      flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border
                      transition-all duration-300 hover:scale-105 active:scale-95
                      ${getBadgeStyle()}
                    `}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${currentPlatform === Platform.Kick ? 'bg-[#53FC18]' : 'bg-current'} animate-pulse`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none pt-[1px]">
                        {currentPlatform}
                    </span>
                    <svg className={`w-3 h-3 transition-transform ${showSelector ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-0 mt-2 z-50">
                    <PlatformSelector 
                      isOpen={showSelector}
                      currentPlatform={currentPlatform}
                      availablePlatforms={Object.keys(streamer.channels).map(k => k as Platform)}
                      onSelect={(p) => { onPlatformChange(p); setShowSelector(false); setIsLoading(true); setRefreshKey(prev => prev + 1); }}
                    />
                  </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} 
                    className={`
                        w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md border transition-colors
                        ${isExpanded 
                            ? 'bg-white text-black border-white hover:bg-white/90' 
                            : 'bg-black/40 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                        }
                    `}
                    title={isExpanded ? "Restaurar" : "Expandir"}
                  >
                     {isExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
                     ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                     )}
                  </button>

                  <button onClick={handleReload} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors" title="Recarregar Player">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                  </button>
              </div>
          </div>
      </motion.div>
    </div>
  );
};

export default StreamSlot;