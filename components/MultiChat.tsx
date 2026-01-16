import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StreamerConfig, Platform } from '../types';
import { STREAMERS, TwitchIcon, YouTubeIcon, KickIcon, CUSTOM_MERGED_CHAT_URL } from '../constants';

interface MultiChatProps {
  activeStreamers: { [key: string]: Platform };
  isOpen: boolean;
  onClose: () => void;
}

const MultiChat: React.FC<MultiChatProps> = ({ activeStreamers, isOpen, onClose }) => {
  const [selectedStreamerId, setSelectedStreamerId] = useState<string>('all');

  const getChatUrl = (streamer: StreamerConfig, platform: Platform) => {
    const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const channelId = streamer.channels[platform];
    
    if (!channelId) return 'about:blank';

    switch (platform) {
      case Platform.Twitch:
        return `https://www.twitch.tv/embed/${channelId}/chat?parent=${parent}&darkpopout`;
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

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-[#090909] border-l border-white/5 z-50 flex flex-col shadow-2xl"
    >
      {/* Navigation Tabs - Compact & Dark */}
      <div className="flex flex-none items-stretch h-10 bg-black/60 border-b border-white/5 overflow-x-auto no-scrollbar backdrop-blur-md">
        {/* MIX TAB (ALL IN ONE) */}
        <button
           onClick={() => setSelectedStreamerId('all')}
           className={`
             relative px-4 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all duration-300 min-w-[70px]
             ${selectedStreamerId === 'all' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}
           `}
        >
          <span>MIX</span>
          {selectedStreamerId === 'all' && (
             <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
           )}
        </button>

        <div className="w-[1px] h-4 self-center bg-white/10 mx-1" />

        {/* INDIVIDUAL TABS */}
        {STREAMERS.map((streamer) => {
           const isActive = selectedStreamerId === streamer.id;
           const streamerPlatform = activeStreamers[streamer.id];
           
           return (
             <button
               key={streamer.id}
               onClick={() => setSelectedStreamerId(streamer.id)}
               className={`
                 relative flex-1 flex items-center justify-center gap-2
                 transition-all duration-300
                 ${isActive ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}
               `}
             >
               <span className="text-[9px] font-bold uppercase truncate">
                 {streamer.name}
               </span>
               <div className={`transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                 <ChatIcon platform={streamerPlatform} />
               </div>
               
               {isActive && (
                 <motion.div 
                   layoutId="activeTabIndicator"
                   className="absolute bottom-0 left-0 right-0 h-[2px]"
                   style={{ backgroundColor: streamer.color }}
                 />
               )}
             </button>
           );
        })}
        
        {/* Close */}
        <button 
            onClick={onClose}
            className="flex-none w-10 flex items-center justify-center text-neutral-600 hover:text-white transition-colors ml-auto"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
        </button>
      </div>

      {/* Chat Container */}
      <div className="flex-1 relative bg-black flex flex-col overflow-hidden">
         {selectedStreamerId === 'all' ? (
           // MIX VIEW: Seamless Vertical Stack OR Custom External Widget
           <div className="flex flex-col h-full w-full">
             {CUSTOM_MERGED_CHAT_URL ? (
                // External Aggregator Mode (BotRix, SocialStream, etc)
                <iframe 
                   src={CUSTOM_MERGED_CHAT_URL} 
                   className="w-full h-full border-none" 
                   title="Unified Chat"
                   loading="lazy"
                />
             ) : (
                // Seamless Stack Mode (Fallback)
                STREAMERS.map((streamer, idx) => {
                  const platform = activeStreamers[streamer.id] || Platform.Twitch;
                  const url = getChatUrl(streamer, platform);
                  
                  return (
                    <div 
                       key={streamer.id} 
                       className="flex-1 relative w-full min-h-0 border-b border-white/5 last:border-0 overflow-hidden"
                    >
                       {platform === Platform.YouTube ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F0F0F]">
                            <span className="text-[9px] font-bold text-neutral-600 uppercase mb-2">Chat do YouTube (Pop-out necessário)</span>
                            <a 
                               href={`https://youtube.com/${streamer.channels[Platform.YouTube]}`}
                               target="_blank"
                               rel="noreferrer"
                               className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[9px] text-neutral-400 uppercase rounded transition"
                            >
                               Abrir
                            </a>
                          </div>
                       ) : (
                         <iframe 
                           src={url} 
                           className="w-full h-full border-none block" 
                           title={`${streamer.name} Chat`}
                           loading="lazy"
                         />
                       )}
                    </div>
                  );
                })
             )}
           </div>
         ) : (
           // SINGLE STREAMER VIEW
           <div className="w-full h-full">
             {(() => {
                 const streamer = STREAMERS.find(s => s.id === selectedStreamerId);
                 if (!streamer) return null;
                 const platform = activeStreamers[selectedStreamerId] || Platform.Twitch;
                 const url = getChatUrl(streamer, platform);

                 if (platform === Platform.YouTube) {
                    return (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500 bg-[#0F0F0F]">
                            <YouTubeIcon className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-xs mb-4">O YouTube não permite incorporar o chat diretamente.</p>
                            <a 
                                href={`https://youtube.com/${streamer.channels[Platform.YouTube]}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase rounded transition"
                            >
                                Abrir Chat Externo
                            </a>
                        </div>
                    );
                 }
                 return <iframe src={url} className="w-full h-full border-none" title="Chat" loading="lazy" />;
             })()}
           </div>
         )}
      </div>
    </motion.div>
  );
};

export default MultiChat;