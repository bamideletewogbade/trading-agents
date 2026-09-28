'use client';

import { useEffect, useRef } from 'react';

/**
 * A soft gold light that follows the pointer across its section, as if you
 * were holding a torch over the chart paper. Sits behind the words, a mouse
 * or trackpad only, and never for anyone who asked for less motion.
 */
export function PointerGlow({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    const area = el?.parentElement;
    if (!el || !area) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || calm.matches) return;

    let frame = 0;
    const move = (event: PointerEvent) => {
      const rect = area.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--gx', `${x}px`);
        el.style.setProperty('--gy', `${y}px`);
        el.style.opacity = '1';
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      el.style.opacity = '0';
    };
    area.addEventListener('pointermove', move);
    area.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ${className}`}
      style={{
        background:
          'radial-gradient(520px circle at var(--gx, 50%) var(--gy, 30%), color-mix(in srgb, var(--color-gold) 9%, transparent), transparent 65%)',
      }}
    />
  );
}
