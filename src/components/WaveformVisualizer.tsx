import React, { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  currentTime: number;
  duration?: number;
  className?: string;
  barCount?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  currentTime,
  className = '',
  barCount = 38
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const currentAmplitudesRef = useRef<number[]>(new Array(barCount).fill(0.08));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    const resize = () => {
      if (!canvas) return;
      dpr = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (width <= 0 || height <= 0) return;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // Check prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    let phase = currentTime * 2.5;

    const render = () => {
      if (width <= 0 || height <= 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      phase += isPlaying ? 0.07 : 0.01;

      // Update bar target amplitudes
      const targetAmplitudes: number[] = [];
      for (let i = 0; i < barCount; i++) {
        const normalizedIdx = i / barCount;
        if (isPlaying && !prefersReducedMotion) {
          // Dynamic harmonic Fourier synthesis simulation
          const wave1 = Math.sin(phase * 1.8 + i * 0.42);
          const wave2 = Math.cos(phase * 0.9 - i * 0.28);
          const wave3 = Math.sin(phase * 3.2 + i * 0.85) * 0.4;
          const centerWeight = 1 - Math.abs(normalizedIdx - 0.5) * 0.6; // Higher in center/mid frequencies
          const rawAmp = (Math.abs(wave1 * 0.5 + wave2 * 0.35 + wave3 * 0.15) * 0.85 + 0.12) * centerWeight;
          targetAmplitudes.push(Math.min(0.96, Math.max(0.08, rawAmp)));
        } else {
          // Idle ambient gentle breathing wave when paused
          const idleWave = Math.sin(phase * 0.6 + i * 0.3) * 0.04 + 0.08;
          targetAmplitudes.push(idleWave);
        }
      }

      // Smooth interpolation (lerp) for liquid fluid motion
      const lerpSpeed = isPlaying ? 0.18 : 0.08;
      const current = currentAmplitudesRef.current;
      for (let i = 0; i < barCount; i++) {
        current[i] = current[i] + (targetAmplitudes[i] - current[i]) * lerpSpeed;
      }

      // Draw symmetric vertical waveform bars
      const totalWidth = width;
      const gap = Math.max(2, Math.floor(totalWidth / (barCount * 4)));
      const barWidth = Math.max(2.5, (totalWidth - (barCount - 1) * gap) / barCount);
      const centerY = height / 2;

      // Create vertical dynamic gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#f59e0b'); // Warm amber peak
      gradient.addColorStop(0.3, '#ef4444'); // Crimson mid
      gradient.addColorStop(0.7, '#dc2626'); // Deep red center
      gradient.addColorStop(1, '#f59e0b'); // Bottom amber

      ctx.fillStyle = gradient;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        const amp = current[i];
        const barHeight = Math.max(4, amp * height * 0.88);
        const y = centerY - barHeight / 2;
        const radius = Math.min(barWidth / 2, 3);

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, radius);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      observer.disconnect();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, barCount]);

  return (
    <div className={`relative w-full overflow-hidden flex items-center justify-center select-none ${className}`}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="w-full h-full block"
      />
    </div>
  );
};
