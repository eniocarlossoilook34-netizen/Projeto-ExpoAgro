import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GROUP_Y_OFFSET, TERRAIN_HALF } from '../utils/terrain';
import { isInsideProtectionPolygon, poissonDiskSampling, snapToTerrain } from '../utils/geometry';

const CLUSTER_COUNT = 14;
const CLUSTER_SPACING = 9.5;
const TUFT_RADIUS = 1.3;
const BOUNDS = {
  minX: -TERRAIN_HALF,
  minZ: -TERRAIN_HALF,
  maxX: TERRAIN_HALF,
  maxZ: TERRAIN_HALF,
};
const HOUSE_TARGET = new THREE.Vector2(-18, 8);
const HOUSE_CLEARANCE = 5.5;

function createFloraTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(255,255,255,0)';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 14; i += 1) {
    const hue = 40 + Math.random() * 70;
    const brightness = 70 + Math.random() * 22;
    ctx.fillStyle = `hsla(${hue}, 75%, ${brightness}%, ${0.88 + Math.random() * 0.12})`;
    const px = size * 0.2 + Math.random() * size * 0.6;
    const py = size * 0.2 + Math.random() * size * 0.6;
    const w = 10 + Math.random() * 22;
    const h = 4 + Math.random() * 10;
    ctx.beginPath();
    ctx.ellipse(px, py, w, h, Math.random() * Math.PI * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 220; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = Math.random() * 0.45;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  if ('colorSpace' in texture && THREE.SRGBColorSpace !== undefined) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function buildBillboardGeometry() {
  const blade = new THREE.PlaneGeometry(1.2, 1.5, 1, 1);
  blade.translate(0, 0.75, 0);
  const blade2 = blade.clone();
  blade2.rotateY(Math.PI / 2);
  const merged = mergeGeometries([blade, blade2], false);
  merged.computeVertexNormals();
  return merged;
}

function acceptFloraArea(x, z) {
  if (isInsideProtectionPolygon(x, z)) return false;
  if (new THREE.Vector2(x, z).distanceTo(HOUSE_TARGET) < HOUSE_CLEARANCE) return false;

  const slope = snapToTerrain(x, z).normal;
  if (Math.sqrt(slope.x * slope.x + slope.z * slope.z) > 0.32) return false;

  return true;
}

function buildFloraTufts() {
  const clusterCenters = poissonDiskSampling(BOUNDS, CLUSTER_SPACING, 30, acceptFloraArea).slice(0, CLUSTER_COUNT);
  const tufts = [];

  clusterCenters.forEach(([cx, cz]) => {
    const clusterSize = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < clusterSize; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * TUFT_RADIUS;
      const x = cx + Math.cos(angle) * dist;
      const z = cz + Math.sin(angle) * dist;
      if (!acceptFloraArea(x, z)) continue;

      const { y } = snapToTerrain(x, z);
      const scale = 0.62 + Math.random() * 0.5;
      const rotation = Math.random() * Math.PI * 2;
      const choice = Math.random();
      const base = choice < 0.34 ? new THREE.Color('#f4e68a') : choice < 0.68 ? new THREE.Color('#b788d8') : new THREE.Color('#f8f8f2');
      const color = base.lerp(new THREE.Color('#83a550'), 0.24 + Math.random() * 0.26);

      tufts.push({ x, y, z, scale, rotation, color });
    }
  });

  return tufts;
}

export default function FluxFlora({ scenario }) {
  const isFlux = scenario === 1;
  const meshRef = useRef();

  const tufts = useMemo(() => (isFlux ? buildFloraTufts() : []), [isFlux]);
  const floraTexture = useMemo(() => createFloraTexture(), []);
  const billboards = useMemo(() => buildBillboardGeometry(), []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: floraTexture,
        transparent: true,
        alphaTest: 0.36,
        roughness: 0.82,
        metalness: 0.03,
        side: THREE.DoubleSide,
        depthWrite: false,
        vertexColors: true,
        dithering: true,
      }),
    [floraTexture]
  );

  useEffect(() => {
    if (!meshRef.current || tufts.length === 0) return;
    const dummy = new THREE.Object3D();

    tufts.forEach((tuft, index) => {
      dummy.position.set(tuft.x, tuft.y + 0.02, tuft.z);
      dummy.rotation.set(0, tuft.rotation, 0);
      dummy.scale.set(tuft.scale, tuft.scale, tuft.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(index, dummy.matrix);
      meshRef.current.setColorAt(index, tuft.color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [tufts]);

  if (!isFlux || tufts.length === 0) return null;

  return (
    <group position={[0, GROUP_Y_OFFSET, 0]}>
      <instancedMesh ref={meshRef} args={[billboards, null, tufts.length]} castShadow receiveShadow>
        <primitive object={material} attach="material" />
      </instancedMesh>
    </group>
  );
}
