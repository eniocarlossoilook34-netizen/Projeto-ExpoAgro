import React, { useMemo } from 'react';
import * as THREE from 'three';
import { GROUP_Y_OFFSET, distanceToRiver } from '../../utils/terrain';
import { snapToTerrain } from '../../utils/geometry';

const POST_HEIGHT = 1.4;
const WIRE_COUNT = 4;
const WIRE_RADII = [0.018, 0.018, 0.018, 0.018];
const WIRE_OFFSETS = [0.28, 0.48, 0.68, 0.88];

function generatePaddockFence(centerPoint, radius, vertexCount = 8) {
  const [centerX, , centerZ] = centerPoint;
  const points = [];
  const angleStep = (Math.PI * 2) / vertexCount;

  for (let i = 0; i < vertexCount; i += 1) {
    const angle = i * angleStep;
    const x = centerX + Math.cos(angle) * radius;
    const z = centerZ + Math.sin(angle) * radius;
    const { y } = snapToTerrain(x, z);
    points.push(new THREE.Vector3(x, y, z));
  }

  const wireCurves = WIRE_OFFSETS.map((offset) => {
    const wirePoints = points.map((point) => point.clone().setY(point.y + offset));
    return new THREE.CatmullRomCurve3(wirePoints, true, 'catmullrom', 0.28);
  });

  return { basePoints: points, wireCurves };
}

export default function Fences({ scenario }) {
  const isFlux = scenario === 1;

  const { paddockPosts, paddockWireCurves } = useMemo(() => {
    const { basePoints, wireCurves } = generatePaddockFence([8, 0, 6], 12, 8);
    return { paddockPosts: basePoints, paddockWireCurves: wireCurves };
  }, []);

  if (!isFlux) return null;

  const safePosts = useMemo(() => {
    return paddockPosts.map((point) => {
      const x = point.x;
      const z = point.z;
      const riverGap = distanceToRiver(x, z);
      const minimumGap = 1.85;

      if (riverGap >= minimumGap) {
        const { y } = snapToTerrain(x, z);
        return { x, z, y: y + POST_HEIGHT / 2 };
      }

      const riverX = Math.sin(z * 0.12) * 2;
      const direction = Math.sign(x - riverX) || 1;
      const safeX = riverX + direction * minimumGap;
      const { y: safeY } = snapToTerrain(safeX, z);
      return { x: safeX, z, y: safeY + POST_HEIGHT / 2 };
    });
  }, [paddockPosts]);

  const postCount = safePosts.length;

  return (
    <group position={[0, GROUP_Y_OFFSET, 0]}>
      {/* Mourões de madeira tratada, verticais, ancorados no relevo */}
      <instancedMesh
        key={postCount}
        args={[null, null, postCount]}
        castShadow
        receiveShadow
        ref={(mesh) => {
          if (!mesh) return;
          const dummy = new THREE.Object3D();
          for (let i = 0; i < postCount; i++) {
            const { x, z, y } = safePosts[i];
            dummy.position.set(x, y, z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
          }
          mesh.instanceMatrix.needsUpdate = true;
        }}
      >
        <cylinderGeometry args={[0.08, 0.1, POST_HEIGHT, 8]} />
        <meshStandardMaterial color="#5b4636" roughness={0.9} metalness={0.05} />
      </instancedMesh>

      {/* Four steel wires that follow the contour of the paddock */}
      {paddockWireCurves.map((curve, index) => (
        <mesh key={`wire-${index}`} castShadow receiveShadow>
          <tubeGeometry args={[curve, 160, WIRE_RADII[index], 6, true]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.22} metalness={0.95} emissive="#ffffff" emissiveIntensity={0.03} />
        </mesh>
      ))}

      {/* Simple tensioner stay for realism on the first post */}
      {safePosts.length > 1 && (
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.1, 6]} />
          <meshStandardMaterial color="#8a8a8a" roughness={0.18} metalness={0.92} />
          <primitive
            object={new THREE.Object3D()}
            attach="object"
            position={[safePosts[0].x, safePosts[0].y + 0.8, safePosts[0].z]}
          />
        </mesh>
      )}
    </group>
  );
}
