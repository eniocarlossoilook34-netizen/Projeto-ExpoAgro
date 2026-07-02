import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, SoftShadows } from '@react-three/drei';
import HUDPanel from './hud/HUDPanel';
import { getElevation, GROUP_Y_OFFSET } from './utils/terrain';
import { snapToTerrain, poissonDiskSampling, isInsideRiparianZone } from './utils/geometry';

import Terrain from './scene/Terrain';
import WaterFlow from './scene/WaterFlow';
import Fences from './scene/Fences';
import Animals from './scene/Animals';
import Grass from './scene/Grass';
import Effects from './scene/Effects';
import DemoController from './DemoController';
import ScanlineOverlay from './scene/ScanlineOverlay';
import SpringProtectionZone from './scene/SpringProtectionZone';
import ColonialHouse from './scene/ColonialHouse';
import GeologyAssets from './scene/GeologyAssets';
import FluxFlora from './scene/FluxFlora';

import ScenarioSwitch from './hud/ScenarioSwitch';
import StatusCards from './hud/StatusCards';

function Loader() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0d14]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
        <span className="text-cyan-400/70 text-[11px] font-mono tracking-[0.3em] uppercase">
          Carregando Digital Twin
        </span>
      </div>
    </div>
  );
}

function ScenePurger() {
  const { scene } = useThree();

  useEffect(() => {
    scene.children = scene.children.filter(
      (child) => !['ghost-object', 'sphere-green', 'floating-stake'].includes(child.name)
    );
  }, [scene]);

  return null;
}

export default function App() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialDemo = urlParams.get('demo') === 'true';
  const [activeScenario, setActiveScenario] = useState(0);
  const [demoMode, setDemoMode] = useState(initialDemo);
  const [manualHudOpen, setManualHudOpen] = useState(false);
  const [waterHover, setWaterHover] = useState(false);
  const isFlux = activeScenario === 1;

  const flowData = useMemo(
    () => ({
      flowRate: isFlux ? 0.12 : 0.09,
      managementEfficiency: isFlux ? 96 : 42,
      status: isFlux ? 'Manejo otimizado' : 'Fluxo livre',
    }),
    [isFlux]
  );

  const hudOpen = waterHover || manualHudOpen;
  const hudAnchor = useMemo(() => {
    const z = 12;
    const x = Math.sin(z * 0.12) * 2;
    const y = getElevation(x, z) + 1.8;
    const tangent = new THREE.Vector3(0.24 * Math.cos(z * 0.12), 0, 1).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const offset = side.multiplyScalar(4.2);
    return [x + offset.x, y, z + offset.z];
  }, []);

  const housePlacement = useMemo(() => {
    const x = -18;
    const z = 8;
    const { y, normal } = snapToTerrain(x, z);
    return { position: [x, y + 0.01, z], normal };
  }, []);

  return (
    <div className="w-screen h-screen bg-[#0a0d14] overflow-hidden font-sans relative">
      <div className="absolute inset-0 z-0 bg-grid-overlay" />

      <Suspense fallback={<Loader />}>
        <Canvas
          key={activeScenario}
          shadows
          dpr={typeof window !== 'undefined' ? [1, Math.min(window.devicePixelRatio || 1, 2)] : [1, 2]}
          onCreated={(state) => {
            state.gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            state.gl.toneMapping = THREE.ReinhardToneMapping;
            state.gl.toneMappingExposure = 1.2;
          }}
          gl={{ antialias: true }}
          camera={{ position: [0, 36, 44], fov: 26 }}
          className="absolute inset-0 z-[1]"
        >
          <color attach="background" args={['#0a0d14']} />
          <fog attach="fog" args={['#1a1410', 60, 140]} />
          <ScenePurger />

          {/* Sombra suave física (PCSS) — substitui o look "serrilhado" padrão */}
          <SoftShadows size={18} samples={12} focus={0.6} />

          {/* Luz ambiente equilibrada para reduzir contraste excessivo */}
          <hemisphereLight skyColor={'#d0e2ef'} groundColor={'#3f3424'} intensity={1.12} />
          <ambientLight intensity={0.48} color={'#dde8ff'} />

          {/* Sol principal suave e menos saturado */}
          <directionalLight
            position={[42, 24, -10]}
            intensity={2.05}
            color={'#f9f2e7'}
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-near={1}
            shadow-camera-far={140}
            shadow-camera-left={-40}
            shadow-camera-right={40}
            shadow-camera-top={40}
            shadow-camera-bottom={-40}
            shadow-bias={-0.00008}
            shadow-normalBias={0.035}
            shadow-radius={0.4}
          />
          {/* Leve preenchimento frio do lado contrário, para suavizar as sombras */}
          <directionalLight position={[-30, 15, 25]} intensity={0.18} color={'#8ac6ff'} />

          {/* Acento técnico suave — brilho HUD reduzido e menos agressivo */}
          <pointLight position={[-18, 10, -10]} intensity={isFlux ? 0.28 : 0.08} color={isFlux ? '#4ddce8' : '#8b1f1f'} distance={36} />

          <Environment preset="sunset" background={false} />

          <Terrain scenario={activeScenario} />
          <GeologyAssets />
          <Grass scenario={activeScenario} />
          <FluxFlora scenario={activeScenario} />
          <WaterFlow
            scenario={activeScenario}
            flowData={flowData}
            onPointerOver={() => setWaterHover(true)}
            onPointerOut={() => setWaterHover(false)}
            onClick={() => setManualHudOpen((open) => !open)}
          />
          <Fences scenario={activeScenario} />
          <SpringProtectionZone scenario={activeScenario} />
          <group position={[0, GROUP_Y_OFFSET, 0]}>
            <ColonialHouse position={housePlacement.position} normal={housePlacement.normal} />
          </group>
          <Animals scenario={activeScenario} />
          <ContactShadows position={[0, -5.35, 0]} opacity={0.55} scale={95} blur={2} far={12} color="#000814" />
          <ContactShadows position={[housePlacement.position[0], -5.35, housePlacement.position[2]]} opacity={0.72} scale={8} blur={0.7} far={2.2} color="#000000" />
          <Effects />
          <ScanlineOverlay />
          <DemoController demoMode={demoMode} setDemoMode={setDemoMode} activeScenario={activeScenario} />
          <HUDPanel data={flowData} position={hudAnchor} open={hudOpen} onToggle={setManualHudOpen} demoMode={demoMode} setDemoMode={setDemoMode} />

          <OrbitControls
            enablePan={false}
            minDistance={32}
            maxDistance={72}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 3}
            autoRotate
            autoRotateSpeed={0.2}
          />
        </Canvas>
      </Suspense>

      {/* HUD Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 md:p-8 flex flex-col justify-between">
        <header className="flex justify-between items-start w-full">
          <div className="flex items-center gap-3 bg-slate-950/60 border border-cyan-900/40 px-5 py-3 backdrop-blur-md rounded-md shadow-[0_0_30px_rgba(0,0,0,0.4)]">
            <div className="relative w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-cyan-400 animate-pulse-soft" />
              <span className="absolute inset-0 rounded-full bg-cyan-400 blur-[4px] opacity-60" />
            </div>
            <div>
              <h1 className="text-cyan-300 text-base font-bold tracking-[0.25em] uppercase leading-none">Flux Rural</h1>
              <p className="text-slate-500 text-[10px] font-mono tracking-widest mt-1">Monitoramento Hídrico · Digital Twin</p>
            </div>
          </div>
          <ScenarioSwitch active={activeScenario} onChange={setActiveScenario} />
        </header>

        <main className="flex justify-start items-end h-full pb-2">
          <StatusCards scenario={activeScenario} />
        </main>

        <footer className="flex justify-between items-center text-[10px] font-mono tracking-widest text-slate-600 px-1">
          <span>LAT -19.4912 · LON -42.5371</span>
          <span className="text-slate-700">CLIQUE E ARRASTE PARA ORBITAR</span>
        </footer>
      </div>

      {demoMode && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', cursor: 'none' }} />
      )}
    </div>
  );
}
