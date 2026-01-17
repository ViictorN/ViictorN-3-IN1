import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STREAMERS } from './constants';
import { Platform } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import StreamSlot from './components/StreamSlot';
import MultiChat from './components/MultiChat';

// Layout modes: 'columns' (3 vertical side-by-side) or 'grid' (1 top, 2 bottom)
type LayoutMode = 'columns' | 'grid';

const App = () => {
  const defaultState: Record<string, Platform> = STREAMERS.reduce((acc, s) => ({
    ...acc,
    [s.id]: s.defaultPlatform
  }), {});

  const [streamerStates, setStreamerStates] = useLocalStorage<Record<string, Platform>>('multi_viictorn_v7', defaultState);
  const [layoutMode, setLayoutMode] = useLocalStorage<LayoutMode>('layout_mode_v2', 'columns');
  
  // State for functionality
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedStreamerId, setExpandedStreamerId] = useState<string | null>(null);
  
  // Welcome Screen State
  const [hasEntered, setHasEntered] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsChatOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Simulate system initialization loading
    const interval = setInterval(() => {
        setLoadingProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                return 100;
            }
            return prev + Math.floor(Math.random() * 5) + 2;
        });
    }, 50);

    return () => {
        window.removeEventListener('resize', checkMobile);
        clearInterval(interval);
    };
  }, []);

  const handlePlatformChange = (streamerId: string, platform: Platform) => {
    setStreamerStates(prev => ({
      ...prev,
      [streamerId]: platform
    }));
  };

  const toggleChat = () => setIsChatOpen(prev => !prev);
  const toggleLayout = () => setLayoutMode(prev => prev === 'columns' ? 'grid' : 'columns');

  const toggleExpand = (id: string) => {
    setExpandedStreamerId(prev => prev === id ? null : id);
  };

  // --- WELCOME SCREEN COMPONENT ---
  if (!hasEntered) {
    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900 rounded-full blur-[150px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center p-8 text-center w-full max-w-lg">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="mb-8"
                >
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-2 drop-shadow-2xl">
                        Multi<span className="text-neutral-500">Stream</span>
                    </h1>
                </motion.div>

                {loadingProgress < 100 ? (
                    <div className="w-full max-w-xs flex flex-col items-center gap-2">
                        <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between w-full text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                            <span>Initializing Systems</span>
                            <span>{loadingProgress}%</span>
                        </div>
                    </div>
                ) : (
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-col gap-4 items-center w-full"
                    >
                        <div className="flex gap-4 mb-8">
                            {STREAMERS.map((s, i) => (
                                <div key={s.id} className="flex flex-col items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full shadow-[0_0_10px]`} style={{ backgroundColor: s.color, boxShadow: `0 0 15px ${s.color}` }} />
                                    <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">{s.name}</span>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => setHasEntered(true)}
                            className="group relative px-10 py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                            <span className="relative z-10 flex items-center gap-3">
                                Entrar na Sessão
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            </span>
                        </button>
                    </motion.div>
                )}
            </div>
            
            {/* Version Text */}
            <div className="absolute bottom-4 left-0 w-full text-center">
                <span className="text-[9px] text-neutral-700 font-mono">v1.0.0 Stable // ViictorN</span>
            </div>
        </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-transparent text-white font-sans selection:bg-white/20 overflow-hidden flex flex-col">
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        
        {/* Stream Grid Area */}
        <div className={`
            flex-1 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
            ${isChatOpen && !isMobile ? 'md:mr-[420px]' : ''} 
            ${!isMobile && layoutMode === 'grid' && !expandedStreamerId
                ? 'grid grid-cols-2 grid-rows-[60%_40%]' // Grid Mode
                : 'flex flex-col md:flex-row' // Columns or Expanded
            }
        `}>
          {STREAMERS.map((streamer, index) => {
            // Determine visibility based on Expanded State
            const isThisExpanded = expandedStreamerId === streamer.id;
            const isOtherExpanded = expandedStreamerId !== null && !isThisExpanded;

            // If mobile, we stack them. If expanded, we hide others.
            if (isOtherExpanded) return null;

            let gridClasses = '';
            
            // Layout Logic
            if (expandedStreamerId) {
                // Fullscreen Mode
                gridClasses = 'flex-1 w-full h-full'; 
            } else if (!isMobile && layoutMode === 'grid') {
                // Grid Mode
                if (index === 0) {
                    gridClasses = 'col-span-2 row-span-1 border-b border-white/5'; 
                } else if (index === 1) {
                    gridClasses = 'col-span-1 row-span-1 border-r border-white/5'; 
                } else {
                    gridClasses = 'col-span-1 row-span-1'; 
                }
            } else {
                // Columns (Desktop) or Stack (Mobile)
                gridClasses = 'flex-1 relative border-b border-white/5 md:border-b-0 md:border-r border-white/5 last:border-0';
            }

            return (
              <motion.div 
                key={streamer.id} 
                layout 
                className={`relative overflow-hidden bg-black ${gridClasses}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                 <StreamSlot 
                   streamer={streamer}
                   currentPlatform={streamerStates[streamer.id]}
                   onPlatformChange={(p) => handlePlatformChange(streamer.id, p)}
                   isExpanded={isThisExpanded}
                   onToggleExpand={() => toggleExpand(streamer.id)}
                   isOtherExpanded={false}
                 />
              </motion.div>
            );
          })}
        </div>

        {/* Floating Controls (Bottom Right) */}
        <AnimatePresence>
            <motion.div 
                className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 items-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
            >
                {/* Layout Toggle (Hidden if expanded or mobile) */}
                {!isMobile && !expandedStreamerId && (
                  <motion.button
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleLayout}
                    className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-xl border border-white/10 text-white rounded-full shadow-lg hover:bg-white/10 hover:border-white/30 transition-all group"
                    title={layoutMode === 'grid' ? "Voltar para Colunas" : "Modo Grade"}
                  >
                    {layoutMode === 'grid' ? (
                       <svg className="opacity-70 group-hover:opacity-100" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
                    ) : (
                       <svg className="opacity-70 group-hover:opacity-100" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 14h18"/><path d="M12 14v7"/></svg>
                    )}
                  </motion.button>
                )}

                {/* Chat Toggle Button */}
                <motion.button
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleChat}
                    className={`
                      w-12 h-12 flex items-center justify-center rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all border
                      ${isChatOpen 
                        ? 'bg-white border-white text-black' 
                        : 'bg-black/40 border-white/10 backdrop-blur-xl text-white hover:bg-white/10 hover:border-white/30'}
                    `}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
                </motion.button>
            </motion.div>
        </AnimatePresence>

        {/* Chat Sidebar */}
        <MultiChat 
            activeStreamers={streamerStates}
            isOpen={isChatOpen}
            onClose={toggleChat}
        />

      </main>
    </div>
  );
};

export default App;