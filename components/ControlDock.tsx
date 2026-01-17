import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../types';

interface ControlDockProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  layoutMode: 'columns' | 'grid';
  onToggleLayout: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onResetLayout: () => void;
  onRefreshAll: () => void;
  isMobile: boolean;
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
  isMobile
}) => {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const dockItems = [
    {
      id: 'layout',
      label: layoutMode === 'grid' ? 'Voltar para Colunas' : 'Modo Grade',
      icon: layoutMode === 'grid' 
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 14h18"/><path d="M12 14v7"/></svg>,
      action: onToggleLayout,
      hideOnMobile: true
    },
    {
      id: 'refresh',
      label: 'Recarregar Tudo',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>,
      action: onRefreshAll,
      hideOnMobile: false
    },
    {
      id: 'cinema',
      label: settings.cinemaMode ? 'Sair do Modo Cinema' : 'Modo Cinema',
      icon: settings.cinemaMode 
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><line x1="3" x2="21" y1="3" y2="21"/></svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>,
      action: () => onUpdateSettings({ cinemaMode: !settings.cinemaMode }),
      isActive: settings.cinemaMode,
      hideOnMobile: false
    },
    {
      id: 'performance',
      label: settings.performanceMode ? 'Ativar Animações' : 'Modo Performance',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>,
      action: () => onUpdateSettings({ performanceMode: !settings.performanceMode }),
      isActive: settings.performanceMode,
      color: settings.performanceMode ? 'text-green-400' : 'text-white',
      hideOnMobile: true
    },
    {
      id: 'reset',
      label: 'Resetar Layout',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
      action: onResetLayout,
      hideOnMobile: true
    },
    {
      id: 'chat',
      label: isChatOpen ? 'Fechar Chat' : 'Abrir Chat',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>,
      action: onToggleChat,
      isActive: isChatOpen,
      hideOnMobile: false
    }
  ];

  // Filter items for mobile/desktop
  const visibleItems = dockItems.filter(item => !(isMobile && item.hideOnMobile));

  return (
    <div className="fixed top-20 right-4 z-[60] pointer-events-none flex flex-col items-end gap-2">
      
      {/* Retractable Container */}
      <motion.div 
        layout
        className="flex flex-col items-center gap-2 p-1.5 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.8)] pointer-events-auto"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Toggle Button (Always Visible) with Tooltip */}
        <div className="relative group">
            <AnimatePresence>
                {hoveredButton === 'main-toggle' && (
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
                onClick={() => setIsExpanded(!isExpanded)}
                onMouseEnter={() => setHoveredButton('main-toggle')}
                onMouseLeave={() => setHoveredButton(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
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
                                {hoveredButton === item.id && (
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

                            <motion.button
                                layout
                                onClick={() => item.action()}
                                onMouseEnter={() => setHoveredButton(item.id)}
                                onMouseLeave={() => setHoveredButton(null)}
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.95 }}
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