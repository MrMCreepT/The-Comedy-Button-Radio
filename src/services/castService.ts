import { Episode } from '../types';
import { getArtworkUrl } from '../utils/assets';

// Global Cast declarations
declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: any;
    chrome?: any;
    WebKitPlaybackTargetAvailabilityEvent?: any;
  }
}

export type CastType = 'google-cast' | 'airplay' | 'remote-playback' | null;

export interface CastDisplayOptions {
  showHosts: boolean;
  showEpisodeNumber: boolean;
  showSubtitle: boolean;
  backdropTheme: 'crimson' | 'dark' | 'glass';
}

export interface CastSessionState {
  isAvailable: boolean;
  isGoogleCastAvailable: boolean;
  isAirPlayAvailable: boolean;
  isRemotePlaybackAvailable: boolean;
  isCasting: boolean;
  castDeviceName: string | null;
  castType: CastType;
  displayOptions: CastDisplayOptions;
}

type StateListener = (state: CastSessionState) => void;

class CastService {
  private displayOptions: CastDisplayOptions = {
    showHosts: true,
    showEpisodeNumber: true,
    showSubtitle: true,
    backdropTheme: 'crimson',
  };

  private state: CastSessionState = {
    isAvailable: false,
    isGoogleCastAvailable: false,
    isAirPlayAvailable: false,
    isRemotePlaybackAvailable: false,
    isCasting: false,
    castDeviceName: null,
    castType: null,
    displayOptions: {
      showHosts: true,
      showEpisodeNumber: true,
      showSubtitle: true,
      backdropTheme: 'crimson',
    },
  };

  private listeners = new Set<StateListener>();
  private audioElement: HTMLAudioElement | null = null;
  private currentCastSession: any = null;
  private remotePlayer: any = null;
  private remotePlayerController: any = null;
  private currentEpisode: Episode | null = null;

  constructor() {
    this.detectAirPlayAndRemotePlayback();
    this.initGoogleCast();
  }

  public registerAudioElement(audio: HTMLAudioElement) {
    this.audioElement = audio;

    // Check AirPlay on audio element
    if ('webkitShowPlaybackTargetPicker' in audio) {
      this.state.isAirPlayAvailable = true;
      audio.setAttribute('x-webkit-airplay', 'allow');

      audio.addEventListener('webkitplaybacktargetavailabilitychanged', (event: any) => {
        const available = event.availability === 'available';
        this.updateState({
          isAirPlayAvailable: available,
          isAvailable: available || this.state.isGoogleCastAvailable || this.state.isRemotePlaybackAvailable
        });
      });

      audio.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', () => {
        const isWireless = (audio as any).webkitCurrentPlaybackTargetIsWireless;
        if (isWireless) {
          this.updateState({
            isCasting: true,
            castType: 'airplay',
            castDeviceName: 'AirPlay Speaker'
          });
        } else if (this.state.castType === 'airplay') {
          this.updateState({
            isCasting: false,
            castType: null,
            castDeviceName: null
          });
        }
      });
    }

    // Check W3C Remote Playback API
    if ('remote' in audio && (audio as any).remote) {
      const remote = (audio as any).remote;
      this.state.isRemotePlaybackAvailable = true;

      try {
        remote.watchAvailability((available: boolean) => {
          this.updateState({
            isRemotePlaybackAvailable: available,
            isAvailable: available || this.state.isGoogleCastAvailable || this.state.isAirPlayAvailable
          });
        }).catch(() => {});
      } catch {}

      remote.addEventListener('connect', () => {
        this.updateState({
          isCasting: true,
          castType: 'remote-playback',
          castDeviceName: 'Remote Device'
        });
      });

      remote.addEventListener('disconnect', () => {
        if (this.state.castType === 'remote-playback') {
          this.updateState({
            isCasting: false,
            castType: null,
            castDeviceName: null
          });
        }
      });
    }
  }

  private detectAirPlayAndRemotePlayback() {
    if (typeof window === 'undefined') return;

    const isAirPlay = Boolean(
      window.WebKitPlaybackTargetAvailabilityEvent ||
      (HTMLAudioElement && 'webkitShowPlaybackTargetPicker' in HTMLAudioElement.prototype)
    );

    const isRemote = Boolean(
      HTMLAudioElement && 'remote' in HTMLAudioElement.prototype
    );

    this.state.isAirPlayAvailable = isAirPlay;
    this.state.isRemotePlaybackAvailable = isRemote;
    this.state.isAvailable = isAirPlay || isRemote;
  }

  private initGoogleCast() {
    if (typeof window === 'undefined') return;

    const setupCastFramework = () => {
      try {
        if (!window.cast?.framework || !window.chrome?.cast) return;

        const context = window.cast.framework.CastContext.getInstance();
        context.setOptions({
          receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        });

        this.remotePlayer = new window.cast.framework.RemotePlayer();
        this.remotePlayerController = new window.cast.framework.RemotePlayerController(this.remotePlayer);

        this.remotePlayerController.addEventListener(
          window.cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED,
          () => {
            const isConnected = this.remotePlayer.isConnected;
            if (isConnected) {
              const session = context.getCurrentSession();
              this.currentCastSession = session;
              const deviceName = session?.getCastDevice()?.friendlyName || 'Google Cast Device';
              this.updateState({
                isCasting: true,
                castType: 'google-cast',
                castDeviceName: deviceName
              });
              // Load currently playing media if available
              if (this.currentEpisode && this.audioElement) {
                this.loadMediaOnCast(this.currentEpisode, this.audioElement.currentTime, !this.audioElement.paused);
              }
            } else {
              this.currentCastSession = null;
              if (this.state.castType === 'google-cast') {
                this.updateState({
                  isCasting: false,
                  castType: null,
                  castDeviceName: null
                });
              }
            }
          }
        );

        context.addEventListener(
          window.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
          (event: any) => {
            const isAvailable = event.castState !== window.cast.framework.CastState.NO_DEVICES_AVAILABLE;
            this.updateState({
              isGoogleCastAvailable: isAvailable,
              isAvailable: isAvailable || this.state.isAirPlayAvailable || this.state.isRemotePlaybackAvailable
            });
          }
        );

        this.updateState({
          isGoogleCastAvailable: true,
          isAvailable: true
        });
      } catch (err) {
        console.warn('Cast framework initialization deferred:', err);
      }
    };

    if (window.cast?.framework) {
      setupCastFramework();
    } else {
      window.__onGCastApiAvailable = (isAvailable: boolean) => {
        if (isAvailable) {
          setupCastFramework();
        }
      };
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public getState(): CastSessionState {
    return this.state;
  }

  private updateState(partial: Partial<CastSessionState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(fn => fn(this.state));
  }

  public setCurrentEpisode(episode: Episode | null) {
    this.currentEpisode = episode;
  }

  public async requestCast(): Promise<boolean> {
    // 1. Try Google Cast first if available
    if (this.state.isGoogleCastAvailable && window.cast?.framework) {
      try {
        const context = window.cast.framework.CastContext.getInstance();
        await context.requestSession();
        return true;
      } catch (e: any) {
        if (e !== 'cancel') {
          console.warn('Google Cast request error:', e);
        }
      }
    }

    // 2. Try Apple AirPlay on audio element
    if (this.audioElement && 'webkitShowPlaybackTargetPicker' in this.audioElement) {
      try {
        (this.audioElement as any).webkitShowPlaybackTargetPicker();
        return true;
      } catch (e) {
        console.warn('AirPlay prompt error:', e);
      }
    }

    // 3. Try W3C Remote Playback API
    if (this.audioElement && 'remote' in this.audioElement && (this.audioElement as any).remote?.prompt) {
      try {
        await (this.audioElement as any).remote.prompt();
        return true;
      } catch (e: any) {
        if (e.name !== 'NotFoundError' && e.name !== 'AbortError') {
          console.warn('Remote playback prompt error:', e);
        }
      }
    }

    return false;
  }

  public async triggerAirPlay(): Promise<boolean> {
    if (this.audioElement && 'webkitShowPlaybackTargetPicker' in this.audioElement) {
      try {
        (this.audioElement as any).webkitShowPlaybackTargetPicker();
        return true;
      } catch (e) {
        console.error('AirPlay picker failed:', e);
      }
    }
    return false;
  }

  public async triggerGoogleCast(): Promise<boolean> {
    if (window.cast?.framework) {
      try {
        const context = window.cast.framework.CastContext.getInstance();
        await context.requestSession();
        return true;
      } catch (e) {
        console.warn('Google Cast picker cancelled or failed:', e);
      }
    }
    return false;
  }

  public async triggerRemotePlayback(): Promise<boolean> {
    if (this.audioElement && 'remote' in this.audioElement && (this.audioElement as any).remote?.prompt) {
      try {
        await (this.audioElement as any).remote.prompt();
        return true;
      } catch (e) {
        console.warn('Remote playback picker failed:', e);
      }
    }
    return false;
  }

  public endCast() {
    if (this.state.castType === 'google-cast' && window.cast?.framework) {
      try {
        const context = window.cast.framework.CastContext.getInstance();
        context.endCurrentSession(true);
      } catch (e) {
        console.warn('Error ending Cast session:', e);
      }
    }

    this.updateState({
      isCasting: false,
      castDeviceName: null,
      castType: null
    });
  }

  public setDisplayOptions(newOptions: Partial<CastDisplayOptions>) {
    this.displayOptions = { ...this.displayOptions, ...newOptions };
    this.updateState({
      displayOptions: { ...this.displayOptions }
    });
    // If currently casting, update active media presentation
    if (this.currentEpisode && this.state.isCasting && this.state.castType === 'google-cast') {
      const currentTime = this.audioElement ? this.audioElement.currentTime : 0;
      const isPlaying = this.audioElement ? !this.audioElement.paused : true;
      this.loadMediaOnCast(this.currentEpisode, currentTime, isPlaying);
    }
  }

  public getDisplayOptions(): CastDisplayOptions {
    return this.displayOptions;
  }

  public loadMediaOnCast(episode: Episode, currentTimeSeconds: number = 0, isPlaying: boolean = true) {
    if (!this.state.isCasting || this.state.castType !== 'google-cast') return;
    if (!window.chrome?.cast || !window.cast?.framework) return;

    try {
      const context = window.cast.framework.CastContext.getInstance();
      const session = context.getCurrentSession();
      if (!session) return;

      const mediaInfo = new window.chrome.cast.media.MediaInfo(episode.audioUrl, 'audio/mp3');
      mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = episode.title || 'The Comedy Button';

      // Build customized subtitle according to user cast presentation preferences
      const subtitleParts: string[] = [];
      if (this.displayOptions.showEpisodeNumber && episode.episodeNumber) {
        subtitleParts.push(`Episode ${episode.episodeNumber}`);
      } else {
        subtitleParts.push('The Comedy Button');
      }
      if (this.displayOptions.showHosts) {
        subtitleParts.push('Scott Bromley, Brian Altano, Ryan Scott, Max Scoville');
      }
      mediaInfo.metadata.subtitle = subtitleParts.join(' • ');
      mediaInfo.metadata.studio = 'The Comedy Button';

      const artwork = getArtworkUrl(episode.imageUrl);
      mediaInfo.metadata.images = [{ url: artwork }];

      const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
      request.currentTime = Math.max(0, currentTimeSeconds);
      request.autoplay = isPlaying;

      session.loadMedia(request).then(
        () => {
          // If Cast is playing, pause local audio to prevent echo
          if (this.audioElement) {
            this.audioElement.pause();
          }
        },
        (err: any) => console.error('Cast loadMedia failed:', err)
      );
    } catch (e) {
      console.error('Error loading media to Cast receiver:', e);
    }
  }

  public syncPlayPause(isPlaying: boolean) {
    if (this.state.isCasting && this.state.castType === 'google-cast' && this.remotePlayerController) {
      try {
        this.remotePlayerController.playOrPause();
      } catch (e) {
        console.warn('Sync play/pause to Cast failed:', e);
      }
    }
  }

  public syncSeek(seconds: number) {
    if (this.state.isCasting && this.state.castType === 'google-cast' && this.remotePlayer) {
      try {
        this.remotePlayer.currentTime = seconds;
        this.remotePlayerController.seek();
      } catch (e) {
        console.warn('Sync seek to Cast failed:', e);
      }
    }
  }

  public syncVolume(volumePercent: number) {
    if (this.state.isCasting && this.state.castType === 'google-cast' && this.remotePlayer) {
      try {
        this.remotePlayer.volumeLevel = volumePercent;
        this.remotePlayerController.setVolumeLevel();
      } catch (e) {
        console.warn('Sync volume to Cast failed:', e);
      }
    }
  }
}

export const castService = new CastService();
