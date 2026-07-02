import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useSpring } from '@react-spring/web';
import { useFrame } from '@react-three/fiber';

export default function DemoController({ demoMode, setDemoMode, activeScenario }) {
  const { camera } = useThree();
  const tourInterval = useRef();
  const indexRef = useRef(0);

  // Define three camera views: Nascente, Colonial House, Panoramic
  const views = [
    { pos: [4.5, 8, 8.5], target: [4.5, 0.8, 8.5] },
    { pos: [-18, 6, 8], target: [-18, 1.8, 8] },
    { pos: [0, 42, 0], target: [0, 0, 0] },
  ];

  const [springs, api] = useSpring(() => ({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    tx: 0,
    ty: 0,
    tz: 0,
    config: { mass: 1, tension: 170, friction: 26 },
  }));

  useFrame(() => {
    // only drive camera when demo mode is active
    if (!demoMode) return;
    if (springs.x && springs.y && springs.z) {
      const nx = springs.x.get();
      const ny = springs.y.get();
      const nz = springs.z.get();
      camera.position.set(nx, ny, nz);
    }
    if (springs.tx && springs.ty && springs.tz) {
      const tx = springs.tx.get();
      const ty = springs.ty.get();
      const tz = springs.tz.get();
      camera.lookAt(tx, ty, tz);
    }
  });

  useEffect(() => {
    if (!demoMode) {
      if (tourInterval.current) {
        clearInterval(tourInterval.current);
        tourInterval.current = null;
      }
      return;
    }

    // start tour immediately and then every 15s
    const step = () => {
      const view = views[indexRef.current % views.length];
      indexRef.current += 1;
      api.start({ x: view.pos[0], y: view.pos[1], z: view.pos[2], tx: view.target[0], ty: view.target[1], tz: view.target[2], config: { duration: 1400 } });
    };

    step();
    tourInterval.current = setInterval(step, 15000);

    return () => {
      if (tourInterval.current) clearInterval(tourInterval.current);
      tourInterval.current = null;
    };
  }, [demoMode, api]);

  // Ensure demoMode can be toggled via URL or HUD
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'd') setDemoMode?.((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setDemoMode]);

  return null;
}
