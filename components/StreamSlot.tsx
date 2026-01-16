import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamerConfig, Platform } from '../types';
import PlatformSelector from './PlatformSelector';

interface StreamSlotProps {
  streamer: StreamerConfig;
  currentPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
}

const StreamSlot: React.FC<StreamSlotProps> = ({ streamer, currentPlatform, onPlatformChange }) => {
  const [showControls, setShowControls] = useState(false);
  const channelId = streamer.channels[currentPlatform];

  // Helper to handle interaction (Hover on desktop, Tap on mobile)
  const handleInteractionStart = () => setShowControls(true);
  const handleInteractionEnd = () => setShowControls(false);
  const toggleControls = () => setShowControls(prev => !prev);

  const getEmbedUrl = () => {
    const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    
    if (!channelId) return '';

    switch (currentPlatform) {
      case Platform.Twitch:
        return `https://player.twitch.tv/?channel=${channelId}&parent=${parent}&muted=false`;
      case Platform.YouTube:
        return `https://www.youtube.com/embed?listType=user_uploads&list=${channelId}`; 
      case Platform.Kick:
        return `https://player.kick.com/${channelId}`;
      default:
        return '';
    }
  };

  const availablePlatforms = Object.keys(streamer.channels).map(k => k as Platform);

  return (
    <div 
      className="relative w-full h-full bg-neutral-900 overflow-hidden group border-r border-b border-white/5 last:border-r-0 last:border-b-0"
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onClick={toggleControls} // Better for mobile touch
    >
      {/* Platform Indicator Label (Top Left) - Always visible but subtle */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
        <div className={`
          px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded shadow-lg backdrop-blur-md border border-white/5
          ${currentPlatform === Platform.Twitch ? 'bg-twitch text-white' : ''}
          ${currentPlatform === Platform.YouTube ? 'bg-youtube text-white' : ''}
          ${currentPlatform === Platform.Kick ? 'bg-kick text-black' : ''}
        `}>
          {currentPlatform}
        </div>
      </div>

      {/* Video Player Container */}
      <div className="w-full h-full bg-black relative">
         {channelId ? (
            <iframe
              src={getEmbedUrl()}
              title={`${streamer.name} - ${currentPlatform}`}
              className="w-full h-full pointer-events-auto"
              allowFullScreen
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
         ) : (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10">
             <span className="text-4xl font-black uppercase tracking-widest">{streamer.name}</span>
             <span className="text-sm font-medium tracking-wider mt-2">Offline</span>
           </div>
         )}
      </div>

      {/* Cinematic Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-end"
          >
             {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

            {/* Content Container */}
            <div className="relative p-6 flex flex-col items-center justify-end h-full">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-black uppercase tracking-tighter text-white mb-6 drop-shadow-2xl"
              >
                {streamer.name}
              </motion.h2>

              <div className="pointer-events-auto">
                <PlatformSelector 
                  isOpen={true}
                  currentPlatform={currentPlatform}
                  availablePlatforms={availablePlatforms}
                  onSelect={onPlatformChange}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreamSlot;