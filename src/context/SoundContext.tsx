import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playAddToCartSound: () => void;
  playFavoriteSound: () => void;
  playOrderPlacedSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    // Disabled by default as requested in prompt:
    // "Keep sound disabled by default until the user enables it. Provide a persistent mute toggle."
    const saved = localStorage.getItem('app_sound_enabled');
    return saved !== 'true'; // Muted by default
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = (): AudioContext | null => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('app_sound_enabled', (!next).toString());
      return next;
    });
  };

  // 1. Subtle, appetizing Add to Cart chime
  const playAddToCartSound = () => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // Audio playback fails silently if browser blocks
    }
  };

  // 2. Playful favorite toggle pop
  const playFavoriteSound = () => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.21);
    } catch {}
  };

  // 3. Satisfying order placed celebratory arpeggio
  const playOrderPlacedSound = () => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const start = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const noteTime = start + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.1, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.26);
      });
    } catch {}
  };

  return (
    <SoundContext.Provider
      value={{
        isMuted,
        toggleMute,
        playAddToCartSound,
        playFavoriteSound,
        playOrderPlacedSound,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
