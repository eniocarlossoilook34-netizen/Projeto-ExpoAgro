import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getElevation, TERRAIN_SIZE, GROUP_Y_OFFSET } from '../../utils/terrain';
import { buildOrthophotoTexture } from '../../utils/orthophoto';

const SEGMENTS = 96; // densidade do DEM — mais alto = relevo mais nítido

export default function Terrain({ scenario }) {
  const isFlux = scenario === 1;

  // Geração da malha topográfica (DEM) usando a mesma elevação do resto da cena
  const { geometry, edgesGeometry } = useMemo(() => {
    const planeGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEGMENTS, SEGMENTS);
    planeGeo.rotateX(-Math.PI / 2);

    const positions = planeGeo.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      positions[i + 1] = getElevation(x, z);
    }

    planeGeo.computeVertexNormals();

    // Wireframe técnico extraído só das arestas "grandes" (não da malha toda),
    // pra não virar uma teia de aranha em alta densidade.
    const lowPolyEdges = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 24, 24);
    lowPolyEdges.rotateX(-Math.PI / 2);
    const lowPos = lowPolyEdges.attributes.position.array;
    for (let i = 0; i < lowPos.length; i += 3) {
      lowPos[i + 1] = getElevation(lowPos[i], lowPos[i + 2]);
    }
    const edges = new THREE.EdgesGeometry(lowPolyEdges);

    return { geometry: planeGeo, edgesGeometry: edges };
  }, []);

  // Texturas de ortofoto "drapeadas" sobre o DEM — uma por cenário
  const degradedTex = useMemo(() => buildOrthophotoTexture('degraded'), []);
  const fluxTex = useMemo(() => buildOrthophotoTexture('flux'), []);
  const activeTexture = isFlux ? fluxTex : degradedTex;

  const wireColor = '#DDF7FF'; // contorno holográfico ciano-branco

  return (
    <group position={[0, GROUP_Y_OFFSET, 0]}>
      {/* Base com ortofoto drapeada sobre o relevo real (DEM) */}
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          map={activeTexture}
          roughness={0.92}
          metalness={0.04}
          envMapIntensity={0.7}
          emissive="#111111"
          emissiveIntensity={0.05}
          flatShading={false}
        />
      </mesh>

      {/* Wireframe técnico restrito às arestas estruturais do relevo */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial
          color={wireColor}
          transparent
          opacity={isFlux ? 0.22 : 0.12}
        />
      </lineSegments>

    </group>
  );
}
