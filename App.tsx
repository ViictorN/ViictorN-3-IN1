import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STREAMERS } from './constants';
import { Platform, AppSettings } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import StreamSlot from './components/StreamSlot';
import MultiChat from './components/MultiChat';
import ControlDock from './components/ControlDock';

// Layout modes: 'columns' (3 vertical side-by-side) or 'grid' (1 top, 2 bottom)
type LayoutMode = 'columns' | 'grid' | 'pyramid';

const App = () => {
  const defaultState: Record<string, Platform> = STREAMERS.reduce((acc, s) => ({
    ...acc,
    [s.id]: s.defaultPlatform
  }), {});

  const [streamerStates, setStreamerStates] = useLocalStorage<Record<string, Platform>>('multi_viictorn_v7', defaultState);
  const [layoutMode, setLayoutMode] = useLocalStorage<LayoutMode>('layout_mode_v3', 'columns');
  
  // Track visibility
  const [visibleStreamers, setVisibleStreamers] = useLocalStorage<string[]>('visible_streamers_v2', STREAMERS.map(s => s.id));

  // Track Order of Streamers (IDs)
  const [streamerOrder, setStreamerOrder] = useLocalStorage<string[]>('streamer_order_v1', STREAMERS.map(s => s.id));

  // Settings Store
  const [settings, setSettings] = useLocalStorage<AppSettings>('multi_settings_v3', {
      performanceMode: false,
      cinemaMode: false,
      streamsVisible: true,
      chatWidth: 420
  });

  // State for functionality
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedStreamerId, setExpandedStreamerId] = useState<string | null>(null);
  const [globalRefreshKey, setGlobalRefreshKey] = useState(0);
  
  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
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
      // Only auto-close chat on initial load for mobile, don't force it continuously
      if (mobile && !hasEntered) setIsChatOpen(false);
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
  }, [hasEntered]);

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

  // UPDATED: Toggle Chat logic to conflict-resolve with Cinema Mode
  const toggleChat = () => {
      setIsChatOpen(prev => {
          const willBeOpen = !prev;
          // If we are opening the chat, we MUST disable Cinema Mode if it's on
          if (willBeOpen && settings.cinemaMode) {
              setSettings(s => ({ ...s, cinemaMode: false }));
          }
          return willBeOpen;
      });
  };

  const toggleLayout = () => {
    setLayoutMode(prev => {
      if (prev === 'columns') return 'grid';
      if (prev === 'grid') return 'pyramid';
      return 'columns';
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedStreamerId(prev => prev === id ? null : id);
  };
  
  const toggleStreamerVisibility = (id: string) => {
      setVisibleStreamers(prev => {
          if (prev.includes(id)) {
              return prev.filter(s => s !== id);
          } else {
              return [...prev, id];
          }
      });
  };

  const handleResetLayout = () => {
      setSettings(prev => ({ 
          ...prev, 
          chatWidth: 420, 
          performanceMode: false, 
          cinemaMode: false, 
          streamsVisible: true 
        }));
      setLayoutMode('columns');
      setStreamerStates(defaultState);
      setVisibleStreamers(STREAMERS.map(s => s.id));
      setStreamerOrder(STREAMERS.map(s => s.id));
      setIsChatOpen(true);
  };

  const handleRefreshAll = () => {
    setGlobalRefreshKey(prev => prev + 1);
  };

  const handleSettingsUpdate = (newSettings: Partial<AppSettings>) => {
      // If turning ON Cinema Mode, force Chat CLOSE
      if (newSettings.cinemaMode === true) {
          setIsChatOpen(false);
      }
      setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // --- Reordering Logic ---
  
  // 1. Button-based reordering (Works perfectly on mobile/menu)
  const handleMoveStreamer = (id: string, direction: 'up' | 'down') => {
    const currentIndex = streamerOrder.indexOf(id);
    if (currentIndex === -1) return;
    
    const newOrder = [...streamerOrder];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Bounds check
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    // Swap
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
    setStreamerOrder(newOrder);
  };

  // 2. Drag and Drop handlers (Desktop mainly)
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
    e.preventDefault(); 
  };
  
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault(); 
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const copyListItems = [...streamerOrder];
    
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        const dragItemContent = copyListItems[dragItem.current];
        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);
        setStreamerOrder(copyListItems);
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
    setIsDragging(false);
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
            
            {/* Version Text & Credits - REDESIGNED */}
            <div className="absolute bottom-8 left-0 w-full flex justify-center z-20 pointer-events-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-black/20 backdrop-blur-md border border-white/5 hover:bg-black/40 hover:border-white/10 transition-all duration-500 group/credit shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                >
                    <span className="text-[10px] text-neutral-600 font-mono tracking-widest">v1.8.0</span>
                    <span className="text-neutral-700 text-[10px] opacity-50">|</span>
                    <a 
                        href="https://www.instagram.com/victorg.n7/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative flex items-center gap-1.5 group/link"
                        title="Instagram do Desenvolvedor"
                    >
                        <span className="text-sm font-bold tracking-widest bg-gradient-to-r from-emerald-500 via-lime-500 to-white bg-clip-text text-transparent group-hover/link:brightness-125 transition-all duration-300 cursor-pointer drop-shadow-sm font-sans">
                            ViictorN
                        </span>
                        {/* Underline Effect */}
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-emerald-500 to-lime-500 transition-all duration-300 group-hover/link:w-full opacity-70"></span>
                    </a>
                </motion.div>
            </div>
        </div>
    );
  }

  // Determine Layout Widths
  const areStreamsVisible = settings.streamsVisible;
  
  // FIXED: Logic for Mobile Chat Width. If Mobile, use Full Width (window.innerWidth), otherwise use settings or 0.
  const currentChatWidth = (!areStreamsVisible) 
      ? (typeof window !== 'undefined' ? window.innerWidth : 1000) 
      : (isChatOpen 
          ? (isMobile ? (typeof window !== 'undefined' ? window.innerWidth : 400) : settings.chatWidth) 
          : 0);

  const contentStyle = {
      marginRight: !isMobile ? `${currentChatWidth}px` : 0
  };
  
  // Calculate active layout
  const visibleCount = visibleStreamers.length;
  
  const getGridClasses = (indexInVisible: number, totalVisible: number) => {
      if (expandedStreamerId) return 'flex-1 w-full h-full';

      // 1 Visible: Full Screen
      if (totalVisible === 1) return 'flex-1 w-full h-full';
      
      // 2 Visible: Split (Clean 50/50 split)
      if (totalVisible === 2) {
          return 'flex-1 border-b md:border-b-0 md:border-r border-white/5 last:border-0';
      }

      // 3 Visible (Standard Grid or Columns)
      if (totalVisible >= 3) {
          if (layoutMode === 'grid' || layoutMode === 'pyramid') {
            if (indexInVisible === 0) return 'col-span-2 row-span-1 border-b border-white/5'; 
            else if (indexInVisible === 1) return 'col-span-1 row-span-1 border-r border-white/5'; 
            else return 'col-span-1 row-span-1'; 
          } else {
             return 'flex-1 relative border-b border-white/5 md:border-b-0 md:border-r border-white/5 last:border-0';
          }
      }
      return 'flex-1';
  };

  const getContainerGridClass = () => {
    if (layoutMode === 'grid' && !expandedStreamerId && visibleCount >= 3) {
        return 'grid grid-cols-2 grid-rows-[60%_40%]'; // Focus Mode
    }
    if (layoutMode === 'pyramid' && !expandedStreamerId && visibleCount >= 3) {
        return 'grid grid-cols-2 grid-rows-2'; // Equal Height Pyramid
    }
    return 'flex flex-col md:flex-row'; // Columns or others
  };

  return (
    <div className="h-[100dvh] bg-transparent text-white font-sans selection:bg-white/20 overflow-hidden flex flex-col">
      
      {/* Ambient Background */}
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
          <AnimatePresence mode="wait">
            {areStreamsVisible && (
                <motion.div 
                    key="stream-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`w-full h-full ${getContainerGridClass()}`}
                >
                    {visibleCount === 0 ? (
                        <div className="flex flex-col items-center justify-center w-full h-full text-neutral-500">
                            <span className="text-2xl font-bold uppercase mb-2">Sem Players Visíveis</span>
                            <span className="text-xs">Use o menu lateral para ativar os streamers.</span>
                        </div>
                    ) : (
                        // We iterate through streamerOrder to respect the user's custom order
                        streamerOrder.map((streamerId, index) => {
                            const streamer = STREAMERS.find(s => s.id === streamerId);
                            if (!streamer) return null;

                            // Only render if visible or if it's the expanded one (force show)
                            if (!visibleStreamers.includes(streamer.id) && expandedStreamerId !== streamer.id) return null;

                            const isThisExpanded = expandedStreamerId === streamer.id;
                            const isOtherExpanded = expandedStreamerId !== null && !isThisExpanded;

                            if (isOtherExpanded) return null;

                            // Calculate index relative to *visible* items for grid styling
                            const currentVisibleOrder = streamerOrder.filter(id => visibleStreamers.includes(id));
                            const indexInVisible = currentVisibleOrder.indexOf(streamer.id);
                            
                            const gridClasses = getGridClasses(indexInVisible, visibleCount);

                            return (
                                <motion.div 
                                    key={streamer.id} 
                                    layout 
                                    // Make draggable (Desktop)
                                    draggable={!isMobile && !expandedStreamerId} 
                                    onDragStart={(e) => onDragStart(e as unknown as React.DragEvent<HTMLDivElement>, index)}
                                    onDragEnter={(e) => onDragEnter(e as unknown as React.DragEvent<HTMLDivElement>, index)}
                                    onDragOver={onDragOver}
                                    onDrop={onDrop}
                                    
                                    className={`relative overflow-hidden bg-black ${gridClasses} ${settings.cinemaMode ? 'border-none' : ''}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        // Highlight drop target or currently dragged item
                                        opacity: isDragging && dragItem.current === index ? 0.4 : 1,
                                        zIndex: isDragging && dragItem.current === index ? 50 : 1,
                                        cursor: isDragging ? 'grabbing' : 'auto'
                                    }}
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
                                        onHide={() => toggleStreamerVisibility(streamer.id)}
                                        isDragging={isDragging} 
                                    />
                                </motion.div>
                            );
                        })
                    )}
                </motion.div>
            )}
          </AnimatePresence>
          
          {!areStreamsVisible && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center opacity-20">
                      <span className="text-4xl font-black uppercase tracking-widest">Modo Chat</span>
                  </div>
              </div>
          )}
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
            visibleStreamers={visibleStreamers}
            onToggleStreamerVisibility={toggleStreamerVisibility}
            onResetOrder={() => setStreamerOrder(STREAMERS.map(s => s.id))}
            streamerOrder={streamerOrder}
            onMoveStreamer={handleMoveStreamer}
        />

        {/* Chat Sidebar */}
        <MultiChat 
            activeStreamers={streamerStates}
            isOpen={isChatOpen || !areStreamsVisible}
            onClose={toggleChat}
            width={currentChatWidth}
            onResize={(w) => setSettings(s => ({ ...s, chatWidth: w }))}
            disableResize={!areStreamsVisible}
        />

      </main>
    </div>
  );
};

export default App;