import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GROUP_Y_OFFSET } from '../../utils/terrain';
import { snapToTerrain, isInsideRiparianZone } from '../../utils/geometry';
import Tree from '../Tree';

const PADDOCK_CENTER = new THREE.Vector2(8, 6);
const PADDOCK_RADIUS = 12;
const SPRING_CENTER = new THREE.Vector2(4.5, 8);
const SPRING_BUFFER = 4;
const TREE_COUNT = 68;

function isInsidePaddock(x, z) {
  const dx = x - PADDOCK_CENTER.x;
  const dz = z - PADDOCK_CENTER.y;
  return dx * dx + dz * dz <= PADDOCK_RADIUS * PADDOCK_RADIUS;
}

function isNearSpring(x, z) {
  const dx = x - SPRING_CENTER.x;
  const dz = z - SPRING_CENTER.y;
  return dx * dx + dz * dz < SPRING_BUFFER * SPRING_BUFFER;
}

function isTooCloseToRiver(x, z) {
  return isInsideRiparianZone(x, z, 2.4);
}

export default function Trees({ scenario }) {
  const isFlux = scenario === 1;

  const treeTransforms = useMemo(() => {
    const trees = [];
    let attempts = 0;

    while (trees.length < TREE_COUNT && attempts < TREE_COUNT * 18) {
      attempts += 1;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * PADDOCK_RADIUS;
      const x = PADDOCK_CENTER.x + Math.cos(angle) * distance;
      const z = PADDOCK_CENTER.y + Math.sin(angle) * distance;

      if (!isInsidePaddock(x, z)) continue;
      if (isNearSpring(x, z)) continue;
      if (isTooCloseToRiver(x, z)) continue;

      const { y } = snapToTerrain(x, z);
      if (!Number.isFinite(y)) continue;
      const rotation = Math.random() * Math.PI * 2;
      const scale = 0.92 + Math.random() * 0.22;

      trees.push({ x, y, rotation, scale });
    }

    return trees;
  }, [isFlux]);

  if (!isFlux) return null;

  return (
    <group position={[0, GROUP_Y_OFFSET, 0]}>
      {treeTransforms.map((tree, index) => (
        <Tree
          key={`tree-${index}`}
          position={[tree.x, tree.y, tree.z]}
          rotation={tree.rotation}
          scale={tree.scale}
        />
      ))}
    </group>
  );
}
