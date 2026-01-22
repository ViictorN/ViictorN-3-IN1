import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // State to store chat platform overrides (independent of video platform)
  const [chatOverrides, setChatOverrides] = useState<Record<string, Platform>>({});
  
  // State for the mini dropdown selector
  const [openSelectorId, setOpenSelectorId] = useState<string | null>(null);
  const [selectorPos, setSelectorPos] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      setOpenSelectorId(null);
    };
    
    const handleResize = () => setOpenSelectorId(null);

    if (openSelectorId) {
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleResize);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', handleResize);
    };
  }, [openSelectorId]);

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

  // Helper to determine which platform to show for chat
  const getChatPlatform = (streamerId: string) => {
      // Return override if exists, otherwise active video platform, otherwise default
      return chatOverrides[streamerId] || activeStreamers[streamerId] || Platform.Twitch;
  };

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

  const ChatIcon = ({ platform, className }: { platform: Platform; className?: string }) => {
    switch(platform) {
      case Platform.Twitch: return <TwitchIcon className={className || "w-3 h-3"} />;
      case Platform.YouTube: return <YouTubeIcon className={className || "w-3 h-3"} />;
      case Platform.Kick: return <KickIcon className={className || "w-3 h-3"} />;
      default: return null;
    }
  };

  const getPlatformColor = (p: Platform) => {
      switch(p) {
          case Platform.Twitch: return '#9146FF';
          case Platform.YouTube: return '#FF0000';
          case Platform.Kick: return '#53FC18';
          default: return '#ffffff';
      }
  };

  // Find the streamer object for the currently open dropdown
  const activeDropdownStreamer = STREAMERS.find(s => s.id === openSelectorId);

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

            {/* HEADER AREA - LIQUID GLASS EFFECT */}
            <div className="flex flex-none h-14 relative z-20 overflow-hidden items-center">
                {/* Liquid Glass Background */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.2)]"></div>

                {/* Scrollable Tabs Container - Added pr-14 to avoid overlap with close button */}
                <div className="relative flex-1 flex items-end px-2 gap-1 overflow-x-auto no-scrollbar pr-14 h-full pb-0">
                    {/* MIX TAB */}
                    <button
                        onClick={() => setSelectedStreamerId('all')}
                        className={`
                            relative group flex flex-col items-center justify-center px-3 h-10 rounded-t-lg transition-all duration-300 flex-shrink-0
                            ${selectedStreamerId === 'all' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}
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
                        const currentChatPlatform = getChatPlatform(streamer.id);
                        const isSelectorOpen = openSelectorId === streamer.id;
                        
                        return (
                            <div key={streamer.id} className="relative flex-shrink-0">
                                <button
                                    onClick={() => setSelectedStreamerId(streamer.id)}
                                    className={`
                                        relative group flex items-center justify-center gap-2 px-3 h-10 rounded-t-lg transition-all duration-300 min-w-[90px]
                                        ${isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}
                                    `}
                                >
                                    <span className="text-[10px] font-bold uppercase truncate max-w-[80px] z-10">{streamer.name}</span>
                                    
                                    {/* Platform Icon / Selector Trigger */}
                                    <div 
                                        className={`
                                            relative z-10 flex items-center gap-1 transition-all duration-300 
                                            ${isActive ? 'opacity-100 text-white pl-1 border-l border-white/10' : 'opacity-0 -translate-y-2 w-0 overflow-hidden'}
                                        `}
                                        onClick={(e) => {
                                            if (isActive) {
                                                e.stopPropagation();
                                                if (isSelectorOpen) {
                                                    setOpenSelectorId(null);
                                                } else {
                                                    // Calculate Fixed Position for Dropdown
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setSelectorPos({ top: rect.bottom + 8, left: rect.left });
                                                    setOpenSelectorId(streamer.id);
                                                }
                                            }
                                        }}
                                    >
                                        <div className={`transition-colors hover:text-white ${isSelectorOpen ? 'text-white' : 'text-neutral-400'}`}>
                                            <ChatIcon platform={currentChatPlatform} className="w-3 h-3" />
                                        </div>
                                        <svg 
                                            width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" 
                                            className={`transition-transform duration-200 ${isSelectorOpen ? 'rotate-180' : ''} opacity-50`}
                                        >
                                            <path d="M6 9l6 6 6-6"/>
                                        </svg>
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
                            </div>
                        );
                    })}
                </div>

                {/* NEW CLOSE BUTTON (Floating Glass Circle) */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30">
                    <button 
                        onClick={onClose} 
                        className="group w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all duration-200 backdrop-blur-md shadow-lg"
                        title="Fechar Chat"
                    >
                        <svg 
                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className="group-hover:scale-110 transition-transform duration-200 group-hover:text-lime-400"
                        >
                            <path d="M13 5l7 7-7 7"/>
                            <path d="M6 5l7 7-7 7"/>
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
                        // Use the chat platform (override or active)
                        const platform = getChatPlatform(streamer.id);
                        const url = getChatUrl(streamer, platform);
                        
                        return (
                            <div key={`mix-${streamer.id}`} className="flex-1 relative w-full min-h-0 border-b border-white/5 last:border-0 overflow-hidden group">
                                <div className="absolute top-1 right-2 z-10 flex items-center gap-1.5 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                                    <ChatIcon platform={platform} className="w-2.5 h-2.5 text-white" />
                                    <span className="text-[9px] font-bold uppercase text-white shadow-black drop-shadow-md">
                                        {streamer.name}
                                    </span>
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
                    // Use the chat platform (override or active)
                    const platform = getChatPlatform(streamer.id);
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

            {/* FIXED POSITION DROPDOWN OVERLAY - RENDERED OUTSIDE SCROLL CONTEXT */}
            <AnimatePresence>
                {activeDropdownStreamer && selectorPos && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        style={{ 
                            position: 'fixed', 
                            top: selectorPos.top, 
                            left: selectorPos.left,
                            zIndex: 9999 
                        }}
                        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-1 min-w-[140px] flex flex-col gap-1 overflow-hidden origin-top-left"
                    >
                        <div className="px-2 py-1 text-[8px] font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5 mb-1">
                            Fonte do Chat
                        </div>
                        {Object.keys(activeDropdownStreamer.channels).map((platformKey) => {
                            const p = platformKey as Platform;
                            // Skip platforms that don't have a configured channel
                            if (!activeDropdownStreamer.channels[p]) return null;
                            
                            const isSelected = getChatPlatform(activeDropdownStreamer.id) === p;
                            const pColor = getPlatformColor(p);

                            return (
                                <button
                                    key={p}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setChatOverrides(prev => ({ ...prev, [activeDropdownStreamer.id]: p }));
                                        setOpenSelectorId(null);
                                    }}
                                    className={`
                                        flex items-center gap-2 px-2 py-2 rounded transition-colors text-left
                                        ${isSelected ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    <ChatIcon platform={p} className="w-3 h-3 flex-shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{p}</span>
                                    {isSelected && <div className="ml-auto w-1 h-1 rounded-full" style={{ backgroundColor: pColor, boxShadow: `0 0 5px ${pColor}` }} />}
                                </button>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MultiChat;