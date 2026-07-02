import React, { useMemo } from 'react';
import * as THREE from 'three';
import { snapToTerrain } from '../utils/geometry';

export default function ColonialHouse({ position: initPosition, normal: initNormal }) {
  // allow either position normal pair or fallback
  const { position, quaternion } = useMemo(() => {
    let pos = initPosition;
    let normal = initNormal;
    if (!pos) {
      const { y, normal: n } = snapToTerrain(0, 0);
      pos = [0, y, 0];
      normal = n;
    }

    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const nVec = new THREE.Vector3(normal.x, normal.y, normal.z).normalize();
    q.setFromUnitVectors(up, nVec);

    return { position: pos, quaternion: q };
  }, [initPosition, initNormal]);

  // Materials tuned for PBR natural look
  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.86, metalness: 0.02, envMapIntensity: 0.6 }),
    []
  );
  const roofMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#b4532b', roughness: 0.62, metalness: 0.0, envMapIntensity: 0.9 }),
    []
  );
  const woodMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#7a4a2b', roughness: 0.7, metalness: 0.03, envMapIntensity: 0.7 }),
    []
  );

  // Simple procedural geometry sizes
  const baseWidth = 3.6;
  const baseDepth = 2.6;
  const baseHeight = 2.5;
  const roofHeight = 0.8;

  return (
    <group position={position} quaternion={quaternion} castShadow receiveShadow>
      {/* Base walls */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[baseWidth, baseHeight, baseDepth]} />
        <primitive object={wallMat} attach="material" />
      </mesh>

      {/* Roof: four-water using a pyramid-like cone with 4 segments */}
      <mesh position={[0, baseHeight / 2 + roofHeight / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <coneGeometry args={[Math.max(baseWidth, baseDepth) * 0.9, roofHeight, 4]} />
        <primitive object={roofMat} attach="material" />
      </mesh>

      {/* Front veranda floor */}
      <mesh position={[0, -baseHeight / 2 + 0.02, baseDepth / 2 + 0.18]} castShadow receiveShadow>
        <boxGeometry args={[baseWidth * 0.98, 0.04, 0.6]} />
        <primitive object={woodMat} attach="material" />
      </mesh>

      {/* Veranda pillars */}
      <group position={[0, -baseHeight / 2 + 0.22, baseDepth / 2 + 0.18]}>
        <mesh position={[-1.4, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 8]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
        <mesh position={[1.4, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 8]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
      </group>
    </group>
  );
}
