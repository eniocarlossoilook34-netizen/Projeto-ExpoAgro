import React, { useMemo } from 'react';
import * as THREE from 'three';

export default function ModularHouse({ position, normal }) {
  const quaternion = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const align = new THREE.Quaternion().setFromUnitVectors(up, normal);
    const yaw = new THREE.Quaternion().setFromAxisAngle(normal, -Math.PI * 0.1);
    return align.multiply(yaw);
  }, [normal]);

  return (
    <group position={position} quaternion={quaternion} castShadow receiveShadow>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.5, 1.2, 2.6]} />
        <meshStandardMaterial
          color="#E0E0E0"
          roughness={0.18}
          metalness={0.26}
          envMapIntensity={1.4}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={1}
        />
      </mesh>

      <mesh position={[0, 0.7, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.14, 2.8]} />
        <meshStandardMaterial
          color="#c4c7cc"
          roughness={0.22}
          metalness={0.4}
          envMapIntensity={1.4}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={1}
        />
      </mesh>

      <mesh position={[-1, 0.25, 0.9]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.4, 0.04]} />
        <meshStandardMaterial
          color="#0f4f6a"
          roughness={0.18}
          metalness={0.05}
          transparent
          opacity={0.6}
          emissive="#00E5FF"
          emissiveIntensity={0.18}
          envMapIntensity={1.4}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <mesh position={[0, 0.25, 0.9]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.4, 0.04]} />
        <meshStandardMaterial
          color="#0f4f6a"
          roughness={0.18}
          metalness={0.05}
          transparent
          opacity={0.6}
          emissive="#00E5FF"
          emissiveIntensity={0.18}
          envMapIntensity={1.4}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <mesh position={[1, 0.25, 0.9]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.4, 0.04]} />
        <meshStandardMaterial
          color="#0f4f6a"
          roughness={0.18}
          metalness={0.05}
          transparent
          opacity={0.6}
          emissive="#00E5FF"
          emissiveIntensity={0.18}
          envMapIntensity={1.4}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={1}
        />
      </mesh>

      <mesh position={[0, 0.8, -1.15]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.5, 0.12]} />
        <meshStandardMaterial
          color="#b8bac0"
          roughness={0.18}
          metalness={0.28}
          envMapIntensity={1.4}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={1}
        />
      </mesh>
    </group>
  );
}
