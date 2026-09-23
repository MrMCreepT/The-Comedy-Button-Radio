/**
 * Web Audio API Engine for Voice Boost & Dynamic Range Compressor
 * Enhances dialogue clarity, vocal presence, and equalizes loudness over ambient noise.
 */

class AudioEffectsEngine {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private vocalBoostFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private gainNode: GainNode | null = null;
  private attachedElement: HTMLAudioElement | null = null;
  private isEnabled: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('cb_voice_boost');
      this.isEnabled = saved === 'true';
    } catch {}
  }

  public getVoiceBoost(): boolean {
    return this.isEnabled;
  }

  public setVoiceBoost(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('cb_voice_boost', String(enabled));
    } catch {}
    this.applyNodeParameters();
  }

  public toggleVoiceBoost(): boolean {
    this.setVoiceBoost(!this.isEnabled);
    return this.isEnabled;
  }

  public init(audioElement: HTMLAudioElement) {
    if (this.attachedElement === audioElement && this.isInitialized) {
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }

      this.attachedElement = audioElement;

      // Only attach createMediaElementSource if not already created
      if (!this.sourceNode) {
        try {
          this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);
        } catch (sourceErr) {
          // If already connected or CORS blocked, handle gracefully
          console.warn('MediaElementSource initialization note:', sourceErr);
          return;
        }
      }

      // 1. Highpass filter to eliminate sub-bass rumble (< 85Hz)
      this.highpassFilter = this.audioCtx.createBiquadFilter();
      this.highpassFilter.type = 'highpass';

      // 2. Peaking filter centered around vocal intelligibility range (2.6 kHz)
      this.vocalBoostFilter = this.audioCtx.createBiquadFilter();
      this.vocalBoostFilter.type = 'peaking';
      this.vocalBoostFilter.frequency.value = 2600;
      this.vocalBoostFilter.Q.value = 1.3;

      // 3. Dynamic range compressor: equalizes volume peaks & whispers
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.attack.value = 0.005;
      this.compressor.release.value = 0.22;
      this.compressor.knee.value = 25;

      // 4. Makeup gain node
      this.gainNode = this.audioCtx.createGain();

      // Connect DSP chain: Source -> Highpass -> Vocal Peaking -> Compressor -> Makeup Gain -> Speakers
      this.sourceNode.connect(this.highpassFilter);
      this.highpassFilter.connect(this.vocalBoostFilter);
      this.vocalBoostFilter.connect(this.compressor);
      this.compressor.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.applyNodeParameters();
      this.isInitialized = true;
    } catch (err) {
      console.warn('Web Audio initialization bypassed:', err);
    }
  }

  public resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  private applyNodeParameters() {
    if (!this.audioCtx || !this.isInitialized) return;

    try {
      const now = this.audioCtx.currentTime;

      if (this.isEnabled) {
        // High-pass filter cuts unwanted rumble below 85Hz
        if (this.highpassFilter) {
          this.highpassFilter.frequency.setTargetAtTime(85, now, 0.05);
        }
        // Boost human speech presence +4.5dB
        if (this.vocalBoostFilter) {
          this.vocalBoostFilter.gain.setTargetAtTime(4.5, now, 0.05);
        }
        // Tight dialogue dynamic range compression
        if (this.compressor) {
          this.compressor.threshold.setTargetAtTime(-24, now, 0.05);
          this.compressor.ratio.setTargetAtTime(5.0, now, 0.05);
        }
        // Makeup gain to level loudness over car engine/traffic noise
        if (this.gainNode) {
          this.gainNode.gain.setTargetAtTime(1.25, now, 0.05);
        }
      } else {
        // Transparent flat response (bypassed)
        if (this.highpassFilter) {
          this.highpassFilter.frequency.setTargetAtTime(15, now, 0.05);
        }
        if (this.vocalBoostFilter) {
          this.vocalBoostFilter.gain.setTargetAtTime(0, now, 0.05);
        }
        if (this.compressor) {
          this.compressor.threshold.setTargetAtTime(-3, now, 0.05);
          this.compressor.ratio.setTargetAtTime(1.0, now, 0.05);
        }
        if (this.gainNode) {
          this.gainNode.gain.setTargetAtTime(1.0, now, 0.05);
        }
      }
    } catch (e) {
      console.warn('Error adjusting audio nodes:', e);
    }
  }
}

export const audioEffects = new AudioEffectsEngine();
