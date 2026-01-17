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

  // VERSION UP: v7 - Forces a reset of stored streamer platforms to fix potential data corruption
  const [streamerStates, setStreamerStates] = useLocalStorage<Record<string, Platform>>('multi_viictorn_v7', defaultState);
  const [layoutMode, setLayoutMode] = useLocalStorage<LayoutMode>('layout_mode_v2', 'columns');
  
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsChatOpen(false);
    }
  }, []);

  const handlePlatformChange = (streamerId: string, platform: Platform) => {
    setStreamerStates(prev => ({
      ...prev,
      [streamerId]: platform
    }));
  };

  const toggleChat = () => setIsChatOpen(prev => !prev);
  const toggleLayout = () => setLayoutMode(prev => prev === 'columns' ? 'grid' : 'columns');

  return (
    <div className="h-[100dvh] bg-black text-white font-sans selection:bg-white/20 overflow-hidden flex flex-col">
      
      {/* HEADER REMOVED as requested */}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Stream Grid Area */}
        <div className={`
            flex-1 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
            ${isChatOpen && !isMobile ? 'md:mr-[420px]' : ''} 
            ${!isMobile && layoutMode === 'grid' 
                ? 'grid grid-cols-2 grid-rows-[60%_40%]' // 1 Top (60%), 2 Bottom (40%)
                : 'flex flex-col md:flex-row' // Equal sizes (Same size requested)
            }
        `}>
          {STREAMERS.map((streamer, index) => {
            // --- GRID LOGIC ---
            // If Grid Mode:
            // Index 0 (First Streamer - Gabepeixe) -> Spans 2 columns, Row 1 (Top)
            // Index 1 (Second Streamer) -> Column 1, Row 2 (Bottom Left)
            // Index 2 (Third Streamer) -> Column 2, Row 2 (Bottom Right)
            
            let gridClasses = '';
            
            if (!isMobile && layoutMode === 'grid') {
                if (index === 0) {
                    gridClasses = 'col-span-2 row-span-1 border-b border-white/5'; 
                } else if (index === 1) {
                    gridClasses = 'col-span-1 row-span-1 border-r border-white/5'; 
                } else {
                    gridClasses = 'col-span-1 row-span-1'; 
                }
            } else {
                // Column (Standard) Mode or Mobile
                // "Todos no mesmo tamanho" essentially means this mode
                gridClasses = 'flex-1 relative border-b border-white/5 md:border-b-0 md:border-r last:border-0';
            }

            return (
              <div 
                key={streamer.id} 
                className={`relative overflow-hidden ${gridClasses}`}
              >
                 <StreamSlot 
                   streamer={streamer}
                   currentPlatform={streamerStates[streamer.id]}
                   onPlatformChange={(p) => handlePlatformChange(streamer.id, p)}
                 />
              </div>
            );
          })}
        </div>

        {/* Floating Controls (Bottom Right) */}
        <AnimatePresence>
            <motion.div 
                className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {/* Layout Toggle Button (Hidden on Mobile) */}
                {!isMobile && (
                  <motion.button
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleLayout}
                    className="w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur border border-white/10 text-white rounded-full shadow-lg hover:bg-white/10 transition-colors group"
                    title={layoutMode === 'grid' ? "Voltar para Colunas" : "Modo Cinema (1+2)"}
                  >
                    {layoutMode === 'grid' ? (
                       // Icon: Columns
                       <svg className="opacity-70 group-hover:opacity-100" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
                    ) : (
                       // Icon: Grid (1 Top, 2 Bottom)
                       <svg className="opacity-70 group-hover:opacity-100" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 14h18"/><path d="M12 14v7"/></svg>
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
                      w-10 h-10 flex items-center justify-center rounded-full shadow-2xl transition-all
                      ${isChatOpen ? 'bg-white text-black' : 'bg-black/60 border border-white/20 text-white hover:bg-white/10'}
                    `}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
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