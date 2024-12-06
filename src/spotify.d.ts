declare namespace Spotify {
  interface Player {
    new (options: PlayerOptions): Player;
    connect(): Promise<boolean>;
    addListener(event: string, callback: (data: any) => void): boolean;
    removeListener(event: string, callback?: (data: any) => void): boolean;
  }

  interface PlayerOptions {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
  }

  interface PlaybackState {
    context: {
      uri: string;
      metadata: Record<string, any>;
    };
    position: number;
    duration: number;
    paused: boolean;
    shuffle: boolean;
    repeat_mode: number;
  }

  interface PlaybackError {
    message: string;
  }

  interface ReadyDevice {
    device_id: string;
  }

  interface NotReadyDevice {
    device_id: string;
  }
}
