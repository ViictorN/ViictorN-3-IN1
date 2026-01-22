import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../types';
import { STREAMERS } from '../constants';

interface ControlDockProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  layoutMode: 'columns' | 'grid' | 'pyramid';
  onToggleLayout: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onResetLayout: () => void;
  onRefreshAll: () => void;
  isMobile: boolean;
  visibleStreamers: string[];
  onToggleStreamerVisibility: (id: string) => void;
  onResetOrder: () => void;
  streamerOrder: string[]; // Order of streamer IDs
  onMoveStreamer: (id: string, direction: 'up' | 'down') => void;
}

const ControlDock: React.FC<ControlDockProps> = ({
  settings,
  onUpdateSettings,
  layoutMode,
  onToggleLayout,
  isChatOpen,
  onToggleChat,
  onResetLayout,
  onRefreshAll,
  isMobile,
  visibleStreamers,
  onToggleStreamerVisibility,
  onResetOrder,
  streamerOrder,
  onMoveStreamer
}) => {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlayersMenu, setShowPlayersMenu] = useState(false);
  const [isUIActive, setIsUIActive] = useState(true);
  const activityTimerRef = useRef<number | null>(null);

  // Auto-expand on mount for 5 seconds to show user the controls exist
  useEffect(() => {
    setIsExpanded(true);
    const timer = setTimeout(() => {
        setIsExpanded(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Global Activity Monitor for fading the dock
  useEffect(() => {
      const handleGlobalActivity = () => {
          setIsUIActive(true);
          if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
          activityTimerRef.current = setTimeout(() => {
              setIsUIActive(false);
          }, 5000);
      };

      window.addEventListener('mousemove', handleGlobalActivity);
      window.addEventListener('click', handleGlobalActivity);
      window.addEventListener('keydown', handleGlobalActivity);
      window.addEventListener('touchstart', handleGlobalActivity);

      // Trigger once on mount
      handleGlobalActivity();

      return () => {
          window.removeEventListener('mousemove', handleGlobalActivity);
          window.removeEventListener('click', handleGlobalActivity);
          window.removeEventListener('keydown', handleGlobalActivity);
          window.removeEventListener('touchstart', handleGlobalActivity);
          if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      };
  }, []);

  const getLayoutIcon = () => {
      if (layoutMode === 'columns') {
          // Icon for "Switch to Grid (Focus)"
          return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>;
      } else if (layoutMode === 'grid') {
          // Icon for "Switch to Pyramid"
          return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 14h18"/><path d="M12 14v7"/></svg>;
      } else {
          // Icon for "Switch to Columns" (Currently Pyramid)
          // Triangle-ish grid icon
          return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18"/><path d="M12 12v9"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
      }
  };

  const getLayoutLabel = () => {
      if (layoutMode === 'columns') return 'Ir para Foco (Grade)';
      if (layoutMode === 'grid') return 'Ir para Pirâmide';
      return 'Ir para Colunas';
  };

  const dockItems = [
    {
      id: 'players',
      label: 'Players & Ordem',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      action: () => setShowPlayersMenu(!showPlayersMenu),
      isActive: showPlayersMenu,
    },
    {
      id: 'layout',
      label: getLayoutLabel(),
      icon: getLayoutIcon(),
      action: onToggleLayout,
    },
    {
      id: 'refresh',
      label: 'Recarregar Tudo',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>,
      action: onRefreshAll,
    },
    {
      id: 'toggle-streams',
      label: settings.streamsVisible ? 'Modo Chat (Ocultar Vídeo)' : 'Mostrar Vídeo',
      icon: settings.streamsVisible
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
      action: () => onUpdateSettings({ streamsVisible: !settings.streamsVisible }),
      isActive: settings.streamsVisible,
    },
    {
      id: 'cinema',
      label: settings.cinemaMode ? 'Sair do Modo Cinema' : 'Modo Cinema',
      icon: settings.cinemaMode 
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><line x1="3" x2="21" y1="3" y2="21"/></svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>,
      action: () => onUpdateSettings({ cinemaMode: !settings.cinemaMode }),
      isActive: settings.cinemaMode,
    },
    {
      id: 'performance',
      label: settings.performanceMode ? 'Ativar Animações' : 'Modo Performance',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>,
      action: () => onUpdateSettings({ performanceMode: !settings.performanceMode }),
      isActive: settings.performanceMode,
      color: settings.performanceMode ? 'text-green-400' : 'text-white',
    },
    {
      id: 'reset',
      label: 'Resetar Layout',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
      action: onResetLayout,
    },
    {
      id: 'chat',
      label: isChatOpen ? 'Fechar Chat' : 'Abrir Chat',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>,
      action: onToggleChat,
      isActive: isChatOpen,
    }
  ];

  // Enable all items on mobile
  const visibleItems = dockItems;

  return (
    <div className="fixed top-1/2 -translate-y-1/2 right-4 z-[60] pointer-events-none flex flex-col items-end gap-2">
      
      {/* Retractable Container */}
      <motion.div 
        layout
        // Add opacity transition based on activity or expansion state
        className={`
          flex flex-col items-center gap-2 p-1.5 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.8)] pointer-events-auto transition-opacity duration-500
          ${(isExpanded || isUIActive) ? 'opacity-100' : 'opacity-30 hover:opacity-100'}
        `}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: (isExpanded || isUIActive) ? 1 : 0.3, x: 0 }}
        transition={{ opacity: { duration: 0.5 }, x: { type: "spring", stiffness: 300, damping: 30 } }}
        style={{ borderRadius: '9999px' }}
      >
        {/* Toggle Button (Always Visible) with Tooltip */}
        <div className="relative group">
            <AnimatePresence>
                {hoveredButton === 'main-toggle' && isUIActive && (
                    <motion.div
                        initial={{ opacity: 0, x: 10, scale: 0.9 }}
                        animate={{ opacity: 1, x: -10, scale: 1 }}
                        exit={{ opacity: 0, x: 5, scale: 0.9 }}
                        className="absolute top-1/2 -translate-y-1/2 right-full mr-2 px-2 py-1 bg-black/90 border border-white/10 rounded-md whitespace-nowrap z-[70] pointer-events-none"
                    >
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/90">
                            {isExpanded ? 'Recolher Menu' : 'Menu Ferramentas'}
                        </span>
                        <div className="absolute top-1/2 -translate-y-1/2 left-full -ml-[1px] border-4 border-transparent border-l-black/90" />
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button
                layout
                style={{ borderRadius: '50%' }}
                onClick={() => setIsExpanded(!isExpanded)}
                onMouseEnter={() => setHoveredButton('main-toggle')}
                onMouseLeave={() => setHoveredButton(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title={isExpanded ? 'Recolher Menu' : 'Menu Ferramentas'}
                className={`
                w-9 h-9 flex items-center justify-center rounded-full transition-colors relative z-50
                ${isExpanded ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}
                `}
            >
                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                {isExpanded ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                )}
                </motion.div>
            </motion.button>
        </div>

        {/* Expandable Items */}
        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0, scale: 0.8 }}
                    animate={{ height: 'auto', opacity: 1, scale: 1 }}
                    exit={{ height: 0, opacity: 0, scale: 0.8 }}
                    className="flex flex-col gap-2 overflow-hidden origin-top"
                >
                    {visibleItems.map((item) => (
                        <div key={item.id} className="relative group first:mt-2">
                             {/* Tooltip */}
                             <AnimatePresence>
                                {hoveredButton === item.id && isUIActive && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, x: -10, scale: 1 }}
                                        exit={{ opacity: 0, x: 5, scale: 0.9 }}
                                        className="absolute top-1/2 -translate-y-1/2 right-full mr-2 px-2 py-1 bg-black/90 border border-white/10 rounded-md whitespace-nowrap z-[70] pointer-events-none"
                                    >
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/90">
                                            {item.label}
                                        </span>
                                        <div className="absolute top-1/2 -translate-y-1/2 left-full -ml-[1px] border-4 border-transparent border-l-black/90" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            {/* Players Sub-Menu Popup (Only for 'players' item) */}
                            {item.id === 'players' && showPlayersMenu && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="absolute right-12 top-0 bg-black/90 border border-white/10 rounded-xl p-3 flex flex-col gap-2 w-56 shadow-2xl z-50 backdrop-blur-xl"
                                >
                                    <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                        <span className="text-[10px] uppercase font-bold text-neutral-500">Gerenciar & Ordem</span>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={onResetOrder}
                                                className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
                                                title="Resetar Ordem"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 mb-2">
                                        {streamerOrder.map((sId, index) => {
                                            const s = STREAMERS.find(str => str.id === sId);
                                            if(!s) return null;
                                            const isVisible = visibleStreamers.includes(s.id);
                                            
                                            return (
                                                <div
                                                    key={s.id}
                                                    className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                                        <span className={`text-xs font-medium w-16 truncate ${isVisible ? 'text-white' : 'text-neutral-500'}`}>{s.name}</span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1">
                                                        {/* Reorder Up */}
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onMoveStreamer(s.id, 'up'); }}
                                                            disabled={index === 0}
                                                            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
                                                        </button>
                                                        
                                                        {/* Reorder Down */}
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onMoveStreamer(s.id, 'down'); }}
                                                            disabled={index === streamerOrder.length - 1}
                                                            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                                                        </button>

                                                        {/* Visibility Toggle (Eye) */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onToggleStreamerVisibility(s.id); }}
                                                            className={`p-1 ml-1 rounded ${isVisible ? 'text-white hover:bg-white/20' : 'text-neutral-600 hover:text-white hover:bg-white/10'}`}
                                                            title={isVisible ? "Ocultar" : "Mostrar"}
                                                        >
                                                            {isVisible ? (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                            ) : (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    
                                    {/* Action Footer */}
                                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                                        <button 
                                            onClick={() => visibleStreamers.length < STREAMERS.length ? STREAMERS.forEach(s => !visibleStreamers.includes(s.id) && onToggleStreamerVisibility(s.id)) : null}
                                            className="text-[9px] text-center py-1.5 bg-white/5 hover:bg-white/10 rounded uppercase font-bold tracking-wider transition-colors disabled:opacity-50"
                                            disabled={visibleStreamers.length === STREAMERS.length}
                                        >
                                            Mostrar Todos
                                        </button>
                                        
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleChat();
                                            }}
                                            className={`
                                                flex items-center justify-center gap-1 text-[9px] py-1.5 rounded uppercase font-bold tracking-wider transition-colors
                                                ${isChatOpen ? 'bg-white/10 text-white' : 'bg-white/5 text-neutral-500 hover:text-white'}
                                            `}
                                        >
                                            Chat: {isChatOpen ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            <motion.button
                                layout
                                style={{ borderRadius: '50%' }}
                                onClick={() => item.action()}
                                onMouseEnter={() => setHoveredButton(item.id)}
                                onMouseLeave={() => setHoveredButton(null)}
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.95 }}
                                title={item.label}
                                className={`
                                w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300
                                ${item.isActive 
                                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                                    : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                                }
                                ${item.color || ''}
                                `}
                            >
                                {item.icon}
                            </motion.button>
                        </div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ControlDock;