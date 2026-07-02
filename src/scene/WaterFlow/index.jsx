import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GROUP_Y_OFFSET } from '../../utils/terrain';
import { snapToTerrain } from '../../utils/geometry';

export default function WaterFlow({ scenario, flowData, onPointerOver, onPointerOut, onClick }) {
  const waterMaterialRef = useRef();

  // 1. Traçado do rio, usando a MESMA função de elevação do terreno
  //    (utils/terrain.js) — garante que o leito assente exatamente no
  //    fundo do vale, sem flutuar nem cravar na malha.
  const curve = useMemo(() => {
    const points = [];
    for (let z = -40; z <= 40; z += 1) {
      const x = Math.sin(z * 0.12) * 2; // meandro suave
      const { y } = snapToTerrain(x, z);
      points.push(new THREE.Vector3(x, y + 0.1, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  // 2. Textura procedural de turbulência (dispensa arquivos externos)
  const waterTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#cccccc';
    for (let i = 0; i < 150; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 80 + 20, 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.rotation = Math.PI / 2;
    return texture;
  }, []);

  function buildRiverGeometry(curve, width, segments = 160) {
    const positions = [];
    const uvs = [];
    const indices = [];

    const frames = curve.computeFrenetFrames(segments - 1, false);

    for (let i = 0; i < segments; i += 1) {
      const t = i / (segments - 1);
      const center = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      let offsetDir = frames.binormals[i];
      if (!offsetDir || offsetDir.lengthSq() === 0) {
        offsetDir = new THREE.Vector3(0, 1, 0).cross(tangent).normalize();
      }
      const left = center.clone().addScaledVector(offsetDir, -width * 0.5);
      const right = center.clone().addScaledVector(offsetDir, width * 0.5);
      const { y: riverY } = snapToTerrain(center.x, center.z);
      left.y = riverY + 0.08;
      right.y = riverY + 0.08;

      positions.push(left.x, left.y, left.z);
      positions.push(right.x, right.y, right.z);
      uvs.push(t * 4, 0);
      uvs.push(t * 4, 1);
    }

    for (let i = 0; i < segments - 1; i += 1) {
      const index = i * 2;
      indices.push(index, index + 1, index + 2);
      indices.push(index + 2, index + 1, index + 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  const isFlux = scenario === 1;

  // Degradado: água barrenta, leito largo e disperso (escoamento descontrolado).
  // Flux: leito estreito e definido, água viva refletindo o céu de fim de tarde.
  const waterColor = isFlux ? '#cdeaf2' : '#8c7b65';
  const emissiveColor = isFlux ? '#0ea5b8' : '#2a2014';
  const riverWidth = isFlux ? 2.0 : 2.6;
  const flowRate = flowData?.flowRate ?? 0.12;
  const flowSpeed = Math.max(0.4, flowRate * 16);

  const waterGeometry = useMemo(() => buildRiverGeometry(curve, riverWidth, 160), [curve, riverWidth]);

  useFrame((state, delta) => {
    if (!waterMaterialRef.current) return;
    waterMaterialRef.current.userData.uTime = (waterMaterialRef.current.userData.uTime || 0) + delta;
    if (waterMaterialRef.current.userData.shader) {
      waterMaterialRef.current.userData.shader.uniforms.uTime.value = waterMaterialRef.current.userData.uTime;
    }
  });

  return (
    <group position={[0, GROUP_Y_OFFSET, 0]}>
      <mesh
        castShadow
        receiveShadow
        geometry={waterGeometry}
        polygonOffset
        polygonOffsetFactor={-1}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver?.();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onPointerOut?.();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <meshStandardMaterial
          ref={waterMaterialRef}
          color={waterColor}
          emissive={emissiveColor}
          emissiveIntensity={0}
          map={waterTexture}
          transparent
          opacity={0.88}
          roughness={0.05}
          metalness={0.2}
          envMapIntensity={1.4}
          flatShading
          side={THREE.DoubleSide}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = { value: 0 };
            shader.uniforms.uWaveSpeed = { value: flowSpeed * 0.18 };
            shader.uniforms.uWaveAmplitude = { value: 0.04 };
            shader.uniforms.uFresnelScale = { value: 0.22 };
            shader.uniforms.uContourColor = { value: new THREE.Color('#6fd6ff') };

            shader.vertexShader = shader.vertexShader.replace(
              '#include <common>',
              `#include <common>
               uniform float uTime;
               uniform float uWaveAmplitude;
               uniform float uWaveSpeed;
               varying float vFresnel;
              `
            );

            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `#include <begin_vertex>
               transformed.y += sin((position.x + position.z + uTime * uWaveSpeed) * 2.1) * uWaveAmplitude;
              `
            );

            shader.vertexShader = shader.vertexShader.replace(
              '#include <worldpos_vertex>',
              `#include <worldpos_vertex>
               vec3 worldNormal = normalize(normalMatrix * normal);
               vec3 viewDirection = normalize(-mvPosition.xyz);
               vFresnel = pow(1.0 - max(dot(worldNormal, viewDirection), 0.0), 2.4);
              `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <common>',
              `#include <common>
               uniform float uFresnelScale;
               uniform vec3 uContourColor;
               varying float vFresnel;
              `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <dithering_fragment>',
              `#include <dithering_fragment>
               gl_FragColor.rgb += uContourColor * (vFresnel * uFresnelScale);
              `
            );

            waterMaterialRef.current.userData.shader = shader;
          }}
        />
      </mesh>
    </group>
  );
}
