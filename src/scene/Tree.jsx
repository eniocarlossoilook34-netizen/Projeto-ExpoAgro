import React from 'react';
import * as THREE from 'three';

const CANOPY_GEOMETRY = (() => {
  const geometry = new THREE.ConeGeometry(0.9, 1.2, 10, 1);
  geometry.computeBoundingBox();

  const position = geometry.attributes.position;
  const count = position.count;
  const colors = new Float32Array(count * 3);
  const minY = geometry.boundingBox.min.y;
  const maxY = geometry.boundingBox.max.y;

  for (let i = 0; i < count; i += 1) {
    const y = position.getY(i);
    const t = THREE.MathUtils.clamp((y - minY) / (maxY - minY), 0, 1);
    const dark = new THREE.Color('#215f27');
    const light = new THREE.Color('#94e283');
    const mixed = dark.clone().lerp(light, t * 0.9 + 0.1);
    colors[i * 3] = mixed.r;
    colors[i * 3 + 1] = mixed.g;
    colors[i * 3 + 2] = mixed.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
})();

const CANOPY_MATERIAL = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.38,
  metalness: 0.08,
  envMapIntensity: 1.15,
  flatShading: true,
});

const TRUNK_GEOMETRY = new THREE.CylinderGeometry(0.09, 0.13, 0.46, 8, 1, true);
const TRUNK_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#5a3b26',
  roughness: 0.92,
  metalness: 0.05,
  envMapIntensity: 1.0,
  flatShading: true,
});

export default function Tree({ position = [0, 0, 0], rotation = 0, scale = 1 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      <mesh geometry={TRUNK_GEOMETRY} material={TRUNK_MATERIAL} position={[0, 0.23, 0]} castShadow receiveShadow />
      <mesh geometry={CANOPY_GEOMETRY} material={CANOPY_MATERIAL} position={[0, 0.75, 0]} castShadow receiveShadow />
    </group>
  );
}
