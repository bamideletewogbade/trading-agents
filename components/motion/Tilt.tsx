'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * A card that leans toward the pointer, with a gold light where the pointer
 * is (the `tilt` and `glare` utilities in app/globals.css read the angles
 * and the position from CSS variables set here).
 *
 * Only for a mouse or trackpad: on a touch screen a finger is already on the
 * card, and a card that tips under it makes the tap land somewhere else.
 * Anyone who asked for less motion gets a still card. Pure decoration, so
 * nothing about what the card says or does changes.
 */
export function Tilt({
  children,
  className = '',
  max = 8,
  glare = true,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  /** The steepest lean, in degrees. */
  max?: number;
  glare?: boolean;
  as?: 'div' | 'li';
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || calm.matches) return;

    let frame = 0;
    let rect: DOMRect | null = null;
    const move = (event: PointerEvent) => {
      rect ??= el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.setAttribute('data-tilting', '');
        el.style.setProperty('--ry', `${((x - 0.5) * max * 2).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - y) * max * 2).toFixed(2)}deg`);
        el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      rect = null;
      el.removeAttribute('data-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    // The card may have moved since the last visit (a scroll, a resize).
    const enter = () => {
      rect = el.getBoundingClientRect();
    };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [max]);

  return (
    <Tag
      ref={ref as never}
      className={`tilt ${glare ? 'glare' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}
