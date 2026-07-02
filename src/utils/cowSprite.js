import * as THREE from 'three';

// Desenha uma silhueta de bovino vista de cima (vetorial, em canvas):
// corpo branco com contorno fino "carvão", em duas poses:
// - 'standing': corpo alongado, cabeça alinhada ao eixo do corpo
// - 'grazing' : cabeça baixa/voltada, postura mais recolhida
export function buildCowSprite(pose = 'standing') {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#f4f4f2';
  ctx.strokeStyle = '#2a2a28';
  ctx.lineWidth = 3;

  ctx.save();
  ctx.translate(cx, cy);

  // Corpo (elipse principal)
  ctx.beginPath();
  ctx.ellipse(0, 4, 26, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cabeça
  ctx.beginPath();
  if (pose === 'grazing') {
    // cabeça baixa, deslocada e levemente rotacionada — "pastando"
    ctx.ellipse(8, -48, 13, 17, 0.35, 0, Math.PI * 2);
  } else {
    ctx.ellipse(0, -46, 13, 18, 0, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  // Patas curtas (4 pequenas elipses) — reforça leitura "top-down"
  const legPositions = [
    [-20, -18], [20, -18], [-20, 26], [20, 26],
  ];
  ctx.fillStyle = '#dcdcd8';
  legPositions.forEach(([lx, ly]) => {
    ctx.beginPath();
    ctx.ellipse(lx, ly, 6, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // Manchas (opcional, reforça leitura de "gado" sem poluir)
  ctx.fillStyle = 'rgba(42,42,40,0.55)';
  ctx.beginPath();
  ctx.ellipse(-8, 10, 9, 13, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
