import { useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  withSound?: boolean;
}

export const useConfetti = () => {
  const { playCelebration, playSuccess, playPop } = useSoundEffects();

  const triggerConfetti = useCallback((options: ConfettiOptions = {}) => {
    const { withSound = true, ...confettiOptions } = options;
    const defaults = {
      particleCount: 100,
      spread: 70,
      startVelocity: 30,
      decay: 0.95,
      scalar: 1.2,
      colors: ['#8B5CF6', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4'],
      ...confettiOptions,
    };

    if (withSound) {
      playPop();
    }

    confetti({
      ...defaults,
      origin: { x: 0.5, y: 0.6 },
    });
  }, [playPop]);

  const triggerCelebration = useCallback((withSound: boolean = true) => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    if (withSound) {
      playCelebration();
    }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2,
        },
        colors: ['#8B5CF6', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4'],
      });
    }, 250);
  }, [playCelebration]);

  const triggerFireworks = useCallback((withSound: boolean = true) => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;

    if (withSound) {
      playSuccess();
      // Additional sounds during fireworks
      setTimeout(() => playCelebration(), 1000);
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#8B5CF6', '#22C55E', '#F59E0B'],
      });

      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#EC4899', '#06B6D4', '#8B5CF6'],
      });
    }, 400);

    setTimeout(() => clearInterval(interval), duration);
  }, [playSuccess, playCelebration]);

  return { triggerConfetti, triggerCelebration, triggerFireworks };
};

// Reusable success animation component
export const SuccessCheckmark = ({ show, onComplete }: { show: boolean; onComplete?: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      <div className="relative">
        <svg
          className="w-24 h-24 animate-success-checkmark"
          viewBox="0 0 52 52"
        >
          <circle
            className="stroke-income fill-none animate-success-circle"
            cx="26"
            cy="26"
            r="24"
            strokeWidth="3"
          />
          <path
            className="stroke-income fill-none animate-success-check"
            d="M14.1 27.2l7.1 7.2 16.7-16.8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="absolute inset-0 animate-success-ring rounded-full border-4 border-income/30" />
      </div>
    </div>
  );
};
