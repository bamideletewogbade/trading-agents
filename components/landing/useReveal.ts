'use client';

import { useEffect, useState } from 'react';

/**
 * Counts from 0 to `total` over `ms` for run number `run` (0 means nothing
 * is running), for revealing a market one step at a time. Motion here *is*
 * the lesson (the path, not the ending), but anyone who asked for less
 * motion gets the whole thing on the first frame.
 *
 * Progress is tagged with its run, so a new run starts from 0 without
 * resetting state inside the effect.
 */
export function useReveal(total: number, run: number, ms = 2400): number {
  const [progress, setProgress] = useState({ run: 0, shown: 0 });

  useEffect(() => {
    if (run === 0) return;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const shown = reduce
        ? total
        : Math.min(total, Math.ceil(((now - start) / ms) * total));
      setProgress({ run, shown });
      if (shown < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [total, run, ms]);

  return run !== 0 && progress.run === run ? progress.shown : 0;
}
