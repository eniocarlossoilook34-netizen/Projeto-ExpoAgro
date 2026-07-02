import * as THREE from 'three';
import { getElevation, distanceToRiver } from './terrain';

const UP = new THREE.Vector3(0, 1, 0);

export function snapToTerrain(x, z) {
  const y = getElevation(x, z);
  const delta = 0.14;
  const heightL = getElevation(x - delta, z);
  const heightR = getElevation(x + delta, z);
  const heightD = getElevation(x, z - delta);
  const heightU = getElevation(x, z + delta);

  const normal = new THREE.Vector3(heightL - heightR, 2 * delta, heightD - heightU).normalize();
  if (!Number.isFinite(normal.x) || !Number.isFinite(normal.y) || !Number.isFinite(normal.z)) {
    normal.copy(UP);
  }

  return { y, normal };
}

export const APP_BUFFER = 2.4;

export function isInsideRiparianZone(x, z, buffer = APP_BUFFER) {
  return distanceToRiver(x, z) < buffer;
}

export function isInsidePolygon(x, z, polygonCoords) {
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const xi = polygonCoords[i][0];
    const zi = polygonCoords[i][1];
    const xj = polygonCoords[j][0];
    const zj = polygonCoords[j][1];
    const intersect = (zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Convenience: paddock protection polygon (used by SpringProtectionZone)
const PADDOCK_CENTER = [8, 6];
const PADDOCK_RADIUS = 12;

function buildOctagonCoords(center, radius) {
  const verts = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = i * (Math.PI / 4);
    verts.push([center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius]);
  }
  return verts;
}

export function isInsideProtectionPolygon(x, z) {
  const poly = buildOctagonCoords(PADDOCK_CENTER, PADDOCK_RADIUS);
  return isInsidePolygon(x, z, poly);
}

export function poissonDiskSampling(bounds, radius, k = 30, accept = () => true) {
  const { minX, minZ, maxX, maxZ } = bounds;
  const width = maxX - minX;
  const height = maxZ - minZ;
  const cellSize = radius / Math.sqrt(2);
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const grid = new Array(cols * rows).fill(null);
  const points = [];
  const active = [];

  function pointToGridIndex(px, pz) {
    const col = Math.floor((px - minX) / cellSize);
    const row = Math.floor((pz - minZ) / cellSize);
    return row * cols + col;
  }

  function getNeighbors(px, pz) {
    const col = Math.floor((px - minX) / cellSize);
    const row = Math.floor((pz - minZ) / cellSize);
    const neighbors = [];
    for (let i = Math.max(0, col - 2); i <= Math.min(cols - 1, col + 2); i += 1) {
      for (let j = Math.max(0, row - 2); j <= Math.min(rows - 1, row + 2); j += 1) {
        const neighbor = grid[j * cols + i];
        if (neighbor) neighbors.push(neighbor);
      }
    }
    return neighbors;
  }

  function isValidPoint(px, pz) {
    if (px < minX || px >= maxX || pz < minZ || pz >= maxZ) return false;
    if (!accept(px, pz)) return false;
    const neighbors = getNeighbors(px, pz);
    for (let i = 0; i < neighbors.length; i += 1) {
      const dx = neighbors[i][0] - px;
      const dz = neighbors[i][1] - pz;
      if (dx * dx + dz * dz < radius * radius) return false;
    }
    return true;
  }

  function addPoint(px, pz) {
    const point = [px, pz];
    points.push(point);
    active.push(point);
    const index = pointToGridIndex(px, pz);
    if (index >= 0 && index < grid.length) grid[index] = point;
  }

  const startX = minX + Math.random() * width;
  const startZ = minZ + Math.random() * height;
  if (isValidPoint(startX, startZ)) {
    addPoint(startX, startZ);
  }

  while (active.length > 0) {
    const idx = Math.floor(Math.random() * active.length);
    const [ax, az] = active[idx];
    let found = false;

    for (let i = 0; i < k; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radiusSample = radius * (1 + Math.random());
      const px = ax + Math.cos(angle) * radiusSample;
      const pz = az + Math.sin(angle) * radiusSample;
      if (isValidPoint(px, pz)) {
        addPoint(px, pz);
        found = true;
        break;
      }
    }

    if (!found) {
      active.splice(idx, 1);
    }
  }

  return points;
}
