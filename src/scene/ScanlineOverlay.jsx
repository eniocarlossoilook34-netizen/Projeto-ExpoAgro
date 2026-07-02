import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

export default function ScanlineOverlay() {
  const { size } = useThree();
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        uOpacity: { value: 0.06 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform float uOpacity;
        float hash(float n){return fract(sin(n)*43758.5453123);} 
        void main(){
          float lines = uResolution.y / 2.0; // subtle scanlines
          float y = vUv.y * lines;
          float f = fract(y);
          float scan = smoothstep(0.0, 0.15, f) * 0.8;
          float noise = (hash(floor(y) + floor(uTime*0.1)) - 0.5) * 0.02;
          float shade = (0.9 - scan) + noise;
          gl_FragColor = vec4(vec3(shade), uOpacity);
        }
      `,
    });
  }, [size.width, size.height]);

  return (
    <mesh renderOrder={1000} frustumCulled={false} position={[0, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
