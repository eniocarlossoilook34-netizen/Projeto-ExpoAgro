import React from 'react';
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  SSAO,
  HueSaturation,
  BrightnessContrast,
  ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';

export default function Effects() {
  return (
    <EffectComposer multisampling={4} enableNormalPass>
      {/* SSAO: oclusão ambiente — dá peso e profundidade aos mourões,
          ao relevo e às bordas dos talhões. Sutil, sem "sujar" a imagem. */}
      <SSAO
        samples={24}
        radius={6}
        intensity={10}
        luminanceInfluence={0.4}
        color="#000814"
        worldDistanceThreshold={28}
        worldDistanceFalloff={6}
        worldProximityThreshold={0.4}
        worldProximityFalloff={0.4}
      />

      {/* BLOOM restrito: só o que é realmente "holográfico" (contornos,
          fios em destaque, água Flux) deve brilhar — não o terreno todo. */}
      <Bloom luminanceThreshold={0.55} mipmapBlur intensity={0.5} radius={0.5} />

      {/* Correção de cor cinematográfica — quente, terrosa, sem saturar */}
      <HueSaturation hue={0} saturation={0.06} />
      <BrightnessContrast brightness={0.04} contrast={0.1} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />

      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.08} />

      <Vignette eskil={false} offset={0.16} darkness={0.58} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
