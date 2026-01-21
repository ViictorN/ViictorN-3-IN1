import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamerConfig, Platform } from '../types';
import { STREAMERS, TwitchIcon, YouTubeIcon, KickIcon, CUSTOM_MERGED_CHAT_URL } from '../constants';

interface MultiChatProps {
  activeStreamers: { [key: string]: Platform };
  isOpen: boolean;
  onClose: () => void;
  width: number;
  onResize: (newWidth: number) => void;
  disableResize?: boolean; // New prop to lock width
}

const MultiChat: React.FC<MultiChatProps> = ({ activeStreamers, isOpen, onClose, width, onResize, disableResize = false }) => {
  const [selectedStreamerId, setSelectedStreamerId] = useState<string>('all');
  const [isResizing, setIsResizing] = useState(false);
  
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  // Resize Handlers
  const startResizing = useCallback(() => {
    if (disableResize) return;
    setIsResizing(true);
  }, [disableResize]);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing && !disableResize) {
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        // Clamp width between 300px and 800px
        if (newWidth > 300 && newWidth < 800) {
            onResize(newWidth);
        }
    }
  }, [isResizing, disableResize, onResize]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);


  const getChatUrl = (streamer: StreamerConfig, platform: Platform) => {
    const parents = new Set<string>();
    
    parents.add('viictornmultistream.vercel.app');
    parents.add('www.viictornmultistream.vercel.app');

    if (hostname) {
        parents.add(hostname);
        if (hostname.startsWith('www.')) {
            parents.add(hostname.replace('www.', ''));
        } else {
            parents.add(`www.${hostname}`);
        }
    }
    parents.add('localhost');
    parents.add('127.0.0.1');

    const parentParams = Array.from(parents).map(d => `parent=${d}`).join('&');
    const channelId = streamer.channels[platform];
    if (!channelId) return 'about:blank';

    switch (platform) {
      case Platform.Twitch:
        return `https://www.twitch.tv/embed/${channelId}/chat?${parentParams}&darkpopout`;
      case Platform.YouTube:
        return ''; 
      case Platform.Kick:
        return `https://kick.com/${channelId}/chatroom`;
      default:
        return '';
    }
  };

  const ChatIcon = ({ platform }: { platform: Platform }) => {
    switch(platform) {
      case Platform.Twitch: return <TwitchIcon className="w-3 h-3" />;
      case Platform.YouTube: return <YouTubeIcon className="w-3 h-3" />;
      case Platform.Kick: return <KickIcon className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
            {/* Resizing Overlay (to prevent iframe interaction while dragging) */}
            {isResizing && <div className="fixed inset-0 z-[100] cursor-col-resize" />}
            
            <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ width: width }}
            className="fixed inset-y-0 right-0 h-full bg-[#090909] border-l border-white/10 z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
            {/* DRAG HANDLE */}
            {!disableResize && (
                <div 
                    onMouseDown={startResizing}
                    className="absolute left-0 top-0 bottom-0 w-2 -ml-1 cursor-col-resize hover:bg-white/10 transition-colors z-50 group flex items-center justify-center"
                    title="Arrastar para ajustar o tamanho"
                >
                    {/* Visual indicator for drag handle */}
                    <div className="h-12 w-[3px] bg-white/10 group-hover:bg-blue-500 rounded-full transition-colors shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                </div>
            )}

            {/* HEADER AREA */}
            <div className="flex flex-none h-14 bg-black border-b border-white/5 relative">
                
                {/* Scrollable Tabs Container */}
                <div className="flex-1 flex items-end px-2 gap-1 overflow-x-auto no-scrollbar pr-12">
                    {/* MIX TAB */}
                    <button
                        onClick={() => setSelectedStreamerId('all')}
                        className={`
                            relative group flex flex-col items-center justify-center px-3 h-10 rounded-t-lg transition-all duration-300 flex-shrink-0
                            ${selectedStreamerId === 'all' ? 'text-white' : 'text-neutral-600 hover:text-neutral-300'}
                        `}
                    >
                        <span className={`text-[11px] font-black uppercase tracking-widest z-10 transition-all ${selectedStreamerId === 'all' ? 'scale-105' : ''}`}>MIX</span>
                        
                        {selectedStreamerId === 'all' && (
                            <>
                                <motion.div 
                                    layoutId="activeTabBg"
                                    className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rounded-t-lg"
                                    transition={{ duration: 0.2 }}
                                />
                                <motion.div 
                                    layoutId="activeTabLine"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                                />
                            </>
                        )}
                    </button>

                    <div className="w-[1px] h-4 mb-3 bg-white/10 mx-1 flex-shrink-0" />

                    {/* INDIVIDUAL TABS */}
                    {STREAMERS.map((streamer) => {
                        const isActive = selectedStreamerId === streamer.id;
                        const streamerPlatform = activeStreamers[streamer.id];
                        
                        return (
                            <button
                                key={streamer.id}
                                onClick={() => setSelectedStreamerId(streamer.id)}
                                className={`
                                    relative group flex items-center justify-center gap-2 px-3 h-10 rounded-t-lg transition-all duration-300 flex-shrink-0 min-w-[90px]
                                    ${isActive ? 'text-white' : 'text-neutral-600 hover:text-neutral-300'}
                                `}
                            >
                                <span className="text-[10px] font-bold uppercase truncate max-w-[80px] z-10">{streamer.name}</span>
                                
                                <div className={`transition-opacity duration-300 z-10 ${isActive ? 'opacity-100 text-white' : 'opacity-0 -translate-y-2'}`}>
                                    <ChatIcon platform={streamerPlatform} />
                                </div>
                                
                                {isActive && (
                                    <>
                                        <motion.div 
                                            layoutId="activeTabBg"
                                            className="absolute inset-0 rounded-t-lg opacity-20"
                                            style={{ background: `linear-gradient(to top, ${streamer.color}, transparent)` }}
                                        />
                                        <motion.div 
                                            layoutId="activeTabLine"
                                            className="absolute bottom-0 left-0 right-0 h-[2px]"
                                            style={{ 
                                                backgroundColor: streamer.color,
                                                boxShadow: `0 0 15px ${streamer.color}` 
                                            }}
                                        />
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* NEW CLOSE BUTTON (Fixed Right) - Updated Appearance */}
                <div className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gradient-to-l from-black via-black to-transparent z-20">
                    <button 
                        onClick={onClose} 
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all duration-200 shadow-sm"
                        title="Fechar Chat"
                    >
                         {/* Collapse Right Icon (Double Chevron or Arrow) */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m13 17 5-5-5-5"/>
                            <path d="m6 17 5-5-5-5"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 relative bg-[#090909] flex flex-col overflow-hidden">
                
                {/* MIX VIEW */}
                <div 
                    className="w-full h-full flex flex-col"
                    style={{ display: selectedStreamerId === 'all' ? 'flex' : 'none' }}
                >
                    {CUSTOM_MERGED_CHAT_URL ? (
                        <iframe src={CUSTOM_MERGED_CHAT_URL} className="w-full h-full border-none" title="Unified Chat" loading="lazy" />
                    ) : (
                        STREAMERS.map((streamer) => {
                        const platform = activeStreamers[streamer.id] || Platform.Twitch;
                        const url = getChatUrl(streamer, platform);
                        return (
                            <div key={`mix-${streamer.id}`} className="flex-1 relative w-full min-h-0 border-b border-white/5 last:border-0 overflow-hidden group">
                                <div className="absolute top-1 right-2 z-10 text-[9px] font-bold uppercase text-white/20 group-hover:text-white/50 pointer-events-none transition-colors">
                                    {streamer.name}
                                </div>
                            {platform === Platform.YouTube ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F0F0F]">
                                    <span className="text-[9px] font-bold text-neutral-600 uppercase mb-2">Chat do YouTube (Pop-out necessário)</span>
                                    <a href={streamer.channels[Platform.YouTube]?.startsWith('UC') ? `https://youtube.com/channel/${streamer.channels[Platform.YouTube]}` : `https://youtube.com/watch?v=${streamer.channels[Platform.YouTube]}`} target="_blank" rel="noreferrer" className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[9px] text-neutral-400 uppercase rounded transition">Abrir</a>
                                </div>
                            ) : (
                                <iframe src={url} className="w-full h-full border-none block" title={`${streamer.name} Chat Mix`} loading="lazy" />
                            )}
                            </div>
                        );
                        })
                    )}
                </div>

                {/* INDIVIDUAL VIEWS */}
                {STREAMERS.map((streamer) => {
                    const platform = activeStreamers[streamer.id] || Platform.Twitch;
                    const url = getChatUrl(streamer, platform);
                    const isVisible = selectedStreamerId === streamer.id;

                    return (
                        <div 
                            key={`tab-${streamer.id}`}
                            className="w-full h-full bg-[#090909]"
                            style={{ display: isVisible ? 'block' : 'none' }}
                        >
                            {platform === Platform.YouTube ? (
                                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500 bg-[#0F0F0F]">
                                    <YouTubeIcon className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-xs mb-4">O YouTube não permite incorporar o chat diretamente.</p>
                                    <a href={streamer.channels[Platform.YouTube]?.startsWith('UC') ? `https://youtube.com/channel/${streamer.channels[Platform.YouTube]}` : `https://youtube.com/watch?v=${streamer.channels[Platform.YouTube]}`} target="_blank" rel="noreferrer" className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase rounded transition">Abrir Chat Externo</a>
                                </div>
                            ) : (
                                <iframe src={url} className="w-full h-full border-none" title={`${streamer.name} Chat Tab`} />
                            )}
                        </div>
                    );
                })}
            </div>
            </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MultiChat;