import { Engine, RawTexture, Scene, Vector2, Vector3 } from "@babylonjs/core";
import { getAsset, useAssets } from "../hooks/useAsset";
import { Assets, TerrainAsset } from "../types/Assets";
import { TerrainAssetDefinition } from "../types/gameDefinition/AssetDefinition";
import { blerp, blerpVecFunc } from "../utils/MathUtils";
import { host, sleep0 } from "../utils/Utils";

const size = 8000;
const height = 640;
const HEIGHTMAP_MAX_HEIGHT = 65536;

const getNormal = (
  heightMap: number[][],
  resolution: number,
  size: number,
  height: number,
  i: number,
  j: number
) => {
  if (i === 0 || j === 0 || i === resolution - 1 || j === resolution - 1)
    return [0, 1, 0];

  const pixelSize = 1;
  const cellSize = size / resolution;

  const l = heightMap[i - pixelSize][j] * height;
  const u = heightMap[i][j + pixelSize] * height;
  const r = heightMap[i + pixelSize][j] * height;
  const d = heightMap[i][j - pixelSize] * height;

  const first = [0, u - d, 2 * cellSize];
  const second = [2 * cellSize, r - l, 0];

  const x = -first[2] * second[1];
  const y = first[2] * second[0];
  const z = -first[1] * second[0];

  const len = Math.sqrt(x * x + y * y + z * z);
  return [x / len, y / len, z / len];
};

const calcNormals = (
  heightMap: number[][],
  resolution: number,
  size: number,
  height: number
) => {
  const normalBuffer = new Float32Array(resolution * resolution * 4);
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const index = i * resolution + j;
      const normal = getNormal(heightMap, resolution, size, height, i, j);
      normalBuffer[index * 4 + 0] = normal[0];
      normalBuffer[index * 4 + 1] = normal[1];
      normalBuffer[index * 4 + 2] = normal[2];
      normalBuffer[index * 4 + 0] = 0;
    }
  }
  return normalBuffer;
};

export const hashTerrain = (terrainAssetDefinition: TerrainAssetDefinition) => {
  return terrainAssetDefinition.url;
};
export const terrainLoaded = (
  assetDefinition: TerrainAssetDefinition,
  assets: Assets
) => {
  const hash = hashTerrain(assetDefinition);
  if (assets.terrains[hash]) {
    assetDefinition.hash = hash;
    return true;
  }

  return false;
};
export const loadTerrain = async (
  gameDefinitionName: string,
  assetDefinition: TerrainAssetDefinition,
  scene: Scene,
  assets: Assets,
  setStatus: (status: string) => void
) => {
  const hash = hashTerrain(assetDefinition);
  const root = `${host}${gameDefinitionName}`;
  const URI = assetDefinition.url;

  const dataArray: number[] = [];
  // eslint-disable-next-line no-constant-condition
  setStatus("Loading terrain...");
  const data: ArrayBuffer = await fetch(root + URI, {
    mode: "cors",
  }).then((response) => response.arrayBuffer());
  setStatus("Parsing terrain...");
  await sleep0();
  const resultData = new Uint16Array(data);
  let max = 0;
  resultData.forEach((datum, i) => {
    dataArray[i] = datum / HEIGHTMAP_MAX_HEIGHT;
    if (datum > max) max = datum;
  });
  const heightMapBuffer = new Float32Array(dataArray);
  const resolution = Math.sqrt(dataArray.length);
  const heightMap: number[][] = [];
  dataArray.forEach((height, i) => {
    if (!heightMap) return;
    const x = Math.floor(i / resolution);
    const y = i % resolution;
    if (!heightMap[x]) heightMap[x] = [];
    heightMap[x][y] = height;
  });

  const logRes = Math.log2(resolution - 1);
  if (logRes !== Math.floor(logRes)) {
    throw new Error(
      "heightmap must be one more than a power of two, is: " + resolution
    );
  }

  const getHeightAtCoordinates = (x: number, z: number) => {
    const inPos = new Vector2(x, z);
    inPos
      .addInPlace(new Vector2(size / 2, size / 2))
      .divideInPlace(new Vector2(size, size))
      .scaleInPlace(resolution - 1)
      .addInPlace(new Vector2(0.5, 0.5));

    if (inPos.x < 0 || inPos.x > resolution - 1) return 0;
    if (inPos.y < 0 || inPos.y > resolution - 1) return 0;

    const x1 = Math.floor(inPos.x);
    const x2 = Math.ceil(inPos.x);
    const y1 = Math.floor(inPos.y);
    const y2 = Math.ceil(inPos.y);

    if (x1 === x2 && y1 === y2) {
      return heightMap[x1][y1] * height;
    }

    try {
      const y = blerp(heightMap, x1, y1, x2, y2, inPos.x, inPos.y) * height;
      return y;
    } catch {
      console.log({
        x1,
        x2,
        y1,
        y2,
        inPos,
        heightMap: heightMap,
        resolution: resolution,
      });
      throw new Error("Heightmap selection error, check logs");
    }
  };

  const heightMapNormalBuffer = calcNormals(
    heightMap,
    resolution,
    size,
    height
  );

  const getNormal = (i: number, j: number) => {
    const index = i * resolution + j;
    const x = heightMapNormalBuffer[index * 4 + 0];
    const y = heightMapNormalBuffer[index * 4 + 1];
    const z = heightMapNormalBuffer[index * 4 + 2];
    return new Vector3(x, y, z);
  };

  const getNormalAtCoordinates = (x: number, z: number) => {
    const inPos = new Vector2(x, z);
    inPos
      .addInPlace(new Vector2(size / 2, size / 2))
      .divideInPlace(new Vector2(size, size))
      .scaleInPlace(resolution - 1);

    if (inPos.x < 0 || inPos.x > resolution - 1) return Vector3.Up();
    if (inPos.y < 0 || inPos.y > resolution - 1) return Vector3.Up();

    const x1 = Math.floor(inPos.x);
    const x2 = Math.ceil(inPos.x);
    const y1 = Math.floor(inPos.y);
    const y2 = Math.ceil(inPos.y);

    if (x1 === x2 && y1 === y2) {
      return getNormal(x1, y1);
    }

    try {
      const normal = blerpVecFunc(
        getNormal,
        x1,
        y1,
        x2,
        y2,
        inPos.x,
        inPos.y
      ).normalize();
      return normal;
    } catch {
      throw new Error("Heightmap normal selection error, check logs");
    }
  };

  const heightTexture = RawTexture.CreateRTexture(
    heightMapBuffer,
    resolution,
    resolution,
    scene,
    false,
    false,
    Engine.TEXTURE_BILINEAR_SAMPLINGMODE,
    Engine.TEXTURETYPE_FLOAT
  );
  const heightMapNormalTexture = RawTexture.CreateRGBATexture(
    heightMapNormalBuffer,
    resolution,
    resolution,
    scene,
    false,
    false,
    Engine.TEXTURE_BILINEAR_SAMPLINGMODE,
    Engine.TEXTURETYPE_FLOAT
  );

  assets.terrains[hash] = {
    terrainResolution: resolution,
    terrainSize: size,
    terrainHeightScale: height,
    heightMap: heightMap,
    heightMapNormalBuffer,
    getHeightAtCoordinates,
    getNormalAtCoordinates,
    heightMapTexture: heightTexture,
    heightMapNormalTexture,
  };
};

export const useTerrainAsset = (assetDefinition: TerrainAssetDefinition) => {
  const assets = useAssets();
  return getAsset(assets, assetDefinition) as TerrainAsset;
};

export const useTerrainAssetArray = (
  assetDefinitions: TerrainAssetDefinition[]
) => {
  const assets = useAssets();
  return assetDefinitions.map((assetDefinition) =>
    getAsset(assets, assetDefinition)
  ) as TerrainAsset[];
};
