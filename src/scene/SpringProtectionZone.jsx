import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GROUP_Y_OFFSET } from '../utils/terrain';
import { snapToTerrain, isInsideRiparianZone } from '../utils/geometry';
import Tree from './Tree';

const PADDOCK_CENTER = new THREE.Vector2(8, 6);
const PADDOCK_RADIUS = 12;
const SPRING_CENTER = new THREE.Vector2(4.5, 8);
const SPRING_BUFFER = 4;
const MIN_TREE_DISTANCE = 1.5;
const TREE_COUNT = 56;

function buildSpringRibbonGeometry(curve, startWidth = 0.45, endWidth = 0.12, segments = 46) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = curve.getPoint(t);
    const x = point.x;
    const z = point.z;
    const { y } = snapToTerrain(x, z);
    const terrainPoint = new THREE.Vector3(x, y + 0.06, z);

    const tangent = curve.getTangent(t).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent).normalize();
    const width = THREE.MathUtils.lerp(startWidth, endWidth, t);

    const leftPoint = new THREE.Vector3().copy(terrainPoint).addScaledVector(right, -width * 0.5);
    const rightPoint = new THREE.Vector3().copy(terrainPoint).addScaledVector(right, width * 0.5);

    positions.push(leftPoint.x, leftPoint.y, leftPoint.z);
    positions.push(rightPoint.x, rightPoint.y, rightPoint.z);
    uvs.push(0, t);
    uvs.push(1, t);
  }

  for (let i = 0; i < segments; i += 1) {
    const index = i * 2;
    indices.push(index, index + 2, index + 1);
    indices.push(index + 1, index + 2, index + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}


function buildOctagon(center, radius) {
  const verts = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = i * (Math.PI / 4);
    verts.push(new THREE.Vector2(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius));
  }
  return verts;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const zi = polygon[i].y;
    const xj = polygon[j].x;
    const zj = polygon[j].y;
    const intersect = (zi > point.y) !== (zj > point.y) && point.x < ((xj - xi) * (point.y - zi)) / (zj - zi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function createTreePositions() {
  const paddockPoly = buildOctagon(PADDOCK_CENTER, PADDOCK_RADIUS);
  const positions = [];
  let attempts = 0;

  while (positions.length < TREE_COUNT && attempts < TREE_COUNT * 20) {
    attempts += 1;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * PADDOCK_RADIUS;
    const x = PADDOCK_CENTER.x + Math.cos(angle) * radius;
    const z = PADDOCK_CENTER.y + Math.sin(angle) * radius;
    const candidate = new THREE.Vector2(x, z);

    if (!pointInPolygon(candidate, paddockPoly)) continue;
    if (isInsideRiparianZone(x, z, 2.4)) continue;
    if (new THREE.Vector2(x, z).distanceTo(SPRING_CENTER) < SPRING_BUFFER) continue;

    const tooClose = positions.some((existing) => new THREE.Vector2(existing.x, existing.z).distanceTo(candidate) < MIN_TREE_DISTANCE);
    if (tooClose) continue;

    const { y } = snapToTerrain(x, z);
    if (!Number.isFinite(y)) continue;
    const scale = 0.95 + (Math.random() - 0.5) * 0.2;
    const rotation = Math.random() * Math.PI * 2;
    positions.push({ x, y, z, scale, rotation });
  }

  return positions;
}
export default function SpringProtectionZone({ scenario }) {
  const isFlux = scenario === 1;
  const trunkRef = useRef();
  const canopyRef = useRef();

  const treeTransforms = useMemo(() => createTreePositions(), []);

  const springStream = useMemo(() => {
    const sourceX = SPRING_CENTER.x;
    const sourceZ = SPRING_CENTER.y;
    const { y: springY } = snapToTerrain(sourceX, sourceZ);
    const source = new THREE.Vector3(sourceX, springY + 0.14, sourceZ);

    const targetX = Math.sin(sourceZ * 0.12) * 2;
    const { y: targetY } = snapToTerrain(targetX, sourceZ);
    const target = new THREE.Vector3(targetX, targetY + 0.08, sourceZ);

    const midX = (sourceX + targetX) / 2;
    const midZ = sourceZ - 0.8;
    const midY = snapToTerrain(midX, midZ).y + 0.08;
    const mid = new THREE.Vector3(midX, midY, midZ);

    const curve = new THREE.CatmullRomCurve3([source, mid, target], false, 'catmullrom', 0.3);
    return buildSpringRibbonGeometry(curve, 0.5, 0.12, 72);
  }, []);

  useEffect(() => {
    if (!trunkRef.current || !canopyRef.current) return;

    const trunkDummy = new THREE.Object3D();
    const canopyDummy = new THREE.Object3D();

    treeTransforms.forEach((tree, index) => {
      trunkDummy.position.set(tree.x, tree.y + 0.7, tree.z);
      trunkDummy.rotation.set(0, tree.rotation, 0);
      trunkDummy.scale.set(0.18 * tree.scale, 1.4 * tree.scale, 0.18 * tree.scale);
      trunkDummy.updateMatrix();
      trunkRef.current.setMatrixAt(index, trunkDummy.matrix);

      canopyDummy.position.set(tree.x, tree.y + 1.45 * tree.scale, tree.z);
      canopyDummy.rotation.set(0, tree.rotation * 0.65, 0);
      canopyDummy.scale.set(0.9 * tree.scale, 0.9 * tree.scale, 0.9 * tree.scale);
      canopyDummy.updateMatrix();
      canopyRef.current.setMatrixAt(index, canopyDummy.matrix);
    });

    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
  }, [treeTransforms]);

  if (!isFlux) return null;

  return (
    <group position={[0, GROUP_Y_OFFSET, 0]}>
      <instancedMesh ref={trunkRef} args={[null, null, treeTransforms.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.12, 1, 8]} />
        <meshStandardMaterial color="#5a3f28" roughness={0.94} metalness={0.04} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[null, null, treeTransforms.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#3f6b33" roughness={0.7} metalness={0.05} />
      </instancedMesh>
      <mesh geometry={springStream} castShadow receiveShadow>
        <meshStandardMaterial
          color="#8ee3ff"
          emissive="#5dd8ff"
          emissiveIntensity={0.9}
          transparent
          opacity={0.52}
          roughness={0.15}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* removed decorative spring sphere to avoid floating artifact in river */}
    </group>
  );
}
