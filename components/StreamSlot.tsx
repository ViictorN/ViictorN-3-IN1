import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  isCinemaMode: boolean; 
  refreshKeyTrigger: number; 
  onHide: () => void; 
  isDragging: boolean; // Received from App to disable iframe interaction
}

const StreamSlot: React.FC<StreamSlotProps> = ({ 
  streamer, 
  currentPlatform, 
  onPlatformChange,
  isExpanded,
  onToggleExpand,
  isOtherExpanded,
  isCinemaMode,
  refreshKeyTrigger,
  onHide,
  isDragging
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isUserActive, setIsUserActive] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [localRefreshKey, setLocalRefreshKey] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const activityTimerRef = useRef<number | null>(null);

  // Combine global and local refresh keys
  const effectiveRefreshKey = refreshKeyTrigger + localRefreshKey;

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [currentPlatform, effectiveRefreshKey]);

  // Handle local activity (mouse movement inside the slot)
  useEffect(() => {
    const handleActivity = () => {
        setIsUserActive(true);
        if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
        activityTimerRef.current = setTimeout(() => {
            setIsUserActive(false);
            setShowSelector(false); // Also close selector on inactivity
        }, 5000);
    };

    const element = containerRef.current;
    if (element) {
        element.addEventListener('mousemove', handleActivity);
        element.addEventListener('click', handleActivity);
        element.addEventListener('touchstart', handleActivity);
    }

    return () => {
        if (element) {
            element.removeEventListener('mousemove', handleActivity);
            element.removeEventListener('click', handleActivity);
            element.removeEventListener('touchstart', handleActivity);
        }
        if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, []);

  const rawChannelId = streamer.channels[currentPlatform];
  const channelId = rawChannelId ? rawChannelId.trim() : '';
  const hasValidChannel = Boolean(channelId && channelId.length > 0);

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setLocalRefreshKey(prev => prev + 1);
  };

  const handlePopout = (e: React.MouseEvent) => {
      e.stopPropagation();
      let url = '';
      switch (currentPlatform) {
          case Platform.Twitch: url = `https://twitch.tv/${channelId}/popout`; break;
          case Platform.YouTube: 
            if (channelId.startsWith('UC')) {
                url = `https://youtube.com/channel/${channelId}/live`;
            } else {
                url = `https://youtube.com/watch?v=${channelId}`;
            }
            break;
          case Platform.Kick: url = `https://kick.com/${channelId}`; break;
      }
      if (url) window.open(url, '_blank', 'width=1280,height=720');
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
        // Check if it looks like a Channel ID (starts with UC) or a specific Video ID
        if (channelId.startsWith('UC')) {
            // Live stream via Channel ID
            return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&origin=${origin}`; 
        } else {
            // Specific Video ID
            return `https://www.youtube.com/embed/${channelId}?autoplay=1&mute=1&origin=${origin}`;
        }
      case Platform.Kick:
        return `https://player.kick.com/${channelId}?autoplay=true&muted=true`;
      default:
        return '';
    }
  }, [channelId, currentPlatform, hostname, hasValidChannel, origin]);

  const getBadgeStyle = () => {
    switch (currentPlatform) {
        case Platform.Twitch: return 'border-[#9146FF] text-[#d6baff] bg-[#9146FF]/10 shadow-[0_0_15px_rgba(145,70,255,0.2)]';
        case Platform.YouTube: return 'border-[#FF0000] text-[#ffbaba] bg-[#FF0000]/10 shadow-[0_0_15px_rgba(255,0,0,0.2)]';
        case Platform.Kick: return 'border-[#53FC18] text-[#caffb8] bg-[#53FC18]/10 shadow-[0_0_15px_rgba(83,252,24,0.2)] text-shadow-sm';
        default: return 'border-white/20 text-white bg-black/50';
    }
  };

  if (isOtherExpanded) return null;

  // Logic to show controls: Must be hovered AND user must be active (moved mouse recently)
  // EXCEPT if showSelector is open (keep it open while interacting)
  const showControls = (isHovered && isUserActive) || showSelector;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden group"
      onMouseEnter={() => { setIsHovered(true); setIsUserActive(true); }}
      onMouseLeave={() => { setIsHovered(false); setShowSelector(false); setHoveredAction(null); }}
    >
      {/* 1. IFRAME LAYER */}
      <div 
        className="absolute inset-0 z-0 bg-black"
        style={{ pointerEvents: isDragging ? 'none' : 'auto' }} // DISABLE POINTER EVENTS ON DRAG
      >
         {hasValidChannel && embedUrl ? (
            <>
                <iframe
                    key={`${currentPlatform}-${effectiveRefreshKey}`} 
                    src={embedUrl}
                    title={`${streamer.name} - ${currentPlatform}`}
                    className="w-full h-full border-none bg-black"
                    onLoad={() => setIsLoading(false)}
                    allowFullScreen
                    sandbox="allow-modals allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms allow-storage-access-by-user-activation"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; speaker; microphone"
                    referrerPolicy="strict-origin-when-cross-origin"
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
           </div>
         )}
      </div>

      {/* 2. STATUS LIGHT */}
      {(!isLoading && hasValidChannel && showControls && !isDragging) && (
         <div className="absolute top-4 right-4 z-10 pointer-events-none transition-opacity duration-500">
             <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.8)] animate-pulse" />
         </div>
      )}

      {/* 3. HUD LAYER */}
      <motion.div 
        initial={false}
        animate={{ opacity: ((isCinemaMode && !showControls) || isDragging || !showControls) ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
            background: (isCinemaMode && !showControls) ? 'transparent' : 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.4) 100%)'
        }}
      >
          {/* DRAG HANDLE (Top Left - Independent) */}
          <div 
            className={`absolute top-0 left-0 p-4 pointer-events-auto cursor-grab active:cursor-grabbing text-white/30 hover:text-white transition-colors duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            title="Arrastar para mover"
          >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20" />
              </svg>
          </div>

          {/* ACTIONS (Vertical Left - Centered) */}
          <div className={`absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-2 pointer-events-auto transition-all duration-500 z-30 ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              
              {/* Hide Button */}
              <div className="relative">
                  <AnimatePresence>
                    {hoveredAction === 'hide' && (
                        <motion.div
                            initial={{ opacity: 0, x: -10, scale: 0.9 }}
                            animate={{ opacity: 1, x: 10, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.9 }}
                            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-black/90 border border-white/10 rounded-md whitespace-nowrap z-[70] pointer-events-none"
                        >
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/90">Ocultar Player</span>
                        </motion.div>
                    )}
                  </AnimatePresence>
                  <button 
                    onClick={onHide} 
                    onMouseEnter={() => setHoveredAction('hide')}
                    onMouseLeave={() => setHoveredAction(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
              </div>

              {/* Popout Button */}
              <div className="relative">
                  <AnimatePresence>
                    {hoveredAction === 'popout' && (
                        <motion.div
                            initial={{ opacity: 0, x: -10, scale: 0.9 }}
                            animate={{ opacity: 1, x: 10, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.9 }}
                            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-black/90 border border-white/10 rounded-md whitespace-nowrap z-[70] pointer-events-none"
                        >
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/90">Pop-out</span>
                        </motion.div>
                    )}
                  </AnimatePresence>
                  <button 
                    onClick={handlePopout} 
                    onMouseEnter={() => setHoveredAction('popout')}
                    onMouseLeave={() => setHoveredAction(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                  </button>
              </div>

              {/* Reload Button */}
              <div className="relative">
                  <AnimatePresence>
                    {hoveredAction === 'reload' && (
                        <motion.div
                            initial={{ opacity: 0, x: -10, scale: 0.9 }}
                            animate={{ opacity: 1, x: 10, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.9 }}
                            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-black/90 border border-white/10 rounded-md whitespace-nowrap z-[70] pointer-events-none"
                        >
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/90">Recarregar</span>
                        </motion.div>
                    )}
                  </AnimatePresence>
                  <button 
                    onClick={handleReload} 
                    onMouseEnter={() => setHoveredAction('reload')}
                    onMouseLeave={() => setHoveredAction(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                  </button>
              </div>
              
              {/* Expand Button */}
              <div className="relative">
                    <AnimatePresence>
                    {hoveredAction === 'expand' && (
                        <motion.div
                            initial={{ opacity: 0, x: -10, scale: 0.9 }}
                            animate={{ opacity: 1, x: 10, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.9 }}
                            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-black/90 border border-white/10 rounded-md whitespace-nowrap z-[70] pointer-events-none"
                        >
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/90">{isExpanded ? 'Restaurar' : 'Expandir'}</span>
                        </motion.div>
                    )}
                    </AnimatePresence>
                    <button 
                    onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} 
                    onMouseEnter={() => setHoveredAction('expand')}
                    onMouseLeave={() => setHoveredAction(null)}
                    className={`
                        w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md border transition-colors
                        ${isExpanded 
                            ? 'bg-white text-black border-white hover:bg-white/90' 
                            : 'bg-black/60 border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
                        }
                    `}
                    >
                    {isExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                    )}
                    </button>
              </div>
          </div>

          {/* BOTTOM CENTER: Badge & Selector Container */}
          <div className="absolute bottom-4 left-0 w-full flex justify-center">
              <div className={`relative pointer-events-auto transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  {/* Dropdown Menu (Opens Upwards now) */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                    <PlatformSelector 
                      isOpen={showSelector}
                      currentPlatform={currentPlatform}
                      availablePlatforms={Object.keys(streamer.channels).map(k => k as Platform)}
                      onSelect={(p) => { onPlatformChange(p); setShowSelector(false); setIsLoading(true); setLocalRefreshKey(prev => prev + 1); }}
                    />
                  </div>

                  {/* Trigger Button */}
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
              </div>
          </div>
      </motion.div>
    </div>
  );
};

export default StreamSlot;