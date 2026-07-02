import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getElevation, TERRAIN_HALF, GROUP_Y_OFFSET } from '../../utils/terrain';

// Contornos topográficos como linhas contínuas, construídas a partir da
// mesma função de elevação usada pelo terreno para integrar o relevo.
export default function Contours({ scenario, excludeCenter = [0, 0, 0], excludeRadius = 8 }) {
  const isFlux = scenario === 1;

  const geometry = useMemo(() => {
    const lines = [];
    const sample = 1.6;
    const levels = [];
    const excludePoint = new THREE.Vector3(excludeCenter[0], 0, excludeCenter[2]);
    const excludeRadiusSq = excludeRadius * excludeRadius;

    for (let height = -8; height <= 16; height += 1.4) {
      levels.push(height);
    }

    const pushSegment = (a, b) => {
      const aClose = a.distanceToSquared(excludePoint) < excludeRadiusSq;
      const bClose = b.distanceToSquared(excludePoint) < excludeRadiusSq;
      if (aClose && bClose) return;
      lines.push(a);
      lines.push(b);
    };

    for (const level of levels) {
      // Escaneia linhas de latitude para construir segmentos contíguos.
      for (let z = -TERRAIN_HALF; z <= TERRAIN_HALF; z += sample) {
        const row = [];
        let prevX = -TERRAIN_HALF;
        let prevH = getElevation(prevX, z) - level;

        for (let x = -TERRAIN_HALF + sample; x <= TERRAIN_HALF + 0.001; x += sample) {
          const h = getElevation(x, z) - level;
          if (prevH === 0 || h === 0 || prevH * h < 0) {
            const t = prevH / (prevH - h);
            const xL = prevX + (x - prevX) * t;
            const yL = getElevation(xL, z);
            row.push(new THREE.Vector3(xL, yL + 0.04, z));
          }
          prevX = x;
          prevH = h;
        }

        for (let i = 0; i < row.length - 1; i += 1) {
          pushSegment(row[i], row[i + 1]);
        }
      }

      // Escaneia linhas de longitude para reforçar o traçado vertical.
      for (let x = -TERRAIN_HALF; x <= TERRAIN_HALF; x += sample) {
        const col = [];
        let prevZ = -TERRAIN_HALF;
        let prevH = getElevation(x, prevZ) - level;

        for (let z = -TERRAIN_HALF + sample; z <= TERRAIN_HALF + 0.001; z += sample) {
          const h = getElevation(x, z) - level;
          if (prevH === 0 || h === 0 || prevH * h < 0) {
            const t = prevH / (prevH - h);
            const zL = prevZ + (z - prevZ) * t;
            const yL = getElevation(x, zL);
            col.push(new THREE.Vector3(x, yL + 0.04, zL));
          }
          prevZ = z;
          prevH = h;
        }

        for (let i = 0; i < col.length - 1; i += 1) {
          pushSegment(col[i], col[i + 1]);
        }
      }
    }

    return new THREE.BufferGeometry().setFromPoints(lines);
  }, [excludeCenter, excludeRadius]);

  return (
    <group position={[0, GROUP_Y_OFFSET, 0]}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          color="#DDF7FF"
          transparent
          opacity={isFlux ? 0.45 : 0.22}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}
