import { useEffect, useState } from 'react';

export type BackdropPhase =
  | 'empty'
  | 'resume-only'
  | 'jd-only'
  | 'ready'
  | 'analyzing'
  | 'results';

interface DynamicBackdropProps {
  phase: BackdropPhase;
  matchScore?: number;
}

interface PaletteConfig {
  baseColor: string;
  primaryGlow: string;
  secondaryGlow: string;
  cursorGlow: string;
  gridColor: string;
}

function getPalette(phase: BackdropPhase, matchScore?: number): PaletteConfig {
  if (phase === 'results') {
    const score = matchScore ?? 0;
    if (score >= 80) {
      // Strong Match: Deep Forest Emerald (distinct from input)
      return {
        baseColor: '#051E19',
        primaryGlow: 'rgba(16, 185, 129, 0.24)',
        secondaryGlow: 'rgba(20, 184, 166, 0.16)',
        cursorGlow: 'rgba(52, 211, 153, 0.11)',
        gridColor: 'rgba(52, 211, 153, 0.06)',
      };
    }
    if (score >= 60) {
      // Good Potential: Deep Ocean Teal (distinct from input)
      return {
        baseColor: '#061D26',
        primaryGlow: 'rgba(20, 184, 166, 0.24)',
        secondaryGlow: 'rgba(56, 189, 248, 0.14)',
        cursorGlow: 'rgba(45, 212, 191, 0.11)',
        gridColor: 'rgba(45, 212, 191, 0.06)',
      };
    }
    if (score >= 40) {
      // Moderate Match: Deep Warm Amber-Bronze (distinct from input)
      return {
        baseColor: '#1E160A',
        primaryGlow: 'rgba(245, 158, 11, 0.22)',
        secondaryGlow: 'rgba(234, 88, 12, 0.13)',
        cursorGlow: 'rgba(251, 191, 36, 0.10)',
        gridColor: 'rgba(251, 191, 36, 0.05)',
      };
    }
    // Low Match: Deep Crimson-Plum (distinct from input)
    return {
      baseColor: '#210D14',
      primaryGlow: 'rgba(244, 63, 94, 0.22)',
      secondaryGlow: 'rgba(225, 29, 72, 0.13)',
      cursorGlow: 'rgba(251, 113, 133, 0.10)',
      gridColor: 'rgba(251, 113, 133, 0.05)',
    };
  }

  switch (phase) {
    case 'resume-only':
      // Candidate resume entered: Deep Sapphire Indigo
      return {
        baseColor: '#0D152E',
        primaryGlow: 'rgba(99, 102, 241, 0.22)',
        secondaryGlow: 'rgba(59, 130, 246, 0.15)',
        cursorGlow: 'rgba(129, 140, 248, 0.10)',
        gridColor: 'rgba(129, 140, 248, 0.055)',
      };
    case 'jd-only':
      // Job description entered: Deep Violet Slate
      return {
        baseColor: '#17112B',
        primaryGlow: 'rgba(139, 92, 246, 0.22)',
        secondaryGlow: 'rgba(168, 85, 247, 0.14)',
        cursorGlow: 'rgba(167, 139, 250, 0.10)',
        gridColor: 'rgba(167, 139, 250, 0.055)',
      };
    case 'ready':
      // Both resume & job description entered: Rich Indigo-Cobalt
      return {
        baseColor: '#10193B',
        primaryGlow: 'rgba(79, 70, 229, 0.28)',
        secondaryGlow: 'rgba(14, 165, 233, 0.18)',
        cursorGlow: 'rgba(99, 102, 241, 0.12)',
        gridColor: 'rgba(165, 180, 252, 0.065)',
      };
    case 'analyzing':
      // Active Gemini evaluation: Brightened Royal Indigo
      return {
        baseColor: '#121E48',
        primaryGlow: 'rgba(99, 102, 241, 0.34)',
        secondaryGlow: 'rgba(56, 189, 248, 0.22)',
        cursorGlow: 'rgba(129, 140, 248, 0.14)',
        gridColor: 'rgba(165, 180, 252, 0.075)',
      };
    case 'empty':
    default:
      // Initial empty state: Deep Neutral Charcoal-Slate
      return {
        baseColor: '#0B1120',
        primaryGlow: 'rgba(71, 85, 105, 0.20)',
        secondaryGlow: 'rgba(99, 102, 241, 0.10)',
        cursorGlow: 'rgba(148, 163, 184, 0.08)',
        gridColor: 'rgba(148, 163, 184, 0.045)',
      };
  }
}

export function DynamicBackdrop({ phase, matchScore }: DynamicBackdropProps) {
  const [cursor, setCursor] = useState({ x: 50, y: 30 });
  const palette = getPalette(phase, matchScore);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let rafId = 0;
    let targetX = 50;
    let targetY = 30;

    const handlePointerMove = (e: PointerEvent) => {
      targetX = Math.round((e.clientX / window.innerWidth) * 100);
      targetY = Math.round((e.clientY / window.innerHeight) * 100);
      if (!rafId) {
        rafId = window.requestAnimationFrame(() => {
          setCursor({ x: targetX, y: targetY });
          rafId = 0;
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-700 ease-out"
      style={{ backgroundColor: palette.baseColor }}
    >
      {/* Top-left & bottom-right atmospheric radial glows that shift with user details */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          backgroundImage: `radial-gradient(60% 50% at 15% 15%, ${palette.primaryGlow}, transparent 70%), radial-gradient(55% 45% at 85% 85%, ${palette.secondaryGlow}, transparent 70%)`,
        }}
      />

      {/* Subtle 2D architectural dot-grid texture */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          backgroundImage: `radial-gradient(${palette.gridColor} 1.25px, transparent 1.25px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Soft 2D pointer spotlight */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(520px circle at ${cursor.x}% ${cursor.y}%, ${palette.cursorGlow}, transparent 65%)`,
        }}
      />
    </div>
  );
}
