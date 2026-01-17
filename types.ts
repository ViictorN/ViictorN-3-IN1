export enum Platform {
  Twitch = 'Twitch',
  YouTube = 'YouTube',
  Kick = 'Kick',
}

export interface StreamerConfig {
  id: string;
  name: string;
  avatarUrl: string; // Placeholder for now
  channels: {
    [key in Platform]?: string; // Channel ID/Username per platform
  };
  defaultPlatform: Platform;
  color: string; // Brand accent color
}

export interface StreamState {
  platform: Platform;
  isMuted: boolean;
}

export interface AppSettings {
  performanceMode: boolean; // Disables ambient animations
  cinemaMode: boolean; // Dims UI and hides chat
  chatWidth: number;
}

// Map of streamer ID to their current state
export type MultiStreamState = Record<string, StreamState>;