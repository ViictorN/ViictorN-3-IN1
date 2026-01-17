import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamerConfig, Platform } from '../types';
import { STREAMERS, TwitchIcon, YouTubeIcon, KickIcon, CUSTOM_MERGED_CHAT_URL } from '../constants';

interface MultiChatProps {
  activeStreamers: { [key: string]: Platform };
  isOpen: boolean;
  onClose: () => void;
}

const MultiChat: React.FC<MultiChatProps> = ({ activeStreamers, isOpen, onClose }) => {
  const [selectedStreamerId, setSelectedStreamerId] = useState<string>('all');
  
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

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
        // YouTube chat embedding is restricted, usually requires specific domain verification or popout
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
        <motion.div 
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-[#090909] border-l border-white/10 z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          {/* HEADER TABS */}
          <div className="flex flex-none items-end h-16 bg-black border-b border-white/5 px-4 gap-2 overflow-x-auto no-scrollbar">
            
            {/* MIX TAB */}
            <button
               onClick={() => setSelectedStreamerId('all')}
               className={`
                 relative group flex flex-col items-center justify-center px-2 h-12 min-w-[70px] rounded-t-lg transition-all duration-300
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

            <div className="w-[1px] h-5 mb-3.5 bg-white/10 mx-1 self-end" />

            {/* INDIVIDUAL TABS */}
            {STREAMERS.map((streamer) => {
               const isActive = selectedStreamerId === streamer.id;
               const streamerPlatform = activeStreamers[streamer.id];
               
               return (
                 <button
                   key={streamer.id}
                   onClick={() => setSelectedStreamerId(streamer.id)}
                   className={`
                     relative group flex-1 flex items-center justify-center gap-2 h-12 rounded-t-lg transition-all duration-300 min-w-[90px]
                     ${isActive ? 'text-white' : 'text-neutral-600 hover:text-neutral-300'}
                   `}
                 >
                   <span className="text-[10px] font-bold uppercase truncate z-10">{streamer.name}</span>
                   
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
            
            <button onClick={onClose} className="flex-none w-8 h-8 mb-2 flex items-center justify-center rounded-full text-neutral-600 hover:text-white hover:bg-white/10 transition-colors ml-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
            </button>
          </div>

          <div className="flex-1 relative bg-[#090909] flex flex-col overflow-hidden">
             
             {/* 
                 PERSISTENCE LOGIC:
                 We render ALL iframes but hide the ones that aren't selected.
                 This prevents disconnection when switching tabs.
             */}

             {/* MIX VIEW */}
             <div 
                className="w-full h-full flex flex-col"
                style={{ display: selectedStreamerId === 'all' ? 'flex' : 'none' }}
             >
                {CUSTOM_MERGED_CHAT_URL ? (
                    <iframe src={CUSTOM_MERGED_CHAT_URL} className="w-full h-full border-none" title="Unified Chat" loading="lazy" />
                ) : (
                    // Default Mix: Stack all active chats
                    STREAMERS.map((streamer) => {
                      const platform = activeStreamers[streamer.id] || Platform.Twitch;
                      const url = getChatUrl(streamer, platform);
                      return (
                        <div key={`mix-${streamer.id}`} className="flex-1 relative w-full min-h-0 border-b border-white/5 last:border-0 overflow-hidden">
                           {platform === Platform.YouTube ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F0F0F]">
                                <span className="text-[9px] font-bold text-neutral-600 uppercase mb-2">Chat do YouTube (Pop-out necessário)</span>
                                <a href={`https://youtube.com/${streamer.channels[Platform.YouTube]}`} target="_blank" rel="noreferrer" className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[9px] text-neutral-400 uppercase rounded transition">Abrir</a>
                              </div>
                           ) : (
                             <iframe src={url} className="w-full h-full border-none block" title={`${streamer.name} Chat Mix`} loading="lazy" />
                           )}
                        </div>
                      );
                    })
                )}
             </div>

             {/* INDIVIDUAL VIEWS (PERSISTENT) */}
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
                                <a href={`https://youtube.com/${streamer.channels[Platform.YouTube]}`} target="_blank" rel="noreferrer" className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase rounded transition">Abrir Chat Externo</a>
                            </div>
                        ) : (
                             <iframe src={url} className="w-full h-full border-none" title={`${streamer.name} Chat Tab`} />
                        )}
                    </div>
                );
             })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MultiChat;