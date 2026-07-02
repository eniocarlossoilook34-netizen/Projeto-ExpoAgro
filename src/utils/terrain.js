// Fonte única de verdade para a topografia da fazenda.
// Antes, Terrain.jsx usava uma fórmula e WaterFlow/Animals usavam outra —
// isso fazia o rio, o gado e as cercas "flutuarem" fora do relevo real.
// Agora tudo (terreno, rio, cercas, grama, gado, contornos) lê daqui.

export function getElevation(x, z) {
  const valley = Math.abs(x) * 0.25;
  const hills = Math.sin(x * 0.05) * Math.cos(z * 0.08) * 6;
  const noise = Math.sin(x * 0.2) * Math.sin(z * 0.2) * 0.5;
  return valley + hills + noise;
}

// Distância aproximada até o leito do rio (mesmo traçado usado em WaterFlow)
// — usado para manter a grama/textura afastada da água e para "secar" o
// pasto perto da margem no cenário degradado.
export function distanceToRiver(x, z) {
  const riverX = Math.sin(z * 0.12) * 2;
  return Math.abs(x - riverX);
}

// Pseudo-ruído determinístico e barato (sem dependências) para variar
// densidade/cor da grama e da textura do terreno sem repetir padrão.
export function hashNoise(x, z) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export const TERRAIN_SIZE = 80;
export const TERRAIN_HALF = TERRAIN_SIZE / 2;
export const GROUP_Y_OFFSET = -5; // offset comum aplicado em todas as camadas
