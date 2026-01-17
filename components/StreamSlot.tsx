import React, { useState, useMemo, useEffect } from 'react';
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
  const [isFileProtocol, setIsFileProtocol] = useState(false);

  // Robust Hostname Detection
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      setIsFileProtocol(true);
    }
  }, []);

  const rawChannelId = streamer.channels[currentPlatform];
  
  // Sanitize: Trim whitespace and force lowercase for Twitch/Kick (URLs are case insensitive usually, but APIs prefer lowercase)
  const channelId = rawChannelId ? rawChannelId.trim() : '';
  
  const hasValidChannel = Boolean(channelId && channelId.length > 0 && !channelId.includes('Inserir'));

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsIframeLoaded(false);
    setRefreshKey(prev => prev + 1);
  };

  const embedUrl = useMemo(() => {
    if (!hasValidChannel || !channelId) return '';

    // --- TWITCH PARENT LOGIC ---
    const parents = new Set<string>();
    
    // Add known production domains
    parents.add('viictornmultistream.vercel.app'); 
    
    // Add localhost variations for dev
    parents.add('localhost'); 
    parents.add('127.0.0.1'); 
    
    if (hostname) {
        parents.add(hostname);
        if (hostname.startsWith('www.')) {
            parents.add(hostname.replace('www.', ''));
        } else {
            parents.add(`www.${hostname}`);
        }
    }

    const parentQuery = Array.from(parents).map(p => `parent=${p}`).join('&');

    switch (currentPlatform) {
      case Platform.Twitch:
        // Force lowercase channel ID for Twitch
        return `https://player.twitch.tv/?channel=${channelId.toLowerCase()}&${parentQuery}&muted=true&autoplay=true`;
        
      case Platform.YouTube:
        // YouTube requires strict origin
        return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&controls=1&playsinline=1&origin=${origin}&enablejsapi=1`; 
        
      case Platform.Kick:
        // Kick Player
        return `https://player.kick.com/${channelId}?autoplay=true&muted=true`;
        
      default:
        return '';
    }
  }, [channelId, currentPlatform, hostname, origin, hasValidChannel]);

  // Link to open stream externally (Troubleshooting)
  const externalLink = useMemo(() => {
     if (!channelId) return '#';
     switch (currentPlatform) {
        case Platform.Twitch: return `https://twitch.tv/${channelId}`;
        case Platform.YouTube: return `https://youtube.com/channel/${channelId}/live`;
        case Platform.Kick: return `https://kick.com/${channelId}`;
        default: return '#';
     }
  }, [channelId, currentPlatform]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      
      {/* 1. IFRAME CONTAINER */}
      <div className="absolute inset-0 z-0 bg-black">
         {isFileProtocol ? (
             <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center text-red-400">
                <span className="font-bold uppercase tracking-widest mb-2">Erro de Protocolo</span>
                <p className="text-xs text-white/50 max-w-[250px]">
                    Players de streaming (Twitch/YouTube) não funcionam quando o arquivo é aberto diretamente (file://). 
                    <br/><br/>
                    Por favor, use um servidor local (Vite, Live Server, etc.) ou faça deploy.
                </p>
             </div>
         ) : hasValidChannel && embedUrl ? (
            <>
                {/* Loading Spinner */}
                {!isIframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-0 pointer-events-none">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-white/10 border-t-white/80 rounded-full animate-spin"></div>
                            <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase">
                                Carregando {currentPlatform}...
                            </span>
                        </div>
                    </div>
                )}

                <iframe
                    key={`${currentPlatform}-${refreshKey}`} 
                    src={embedUrl}
                    title={`${streamer.name} - ${currentPlatform}`}
                    className={`w-full h-full border-none transition-opacity duration-500 ${isIframeLoaded ? 'opacity-100' : 'opacity-0'}`}
                    referrerPolicy="strict-origin-when-cross-origin"
                    onLoad={() => setIsIframeLoaded(true)}
                    allowFullScreen
                    // Extremely permissive sandbox and allow attributes
                    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-storage-access-by-user-activation"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; speaker; microphone"
                />
            </>
         ) : (
           // OFFLINE / INVALID STATE
           <div className="flex flex-col items-center justify-center w-full h-full text-white/20 select-none p-4 text-center">
                <span className="text-3xl md:text-4xl font-black uppercase tracking-widest opacity-50">{streamer.name}</span>
                <span className="text-xs md:text-sm font-medium tracking-wider mt-3 opacity-40">
                    {channelId ? 'Canal Offline ou Erro' : 'ID não configurado'}
                </span>
                
                {channelId && (
                    <a 
                        href={externalLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 px-3 py-1 bg-white/5 hover:bg-white/10 text-[10px] uppercase tracking-wider rounded border border-white/5 transition-colors pointer-events-auto"
                    >
                        Testar Link Externo
                    </a>
                )}
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