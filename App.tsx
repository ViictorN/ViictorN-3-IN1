import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STREAMERS } from './constants';
import { Platform, AppSettings } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import StreamSlot from './components/StreamSlot';
import MultiChat from './components/MultiChat';
import ControlDock from './components/ControlDock';

// Layout modes: 'columns' (3 vertical side-by-side) or 'grid' (1 top, 2 bottom)
type LayoutMode = 'columns' | 'grid';

const App = () => {
  const defaultState: Record<string, Platform> = STREAMERS.reduce((acc, s) => ({
    ...acc,
    [s.id]: s.defaultPlatform
  }), {});

  const [streamerStates, setStreamerStates] = useLocalStorage<Record<string, Platform>>('multi_viictorn_v7', defaultState);
  const [layoutMode, setLayoutMode] = useLocalStorage<LayoutMode>('layout_mode_v2', 'columns');
  
  // Settings Store
  const [settings, setSettings] = useLocalStorage<AppSettings>('multi_settings_v2', {
      performanceMode: false,
      cinemaMode: false,
      chatWidth: 420
  });

  // State for functionality
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedStreamerId, setExpandedStreamerId] = useState<string | null>(null);
  const [globalRefreshKey, setGlobalRefreshKey] = useState(0);
  
  // Welcome Screen State
  const [hasEntered, setHasEntered] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Check if user has already "entered" in this session to skip animation
    const sessionEntered = sessionStorage.getItem('has_entered_session');
    if (sessionEntered) {
        setHasEntered(true);
    }

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
    }, 40);

    return () => {
        window.removeEventListener('resize', checkMobile);
        clearInterval(interval);
    };
  }, []);

  const handleEnter = () => {
      setHasEntered(true);
      sessionStorage.setItem('has_entered_session', 'true');
  };

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

  const handleResetLayout = () => {
      setSettings(prev => ({ ...prev, chatWidth: 420, performanceMode: false, cinemaMode: false }));
      setLayoutMode('columns');
      setStreamerStates(defaultState);
      setIsChatOpen(true);
  };

  const handleRefreshAll = () => {
    setGlobalRefreshKey(prev => prev + 1);
  };

  const handleSettingsUpdate = (newSettings: Partial<AppSettings>) => {
      // Logic side-effect: If enabling Cinema Mode, auto-close chat for immersion.
      // But we don't lock it closed (user can reopen).
      if (newSettings.cinemaMode === true) {
          setIsChatOpen(false);
      }
      
      setSettings(prev => ({ ...prev, ...newSettings }));
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
                            onClick={handleEnter}
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
                <span className="text-[9px] text-neutral-700 font-mono">v1.3.0 // ViictorN</span>
            </div>
        </div>
    );
  }

  // Calculate dynamic width for main content
  // FIX: Chat visibility is now independent of Cinema Mode visually, 
  // although cinema mode auto-closes it on toggle.
  const effectiveChatWidth = (isChatOpen && !isMobile) ? settings.chatWidth : 0;
  
  const contentStyle = {
      marginRight: !isMobile ? `${effectiveChatWidth}px` : 0
  };

  return (
    <div className="h-[100dvh] bg-transparent text-white font-sans selection:bg-white/20 overflow-hidden flex flex-col">
      
      {/* Ambient Background (Controlled via Settings) */}
      {!settings.performanceMode && !settings.cinemaMode && (
          <div className="fixed inset-0 z-[-2] pointer-events-none bg-[radial-gradient(circle_at_50%_50%,#1a1a1a_0%,#000000_100%)]">
             <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[100px] animate-blob mix-blend-screen"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-red-900/20 rounded-full blur-[100px] animate-blob mix-blend-screen" style={{ animationDelay: '2s' }}></div>
             <div className="absolute top-[40%] left-[40%] w-[40vw] h-[40vw] bg-green-900/10 rounded-full blur-[80px] animate-blob mix-blend-screen" style={{ animationDelay: '4s' }}></div>
          </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        
        {/* Stream Grid Area */}
        <div 
            className="flex-1 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={contentStyle}
        >
          <div className={`
             w-full h-full
             ${!isMobile && layoutMode === 'grid' && !expandedStreamerId
                ? 'grid grid-cols-2 grid-rows-[60%_40%]' 
                : 'flex flex-col md:flex-row' 
             }
          `}>
            {STREAMERS.map((streamer, index) => {
                const isThisExpanded = expandedStreamerId === streamer.id;
                const isOtherExpanded = expandedStreamerId !== null && !isThisExpanded;

                if (isOtherExpanded) return null;

                let gridClasses = '';
                if (expandedStreamerId) {
                    gridClasses = 'flex-1 w-full h-full'; 
                } else if (!isMobile && layoutMode === 'grid') {
                    if (index === 0) gridClasses = 'col-span-2 row-span-1 border-b border-white/5'; 
                    else if (index === 1) gridClasses = 'col-span-1 row-span-1 border-r border-white/5'; 
                    else gridClasses = 'col-span-1 row-span-1'; 
                } else {
                    gridClasses = 'flex-1 relative border-b border-white/5 md:border-b-0 md:border-r border-white/5 last:border-0';
                }

                return (
                <motion.div 
                    key={streamer.id} 
                    layout 
                    className={`relative overflow-hidden bg-black ${gridClasses} ${settings.cinemaMode ? 'border-none' : ''}`}
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
                    isCinemaMode={settings.cinemaMode}
                    refreshKeyTrigger={globalRefreshKey}
                    />
                </motion.div>
                );
            })}
          </div>
        </div>

        {/* Central Control Dock */}
        <ControlDock 
            settings={settings}
            onUpdateSettings={handleSettingsUpdate}
            layoutMode={layoutMode}
            onToggleLayout={toggleLayout}
            isChatOpen={isChatOpen}
            onToggleChat={toggleChat}
            onResetLayout={handleResetLayout}
            onRefreshAll={handleRefreshAll}
            isMobile={isMobile}
        />

        {/* Chat Sidebar */}
        <MultiChat 
            activeStreamers={streamerStates}
            isOpen={isChatOpen}
            onClose={toggleChat}
            width={isMobile ? window.innerWidth : settings.chatWidth}
            onResize={(w) => setSettings(s => ({ ...s, chatWidth: w }))}
        />

      </main>
    </div>
  );
};

export default App;