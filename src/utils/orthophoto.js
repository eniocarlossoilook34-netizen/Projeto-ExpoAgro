import * as THREE from 'three';
import { hashNoise } from './terrain';

// Gera uma textura tipo "ortofoto de satélite" inteiramente em canvas
// (sem depender de nenhum arquivo de imagem externo). Duas variações:
// - "degraded": solo exposto, manchas de terra batida, pasto irregular
// - "flux": pasto denso e uniforme, com talhões mais saudáveis
//
// A textura é usada como `map` do terreno (drape sobre o DEM).
export function buildOrthophotoTexture(variant = 'flux') {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const isFlux = variant === 'flux';

  // Base: verde-pasto / terra, em duas camadas de gradiente para simular
  // variação de umidade do vale (centro) para as encostas (bordas).
  const base = ctx.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size * 0.7);
  if (isFlux) {
    base.addColorStop(0, '#1f3d22');
    base.addColorStop(0.5, '#33532c');
    base.addColorStop(1, '#4d5a32');
  } else {
    base.addColorStop(0, '#3a3322');
    base.addColorStop(0.5, '#52472c');
    base.addColorStop(1, '#5c5333');
  }
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Manchas orgânicas de biomassa / solo exposto (blobs irregulares)
  const blobCount = isFlux ? 90 : 220;
  for (let i = 0; i < blobCount; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * (isFlux ? 38 : 60) + 12;

    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    if (isFlux) {
      // tons de verde mais saudáveis, pouquíssimo solo exposto
      const g = 90 + Math.floor(Math.random() * 50);
      grd.addColorStop(0, `rgba(${40 + g * 0.2}, ${g}, ${40 + g * 0.25}, 0.5)`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
      // solo batido / pasto seco — bege, marrom, manchas de erosão
      const dry = Math.random() > 0.55;
      if (dry) {
        grd.addColorStop(0, 'rgba(120,98,62,0.55)');
      } else {
        grd.addColorStop(0, 'rgba(80,60,38,0.45)');
      }
      grd.addColorStop(1, 'rgba(0,0,0,0)');
    }
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Trilhas de gado (linhas finas e ramificadas) — mais evidentes no degradado
  if (!isFlux) {
    ctx.strokeStyle = 'rgba(70,55,35,0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      let x = Math.random() * size;
      let y = Math.random() * size;
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (Math.random() - 0.5) * 90;
        y += (Math.random() - 0.5) * 90;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // Ruído fino de alta frequência (textura de grão / micro-relevo)
  const grain = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (hashNoise(i * 0.0001, i * 0.0003) - 0.5) * 14;
    grain.data[i] = Math.min(255, Math.max(0, grain.data[i] + n));
    grain.data[i + 1] = Math.min(255, Math.max(0, grain.data[i + 1] + n));
    grain.data[i + 2] = Math.min(255, Math.max(0, grain.data[i + 2] + n));
  }
  ctx.putImageData(grain, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  // Set colorspace when available (Safer to only use SRGBColorSpace)
  if ('SRGBColorSpace' in THREE) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}
