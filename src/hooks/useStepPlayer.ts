import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnimationSpeed } from '../types';

export const SPEED_MS: Record<AnimationSpeed, number> = { slow: 1800, normal: 1000, fast: 420 };

export interface StepPlayer {
  step: number;
  total: number;
  playing: boolean;
  started: boolean;
  speed: AnimationSpeed;
  isEnd: boolean;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  goTo: (s: number) => void;
  setSpeed: (s: AnimationSpeed) => void;
}

/**
 * Bosqichma-bosqich animatsiya boshqaruvchisi: play / pause / resume / next / prev / reset / speed.
 * `total` o‘zgarsa (masalan, parametr o‘zgarib model qayta qurilsa) bosqich chegaraga keltiriladi.
 */
export function useStepPlayer(total: number, opts: { initialStep?: number; resetKey?: unknown } = {}): StepPlayer {
  const { initialStep = 0, resetKey } = opts;
  const [step, setStep] = useState(initialStep);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(initialStep > 0);
  const [speed, setSpeed] = useState<AnimationSpeed>('normal');
  const timer = useRef<number | null>(null);
  const last = Math.max(0, total - 1);

  useEffect(() => {
    setStep((s) => Math.min(s, last));
  }, [last]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Parametr o‘zgarganda animatsiya to‘xtaydi va qayta hisoblangan yakuniy holat ko‘rsatiladi
    setPlaying(false);
    setStarted(false);
    setStep(initialStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    if (!playing) return;
    if (step >= last) {
      setPlaying(false);
      return;
    }
    timer.current = window.setTimeout(() => setStep((s) => Math.min(s + 1, last)), SPEED_MS[speed]);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [playing, step, last, speed]);

  const play = useCallback(() => {
    setStarted(true);
    setStep((s) => (s >= last ? 0 : s));
    setPlaying(true);
  }, [last]);
  const pause = useCallback(() => setPlaying(false), []);
  const next = useCallback(() => {
    setStarted(true);
    setPlaying(false);
    setStep((s) => Math.min(s + 1, last));
  }, [last]);
  const prev = useCallback(() => {
    setPlaying(false);
    setStep((s) => Math.max(s - 1, 0));
  }, []);
  const reset = useCallback(() => {
    setPlaying(false);
    setStarted(false);
    setStep(0);
  }, []);
  const goTo = useCallback(
    (s: number) => {
      setStarted(true);
      setPlaying(false);
      setStep(Math.max(0, Math.min(s, last)));
    },
    [last],
  );

  return { step, total, playing, started, speed, isEnd: step >= last, play, pause, next, prev, reset, goTo, setSpeed };
}
