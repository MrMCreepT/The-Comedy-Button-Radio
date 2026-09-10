// Client-side Web Audio Slicer and Formatter

export function formatTimeSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

// Slice an audio stream/file between startSec and endSec safely without memory exhaustion
export async function sliceAudio(
  audioSourceUrl: string,
  startSec: number,
  endSec: number,
  onProgress?: (percent: number, status: string) => void,
  clipTitle?: string
): Promise<Blob> {
  if (endSec <= startSec) {
    throw new Error('End time must be greater than start time');
  }

  onProgress?.(15, 'Connecting to audio slicing engine...');

  try {
    // Primary method: Fast, memory-safe server-side FFmpeg slicing (zero browser memory bloat)
    onProgress?.(45, 'Precision trimming audio segment...');
    const params = new URLSearchParams({
      url: audioSourceUrl,
      start: String(startSec),
      end: String(endSec),
      title: clipTitle || 'comedy_button_clip'
    });

    const response = await fetch(`/api/audio/slice?${params.toString()}`);
    if (response.ok) {
      onProgress?.(85, 'Downloading trimmed MP3 clip...');
      const blob = await response.blob();
      if (blob.size > 1000) {
        onProgress?.(100, 'Audio clip ready!');
        return blob;
      }
    }
  } catch (serverSliceErr) {
    console.warn('Server FFmpeg slice failed or unavailable, checking fallback:', serverSliceErr);
  }

  // Fallback: Client-side Web Audio API (used only for small audio files < 15MB to prevent browser crash)
  onProgress?.(30, 'Preparing client-side audio decoder...');
  const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(audioSourceUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Failed to load audio: HTTP ${response.status}`);
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 25 * 1024 * 1024) {
    throw new Error('Episode audio is too large for browser memory decoding. Please use the server-side clip engine.');
  }

  onProgress?.(50, 'Decoding audio samples...');
  const arrayBuffer = await response.arrayBuffer();

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const decodedAudio = await audioCtx.decodeAudioData(arrayBuffer);

  const duration = decodedAudio.duration;
  const safeStart = Math.max(0, Math.min(startSec, duration));
  const safeEnd = Math.min(endSec, duration);
  const clipDuration = safeEnd - safeStart;

  if (clipDuration <= 0) {
    throw new Error('Invalid clip duration');
  }

  onProgress?.(70, 'Rendering trimmed audio...');
  const sampleRate = decodedAudio.sampleRate;
  const numberOfChannels = decodedAudio.numberOfChannels;
  const frameCount = Math.floor(clipDuration * sampleRate);

  const offlineCtx = new OfflineAudioContext(numberOfChannels, frameCount, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decodedAudio;

  source.connect(offlineCtx.destination);
  source.start(0, safeStart, clipDuration);

  const renderedBuffer = await offlineCtx.startRendering();

  onProgress?.(90, 'Encoding audio file...');
  const wavBlob = audioBufferToWav(renderedBuffer);

  onProgress?.(100, 'Audio clip ready!');
  return wavBlob;
}

// Convert AudioBuffer to standard WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const bufferLength = 44 + length;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write interleaved PCM samples
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i];
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
