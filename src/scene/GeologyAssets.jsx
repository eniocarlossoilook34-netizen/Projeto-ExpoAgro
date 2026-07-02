import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GROUP_Y_OFFSET, TERRAIN_HALF } from '../utils/terrain';
import { isInsideProtectionPolygon, poissonDiskSampling, snapToTerrain } from '../utils/geometry';

const CLUSTER_COUNT = 12;
const CLUSTER_SPACING = 9.4;
const CLUSTER_RADIUS = 1.8;
const BOUNDS = {
  minX: -TERRAIN_HALF,
  minZ: -TERRAIN_HALF,
  maxX: TERRAIN_HALF,
  maxZ: TERRAIN_HALF,
};
const MIN_SLOPE = 0.46;
const RIVER_PROXIMITY = 3.6;

function createStoneNormalMap() {
  const size = 64;
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = x + y * size;
      const nx = x / size;
      const ny = y / size;
      const base = 0.54 + Math.sin(nx * 12.4 + ny * 8.7) * 0.08;
      const jitter = (Math.random() - 0.5) * 0.14;
      height[index] = THREE.MathUtils.clamp(base + jitter, 0.0, 1.0);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = x + y * size;
      const left = height[((x - 1 + size) % size) + y * size];
      const right = height[((x + 1) % size) + y * size];
      const up = height[x + ((y - 1 + size) % size) * size];
      const down = height[x + ((y + 1) % size) * size];

      const dx = left - right;
      const dy = down - up;
      const dz = 1.0;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const nx = dx / len;
      const ny = dy / len;
      const nz = dz / len;

      const pixel = (x + y * size) * 4;
      imageData.data[pixel] = Math.floor((nx * 0.5 + 0.5) * 255);
      imageData.data[pixel + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      imageData.data[pixel + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      imageData.data[pixel + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  if ('colorSpace' in texture && THREE.NoColorSpace !== undefined) {
    texture.colorSpace = THREE.NoColorSpace;
  }
  texture.needsUpdate = true;
  return texture;
}

function createStoneDiffuseMap() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#52656f';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 120; i += 1) {
    const light = 140 + Math.random() * 50;
    ctx.fillStyle = `rgba(${light},${light},${light},${0.08 + Math.random() * 0.12})`;
    ctx.beginPath();
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 5 + Math.random() * 10;
    const h = 2 + Math.random() * 6;
    ctx.ellipse(x, y, w, h, Math.random() * Math.PI * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  if ('colorSpace' in texture && THREE.SRGBColorSpace !== undefined) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  texture.needsUpdate = true;
  return texture;
}

function displaceRockGeometry(sourceGeometry, intensity = 0.12) {
  const geometry = sourceGeometry.clone();
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const vector = new THREE.Vector3();
  const offset = new THREE.Vector3();

  for (let i = 0; i < position.count; i += 1) {
    vector.fromBufferAttribute(position, i);
    offset.fromBufferAttribute(normal, i);
    const noise = Math.sin(vector.x * 4.1 + vector.y * 3.5 + vector.z * 5.6) * 0.06;
    const jitter = (Math.random() - 0.5) * intensity;
    offset.multiplyScalar(noise + jitter);
    vector.add(offset);
    position.setXYZ(i, vector.x, vector.y, vector.z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

function buildRockGeometry(detail) {
  const base = new THREE.IcosahedronGeometry(0.54, detail);
  return displaceRockGeometry(base, detail === 2 ? 0.14 : 0.1);
}

function acceptRockLocation(x, z) {
  if (isInsideProtectionPolygon(x, z)) return false;
  const { normal } = snapToTerrain(x, z);
  const slope = Math.sqrt(normal.x * normal.x + normal.z * normal.z);
  const riverDistance = Math.abs(x - Math.sin(z * 0.12) * 2);
  return slope > MIN_SLOPE || riverDistance < RIVER_PROXIMITY;
}

function buildRockClusters() {
  const clusterCenters = poissonDiskSampling(BOUNDS, CLUSTER_SPACING, 30, acceptRockLocation).slice(0, CLUSTER_COUNT);
  const rocks = [];

  clusterCenters.forEach(([cx, cz]) => {
    const clusterSize = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < clusterSize; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.4 + Math.random() * CLUSTER_RADIUS;
      const x = cx + Math.cos(angle) * radius;
      const z = cz + Math.sin(angle) * radius;
      if (!acceptRockLocation(x, z)) continue;

      const { y } = snapToTerrain(x, z);
      const bury = -0.06 - Math.random() * 0.08;
      const scale = 0.75 + Math.random() * 0.95;
      const rotation = [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2];
      const detail = Math.random() > 0.55 ? 2 : 1;
      const baseColor = new THREE.Color('#5d6a75');
      const shade = baseColor.lerp(new THREE.Color('#2f3941'), Math.random() * 0.18);

      rocks.push({ x, y: y + bury, z, scale, rotation, detail, color: shade });
    }
  });

  return rocks;
}

export default function GeologyAssets() {
  const rockData = useMemo(() => buildRockClusters(), []);
  const detailOneRocks = useMemo(() => rockData.filter((rock) => rock.detail === 1), [rockData]);
  const detailTwoRocks = useMemo(() => rockData.filter((rock) => rock.detail === 2), [rockData]);
  const geometryOne = useMemo(() => buildRockGeometry(1), []);
  const geometryTwo = useMemo(() => buildRockGeometry(2), []);
  const normalMap = useMemo(() => createStoneNormalMap(), []);
  const diffuseMap = useMemo(() => createStoneDiffuseMap(), []);

  const rockMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: diffuseMap,
        normalMap,
        normalScale: new THREE.Vector2(0.9, 0.9),
        roughness: 0.94,
        metalness: 0.02,
        flatShading: false,
        vertexColors: true,
        dithering: true,
      }),
    [diffuseMap, normalMap]
  );

  const detailOneRef = useRef();
  const detailTwoRef = useRef();

  useEffect(() => {
    if (!detailOneRef.current || !detailTwoRef.current) return;
    const dummy = new THREE.Object3D();

    detailOneRef.current.geometry.setAttribute(
      'instanceColor',
      new THREE.InstancedBufferAttribute(new Float32Array(detailOneRocks.length * 3), 3)
    );

    detailTwoRef.current.geometry.setAttribute(
      'instanceColor',
      new THREE.InstancedBufferAttribute(new Float32Array(detailTwoRocks.length * 3), 3)
    );

    detailOneRocks.forEach((rock, index) => {
      dummy.position.set(rock.x, rock.y, rock.z);
      dummy.rotation.set(rock.rotation[0], rock.rotation[1], rock.rotation[2]);
      dummy.scale.set(rock.scale, rock.scale, rock.scale);
      dummy.updateMatrix();
      detailOneRef.current.setMatrixAt(index, dummy.matrix);
      detailOneRef.current.setColorAt(index, rock.color);
    });

    detailTwoRocks.forEach((rock, index) => {
      dummy.position.set(rock.x, rock.y, rock.z);
      dummy.rotation.set(rock.rotation[0], rock.rotation[1], rock.rotation[2]);
      dummy.scale.set(rock.scale, rock.scale, rock.scale);
      dummy.updateMatrix();
      detailTwoRef.current.setMatrixAt(index, dummy.matrix);
      detailTwoRef.current.setColorAt(index, rock.color);
    });

    detailOneRef.current.instanceMatrix.needsUpdate = true;
    detailTwoRef.current.instanceMatrix.needsUpdate = true;
    if (detailOneRef.current.instanceColor) detailOneRef.current.instanceColor.needsUpdate = true;
    if (detailTwoRef.current.instanceColor) detailTwoRef.current.instanceColor.needsUpdate = true;
  }, [detailOneRocks, detailTwoRocks]);

  return (
    <group position={[0, GROUP_Y_OFFSET, 0]}>
      <instancedMesh ref={detailOneRef} args={[geometryOne, null, detailOneRocks.length]} castShadow receiveShadow>
        <primitive object={rockMaterial} attach="material" />
      </instancedMesh>
      <instancedMesh ref={detailTwoRef} args={[geometryTwo, null, detailTwoRocks.length]} castShadow receiveShadow>
        <primitive object={rockMaterial} attach="material" />
      </instancedMesh>
    </group>
  );
}
