import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GROUP_Y_OFFSET } from '../../utils/terrain';
import { snapToTerrain } from '../../utils/geometry';
import { buildCowSprite } from '../../utils/cowSprite';

const PADDOCK_CENTER_X = 8;
const PADDOCK_CENTER_Z = 6;
const PADDOCK_RADIUS = 12;

function isInsidePaddock(x, z) {
  const dx = x - PADDOCK_CENTER_X;
  const dz = z - PADDOCK_CENTER_Z;
  return dx * dx + dz * dz < PADDOCK_RADIUS * PADDOCK_RADIUS;
}

// Silhuetas vetoriais 2D de bovinos, vistas de cima — corpo branco com
// contorno fino "carvão", deitadas sobre o relevo (em vez dos antigos
// octaedros neon). Duas poses (de pé / cabeça baixa) divididas em duas
// instancedMesh, pois cada instancedMesh só pode usar uma textura.
export default function Animals({ scenario }) {
  const animalCount = 45;
  const isFlux = scenario === 1;

  const standingRef = useRef();
  const grazingRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const standingTex = useMemo(() => buildCowSprite('standing'), []);
  const grazingTex = useMemo(() => buildCowSprite('grazing'), []);

  // Define quais índices do rebanho usam qual pose (determinístico)
  // e a orientação estática (yaw) de cada animal — "várias orientações
  // num único frame", como descrito no enunciado.
  const { degradedPositions, fluxPositions, isGrazing, yaw, scale } = useMemo(() => {
    const degPos = [];
    const flxPos = [];
    const grazing = [];
    const yaws = [];
    const scales = [];

    for (let i = 0; i < animalCount; i++) {
      const degX = (Math.random() - 0.5) * 60;
      const degZ = (Math.random() - 0.5) * 60;
      degPos.push(new THREE.Vector3(degX, 0, degZ));

      let flxX;
      let flxZ;
      do {
        flxX = 12 + Math.random() * 15;
        flxZ = 5 + Math.random() * 12;
      } while (isInsidePaddock(flxX, flxZ));
      flxPos.push(new THREE.Vector3(flxX, 0, flxZ));

      grazing.push(Math.random() > 0.45); // ~55% cabeça baixa
      yaws.push(Math.random() * Math.PI * 2);
      scales.push(0.85 + Math.random() * 0.4);
    }
    return { degradedPositions: degPos, fluxPositions: flxPos, isGrazing: grazing, yaw: yaws, scale: scales };
  }, [animalCount]);

  const currentPositions = useRef(degradedPositions.map((p) => p.clone()));

  // Mapeia índice global -> slot dentro de cada instancedMesh (sequencial)
  const slotMaps = useMemo(() => {
    let s = 0;
    let g = 0;
    const standingSlot = [];
    const grazingSlot = [];
    isGrazing.forEach((graze) => {
      if (graze) {
        grazingSlot.push(g++);
        standingSlot.push(-1);
      } else {
        standingSlot.push(s++);
        grazingSlot.push(-1);
      }
    });
    return { standingSlot, grazingSlot, standingCount: s, grazingCount: g };
  }, [isGrazing]);

  useFrame((state, delta) => {
    if (!standingRef.current || !grazingRef.current) return;
    const targetPositions = isFlux ? fluxPositions : degradedPositions;

    for (let i = 0; i < animalCount; i++) {
      const current = currentPositions.current[i];
      const target = targetPositions[i];
      current.lerp(target, delta * 1.4);

      const { y: groundY } = snapToTerrain(current.x, current.z);

      dummy.position.set(current.x, groundY + 0.06, current.z);
      dummy.rotation.set(-Math.PI / 2, 0, yaw[i]);
      dummy.scale.setScalar(scale[i]);
      dummy.updateMatrix();

      if (isGrazing[i]) {
        grazingRef.current.setMatrixAt(slotMaps.grazingSlot[i], dummy.matrix);
      } else {
        standingRef.current.setMatrixAt(slotMaps.standingSlot[i], dummy.matrix);
      }
    }

    standingRef.current.instanceMatrix.needsUpdate = true;
    grazingRef.current.instanceMatrix.needsUpdate = true;
  });

  // Leve tonalidade entre cenários — sutil, não neon: pasto degradado deixa
  // o branco um pouco empoeirado; no Flux o corpo fica mais limpo/frio.
  const tint = isFlux ? '#ffffff' : '#f1ead9';

  return (
    <group position={[0, GROUP_Y_OFFSET, 0]}>
      <instancedMesh ref={standingRef} args={[null, null, Math.max(slotMaps.standingCount, 1)]} castShadow receiveShadow polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={1}>
        <planeGeometry args={[1.1, 1.5]} />
        <meshStandardMaterial
          map={standingTex}
          color={tint}
          transparent
          alphaTest={0.4}
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0}
        />
      </instancedMesh>
      <instancedMesh ref={grazingRef} args={[null, null, Math.max(slotMaps.grazingCount, 1)]} castShadow receiveShadow polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={1}>
        <planeGeometry args={[1.1, 1.5]} />
        <meshStandardMaterial
          map={grazingTex}
          color={tint}
          transparent
          alphaTest={0.4}
          side={THREE.DoubleSide}
          roughness={0.9}
          metalness={0}
        />
      </instancedMesh>
    </group>
  );
}
