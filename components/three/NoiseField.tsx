'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createRng } from '@/lib/core/rng';

/**
 * The hero's picture of the whole product idea: a field of candles
 * flickering up and down (noise), and one gold line drawing itself through
 * them (signal). Decoration with a meaning, which is the only kind the spec
 * allows (§63).
 *
 * The 3D version is three.js, loaded only after the page is idle, and only
 * on a phone that can afford it (CLAUDE.md rule 8). Everyone else gets the
 * same picture drawn flat in SVG: anyone who asked for less motion, anyone
 * on Save-Data, a phone reporting under 4 GB of memory, or no WebGL. The SVG
 * is also what the server renders, so the hero never waits on the 3D.
 *
 * Nothing here is a number anyone reads. The flicker is decorative, which is
 * why it may use Math.sin; the lessons' numbers come from lib/engines.
 */

type Mode = 'flat' | 'webgl';

function canAfford3d(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return false;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

let afford: boolean | null = null;
const noop = () => () => {};
const clientMode = (): Mode => {
  afford ??= canAfford3d();
  return afford ? 'webgl' : 'flat';
};
const serverMode = (): Mode => 'flat';

export function NoiseField({ className = '' }: { className?: string }) {
  const mode = useSyncExternalStore(noop, clientMode, serverMode);
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden>
      {mode === 'webgl' ? <Scene /> : <FlatField />}
    </div>
  );
}

/* ── The flat version ──────────────────────────────────────────────────── */

const FLAT = (() => {
  const rng = createRng('hero-field');
  const rows = [
    { y: 150, count: 34, scale: 1, opacity: 0.55 },
    { y: 190, count: 30, scale: 1.25, opacity: 0.75 },
    { y: 236, count: 26, scale: 1.5, opacity: 0.95 },
  ];
  return rows.map((row) => ({
    ...row,
    bars: Array.from({ length: row.count }, (_, i) => ({
      x: (i + 0.5) * (600 / row.count),
      h: rng.int(8, 46) * row.scale,
      up: rng.int(0, 9) > 5,
    })),
  }));
})();

function FlatField() {
  return (
    <svg
      viewBox="0 0 600 260"
      preserveAspectRatio="xMidYMax slice"
      className="size-full"
    >
      {FLAT.map((row) =>
        row.bars.map((bar) => (
          <rect
            key={`${row.y}-${bar.x}`}
            x={bar.x - 2 * row.scale}
            y={row.y - bar.h}
            width={4 * row.scale}
            height={bar.h}
            rx={1}
            className={bar.up ? 'fill-baseline' : 'fill-line'}
            opacity={row.opacity}
          />
        )),
      )}
      <path
        d="M-10 214 C 90 206, 150 196, 220 176 S 360 140, 430 118 S 560 70, 620 52"
        className="fill-none stroke-gold"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── The 3D version ────────────────────────────────────────────────────── */

function Scene() {
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      const THREE = await import('three');
      if (disposed) return;

      const css = getComputedStyle(document.documentElement);
      const token = (name: string, fallback: string) =>
        css.getPropertyValue(name).trim() || fallback;
      const ink = new THREE.Color(token('--color-ink', '#0a0c10'));
      const gold = new THREE.Color(token('--color-gold', '#ebae3f'));
      const grey = new THREE.Color(token('--color-baseline', '#39424f'));
      const upTint = new THREE.Color(
        token('--color-gain-mark', '#199e70'),
      ).lerp(grey, 0.55);
      const downTint = new THREE.Color(
        token('--color-loss-mark', '#e66767'),
      ).lerp(grey, 0.6);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(ink, 14, 44);
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const sun = new THREE.DirectionalLight(0xffffff, 1.1);
      sun.position.set(6, 12, 8);
      scene.add(sun);

      // The noise: a field of candles.
      const cols = 44;
      const rows = 14;
      const count = cols * rows;
      const box = new THREE.BoxGeometry(0.26, 1, 0.26);
      box.translate(0, 0.5, 0);
      const material = new THREE.MeshStandardMaterial({
        roughness: 0.55,
        metalness: 0.15,
      });
      const field = new THREE.InstancedMesh(box, material, count);
      const rng = createRng('hero-3d');
      const base = new Float32Array(count);
      const speed = new Float32Array(count);
      const phase = new Float32Array(count);
      const where: [number, number][] = [];
      for (let r = 0; r < rows; r += 1)
        for (let c = 0; c < cols; c += 1) {
          const i = r * cols + c;
          where.push([(c - cols / 2) * 0.62, -r * 1.15]);
          base[i] = 0.4 + rng.next() * 1.8;
          speed[i] = 0.6 + rng.next() * 1.6;
          phase[i] = rng.next() * 6.28;
          const roll = rng.next();
          field.setColorAt(
            i,
            roll < 0.16 ? upTint : roll < 0.3 ? downTint : grey,
          );
        }
      scene.add(field);

      // The signal: one line rising steadily through the noise.
      const points = Array.from({ length: 12 }, (_, i) => {
        const x = -15 + i * 2.8;
        return new THREE.Vector3(
          x,
          1.3 + i * 0.22 + Math.sin(i * 0.9) * 0.18,
          -5.2,
        );
      });
      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.TubeGeometry(curve, 240, 0.07, 10, false);
      const line = new THREE.Mesh(
        tube,
        new THREE.MeshBasicMaterial({ color: gold }),
      );
      const haloGeometry = new THREE.TubeGeometry(curve, 240, 0.22, 10, false);
      const halo = new THREE.Mesh(
        haloGeometry,
        new THREE.MeshBasicMaterial({
          color: gold,
          transparent: true,
          opacity: 0.14,
        }),
      );
      scene.add(line, halo);
      const fullIndex = tube.index?.count ?? 0;
      const haloIndex = haloGeometry.index?.count ?? 0;

      const dummy = new THREE.Object3D();
      const pointer = { x: 0, y: 0 };
      const onPointer = (event: PointerEvent) => {
        pointer.x = event.clientX / window.innerWidth - 0.5;
        pointer.y = event.clientY / window.innerHeight - 0.5;
      };
      window.addEventListener('pointermove', onPointer, { passive: true });

      const resize = () => {
        const width = el.clientWidth || 1;
        const height = el.clientHeight || 1;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        // Narrow screens see the field from further back, so the line fits.
        camera.position.z = width < 640 ? 23 : 18;
        camera.updateProjectionMatrix();
      };
      const sizer = new ResizeObserver(resize);
      sizer.observe(el);
      resize();

      let visible = true;
      const seen = new IntersectionObserver(([entry]) => {
        visible = Boolean(entry?.isIntersecting);
      });
      seen.observe(el);

      let frame = 0;
      const began = performance.now();
      const tick = (now: number) => {
        frame = requestAnimationFrame(tick);
        if (!visible || document.hidden) return;
        const t = (now - began) / 1000;
        for (let i = 0; i < count; i += 1) {
          const [x, z] = where[i] as [number, number];
          const h =
            (base[i] as number) *
            (0.35 +
              0.65 *
                Math.abs(
                  Math.sin(t * (speed[i] as number) + (phase[i] as number)),
                ));
          dummy.position.set(x, 0, z);
          dummy.scale.set(1, h, 1);
          dummy.updateMatrix();
          field.setMatrixAt(i, dummy.matrix);
        }
        field.instanceMatrix.needsUpdate = true;
        // The signal draws itself in over the first two and a half seconds.
        const drawn = Math.min(1, t / 2.5);
        tube.setDrawRange(0, Math.floor((fullIndex * drawn) / 3) * 3);
        haloGeometry.setDrawRange(0, Math.floor((haloIndex * drawn) / 3) * 3);
        camera.position.x = Math.sin(t * 0.08) * 1.6 + pointer.x * 1.4;
        camera.position.y = 6.2 - pointer.y * 0.8;
        camera.lookAt(0, 1.4, -8);
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', onPointer);
        sizer.disconnect();
        seen.disconnect();
        box.dispose();
        material.dispose();
        tube.dispose();
        haloGeometry.dispose();
        (line.material as { dispose(): void }).dispose();
        (halo.material as { dispose(): void }).dispose();
        field.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    // Wait for the page to settle: the words and the first lesson come first.
    const idle = (
      window as Window & { requestIdleCallback?: (fn: () => void) => number }
    ).requestIdleCallback;
    const handle = idle
      ? idle(() => void start())
      : window.setTimeout(() => void start(), 300);
    return () => {
      disposed = true;
      if (!idle) window.clearTimeout(handle);
      cleanup();
    };
  }, []);

  return <div ref={host} className="size-full" />;
}
