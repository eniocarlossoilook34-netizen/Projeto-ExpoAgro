import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { distanceToRiver, hashNoise, TERRAIN_HALF, GROUP_Y_OFFSET } from '../../utils/terrain';
import { snapToTerrain } from '../../utils/geometry';

// Zona do talhão ativo no cenário Flux (mesma área usada em Animals) — usada
// aqui apenas para decidir onde a grama aparece mais "pisada"/rebaixada,
// sem precisar sincronizar posição exata dos animais a cada frame.
const FLUX_PADDOCK = { xMin: 10, xMax: 29, zMin: 3, zMax: 19 };

function grazingFactor(x, z, isFlux) {
  if (isFlux) {
    const inside = x > FLUX_PADDOCK.xMin && x < FLUX_PADDOCK.xMax && z > FLUX_PADDOCK.zMin && z < FLUX_PADDOCK.zMax;
    return inside ? 0.55 : 1;
  }
  const d = distanceToRiver(x, z);
  const wear = THREE.MathUtils.clamp(1 - d / 14, 0, 0.75);
  return 1 - wear;
}

export default function Grass({ scenario }) {
  const isFlux = scenario === 1;
  const meshRef = useRef();
  const COUNT = 5200;

  const { geometry, material } = useMemo(() => {
    const bladeGeo = new THREE.PlaneGeometry(0.09, 0.55, 1, 3);
    bladeGeo.translate(0, 0.275, 0);

    const instanced = new THREE.InstancedBufferGeometry();
    instanced.index = bladeGeo.index;
    instanced.attributes.position = bladeGeo.attributes.position;
    instanced.attributes.uv = bladeGeo.attributes.uv;
    instanced.attributes.normal = bladeGeo.attributes.normal;

    const offsets = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const colorFactors = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);

    let i = 0;
    let attempts = 0;
    while (i < COUNT && attempts < COUNT * 4) {
      attempts++;
      const x = (Math.random() - 0.5) * (TERRAIN_HALF * 2 - 6);
      const z = (Math.random() - 0.5) * (TERRAIN_HALF * 2 - 6);
      if (distanceToRiver(x, z) < 1.6) continue;

      const { y } = snapToTerrain(x, z);
      offsets[i * 3] = x;
      offsets[i * 3 + 1] = y;
      offsets[i * 3 + 2] = z;

      const wear = grazingFactor(x, z, isFlux);
      const n = hashNoise(x * 0.3, z * 0.3);
      scales[i] = (0.55 + n * 0.65) * wear;
      colorFactors[i] = n;
      phases[i] = Math.random() * Math.PI * 2;
      i++;
    }

    instanced.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3));
    instanced.setAttribute('scaleFactor', new THREE.InstancedBufferAttribute(scales, 1));
    instanced.setAttribute('colorFactor', new THREE.InstancedBufferAttribute(colorFactors, 1));
    instanced.setAttribute('phase', new THREE.InstancedBufferAttribute(phases, 1));
    instanced.instanceCount = i;

    const palette = isFlux
      ? { low: new THREE.Color('#1c3a1f'), high: new THREE.Color('#6fae4f') }
      : { low: new THREE.Color('#3c3320'), high: new THREE.Color('#8a8a4d') };

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLowColor: { value: palette.low },
        uHighColor: { value: palette.high },
      },
      vertexShader: `
        attribute vec3 offset;
        attribute float scaleFactor;
        attribute float colorFactor;
        attribute float phase;
        uniform float uTime;
        varying float vColorFactor;
        varying float vHeight;

        void main() {
          vColorFactor = colorFactor;
          vHeight = position.y;

          vec3 pos = position;
          pos.y *= scaleFactor;

          float sway = sin(uTime * 1.6 + phase + offset.x * 0.4) * 0.10 * pos.y;
          pos.x += sway;
          pos.z += sway * 0.4;

          vec3 worldPos = pos + offset;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uLowColor;
        uniform vec3 uHighColor;
        varying float vColorFactor;
        varying float vHeight;

        void main() {
          vec3 color = mix(uLowColor, uHighColor, clamp(vHeight * 1.6 + vColorFactor * 0.5, 0.0, 1.0));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    return { geometry: instanced, material: mat };
  }, [isFlux]);

  useFrame((state) => {
    if (material) material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group position={[0, GROUP_Y_OFFSET, 0]}>
      <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
