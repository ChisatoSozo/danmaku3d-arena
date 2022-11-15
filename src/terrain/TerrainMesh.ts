/* eslint-disable no-loop-func */
import { BoundingInfo, Mesh, Nullable, Vector3, VertexData } from "@babylonjs/core";
import { Observer } from "@babylonjs/core/Misc/observable";
import { Scene } from "@babylonjs/core/scene";
import { useEffect } from "react";
import { useScene } from "react-babylonjs";
import { useAssets } from "../hooks/useAsset";
import { useTerrainData } from "../hooks/useTerrainData";
import { Assets, TerrainAsset } from "../types/Assets";
import { useTerrainContext } from "./TerrainContext";
import { createTerrainMaterial } from "./TerrainMaterial";

type SquareType =
  | "bottomLeftCorner"
  | "topLeftCorner"
  | "bottomRightCorner"
  | "topRightCorner"
  | "bottomEdge"
  | "leftEdge"
  | "topEdge"
  | "rightEdge"
  | "none";

const tesselations: { [key in SquareType]: number[][] } = {
  bottomLeftCorner: [
    [0, 0],
    [1, 0],
    [1, 0.5],
    [0, 0],
    [1, 0.5],
    [1, 1],
    [0, 0],
    [1, 1],
    [0.5, 1],
    [0, 0],
    [0.5, 1],
    [0, 1],
  ],
  topLeftCorner: [
    [0, 1],
    [0, 0],
    [0.5, 0],
    [0, 1],
    [0.5, 0],
    [1, 0],
    [0, 1],
    [1, 0],
    [1, 0.5],
    [0, 1],
    [1, 0.5],
    [1, 1],
  ],
  bottomRightCorner: [
    [1, 0],
    [1, 1],
    [0.5, 1],
    [1, 0],
    [0.5, 1],
    [0, 1],
    [1, 0],
    [0, 1],
    [0, 0.5],
    [1, 0],
    [0, 0.5],
    [0, 0],
  ],
  topRightCorner: [
    [1, 0],
    [1, 1],
    [0.5, 0],
    [0.5, 0],
    [1, 1],
    [0, 0],
    [0, 0],
    [1, 1],
    [0, 0.5],
    [0, 0.5],
    [1, 1],
    [0, 1],
  ],
  bottomEdge: [
    [0, 0],
    [1, 0],
    [0.5, 0.5],
    [0, 0],
    [0.5, 0.5],
    [0, 0.5],
    [0, 0.5],
    [0.5, 0.5],
    [0, 1],
    [0, 1],
    [0.5, 0.5],
    [0.5, 1],
    [0.5, 1],
    [0.5, 0.5],
    [1, 1],
    [1, 1],
    [0.5, 0.5],
    [1, 0.5],
    [1, 0.5],
    [0.5, 0.5],
    [1, 0],
  ],
  leftEdge: [
    [0, 1],
    [0, 0],
    [0.5, 0.5],
    [0, 1],
    [0.5, 0.5],
    [0.5, 1],
    [0.5, 1],
    [0.5, 0.5],
    [1, 1],
    [1, 1],
    [0.5, 0.5],
    [1, 0.5],
    [1, 0.5],
    [0.5, 0.5],
    [1, 0],
    [1, 0],
    [0.5, 0.5],
    [0.5, 0],
    [0.5, 0],
    [0.5, 0.5],
    [0, 0],
  ],
  topEdge: [
    [1, 1],
    [0, 1],
    [0.5, 0.5],
    [1, 1],
    [0.5, 0.5],
    [1, 0.5],
    [1, 0.5],
    [0.5, 0.5],
    [1, 0],
    [1, 0],
    [0.5, 0.5],
    [0.5, 0],
    [0.5, 0],
    [0.5, 0.5],
    [0, 0],
    [0, 0],
    [0.5, 0.5],
    [0, 0.5],
    [0, 0.5],
    [0.5, 0.5],
    [0, 1],
  ],
  rightEdge: [
    [1, 0],
    [1, 1],
    [0.5, 0.5],
    [1, 0],
    [0.5, 0.5],
    [0.5, 0],
    [0.5, 0],
    [0.5, 0.5],
    [0, 0],
    [0, 0],
    [0.5, 0.5],
    [0, 0.5],
    [0, 0.5],
    [0.5, 0.5],
    [0, 1],
    [0, 1],
    [0.5, 0.5],
    [0.5, 1],
    [0.5, 1],
    [0.5, 0.5],
    [1, 1],
  ],
  none: [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 0],
    [1, 1],
    [0, 1],
  ],
};

interface SquareDef {
  squareType: SquareType;
  bottomLeft: number[];
}

const constructRing = (ring: number, ringSize: number) => {
  const squares: SquareDef[] = [];

  if (ring !== 0) {
    //leftEdge
    for (let y = -ring; y < ring; y += ringSize) {
      const x = -ring - ringSize;
      squares.push({
        squareType: "leftEdge",
        bottomLeft: [x, y],
      });
    }
    //rightEdge
    for (let y = -ring; y < ring; y += ringSize) {
      const x = ring;
      squares.push({
        squareType: "rightEdge",
        bottomLeft: [x, y],
      });
    }
    //bottomEdge
    for (let x = -ring; x < ring; x += ringSize) {
      const y = -ring - ringSize;
      squares.push({
        squareType: "bottomEdge",
        bottomLeft: [x, y],
      });
    }
    //topEdge
    for (let x = -ring; x < ring; x += ringSize) {
      const y = ring;
      squares.push({
        squareType: "topEdge",
        bottomLeft: [x, y],
      });
    }
  }

  //bottomLeft
  squares.push({
    squareType: "bottomLeftCorner",
    bottomLeft: [-ring - ringSize, -ring - ringSize],
  });
  //bottomRight
  squares.push({
    squareType: "bottomRightCorner",
    bottomLeft: [ring, -ring - ringSize],
  });
  //topLeft
  squares.push({
    squareType: "topLeftCorner",
    bottomLeft: [-ring - ringSize, ring],
  });
  //bottomRight
  squares.push({
    squareType: "topRightCorner",
    bottomLeft: [ring, ring],
  });
  return squares;
};

export const TerrainMeshComponent = () => {
  const scene = useScene();
  const assets = useAssets();
  const { setGround } = useTerrainContext();
  const terrainData = useTerrainData();

  useEffect(() => {
    if (!scene || !terrainData) return;
    const terrain = new TerrainMesh(
      "terrain",
      terrainData,
      [0.1, 0.2, 0.3, 0.4],
      (newTerrain) => {
        setGround(newTerrain);
      },
      assets,
      scene
    );

    return () => {
      terrain.dispose();
    };
  }, [assets, scene, setGround, terrainData]);
  return null;
};

/**
 * Mesh representing the ground
 */
export class TerrainMesh extends Mesh {
  public terrainData: TerrainAsset;
  public assets: Assets;
  public observer: Nullable<Observer<Scene>> = null;

  constructor(
    name: string,
    terrainData: TerrainAsset,
    lods: number[],
    onFinish: (ref: TerrainMesh) => void,
    assets: Assets,
    scene: Scene
  ) {
    super(name, scene);
    this.assets = assets;
    this.terrainData = terrainData;
    this.receiveShadows = true;
    this.init(terrainData, lods, scene).then(() => onFinish(this));
  }

  private init = async (terrainData: TerrainAsset, lods: number[], scene: Scene) => {
    if (!this.terrainData.terrainResolution || !this.terrainData.terrainSize) throw new Error("terrain not ready");
    const material = createTerrainMaterial(terrainData, lods, scene);

    const positions: number[] = [];
    const normals: number[] = [];
    const indicies: number[] = [];
    let curIndex = 0;
    const positionsMap: { [key: string]: number } = {};

    let lastLod = 0;
    let ring = 0;
    while (ring < (this.terrainData.terrainResolution - 1) / 2) {
      const ringPerc = ring / (this.terrainData.terrainResolution / 2);
      let curLod = 0;
      lods.forEach((lod, i) => {
        if (ringPerc >= lod) {
          curLod = i + 1;
        }
      });

      if (curLod - lastLod > 1) {
        curLod = lastLod + 1;
      }

      const ringSize = Math.pow(2, curLod);
      const squares = constructRing(ring, ringSize);

      squares.forEach((square) => {
        const [x, y] = square.bottomLeft;
        const squareCoords = curLod === lastLod ? tesselations.none : tesselations[square.squareType];
        squareCoords.forEach((coord) => {
          if (!this.terrainData.terrainResolution) throw new Error("terrainData not set");
          const i = coord[0] * ringSize + x;
          const j = coord[1] * ringSize + y;
          const positionLookup = `${i},${j}`;
          const index = positionsMap[positionLookup];
          if (index) {
            indicies.push(index);
          } else {
            positionsMap[positionLookup] = curIndex;
            indicies.push(curIndex);
            positions.push(i + (this.terrainData.terrainResolution - 1) / 2, 0, j + (this.terrainData.terrainResolution - 1) / 2);
            normals.push(0, 1, 0);
            curIndex++;
          }
        });
      });

      ring += ringSize;
      lastLod = curLod;
    }

    const vertexData = new VertexData();

    vertexData.positions = positions;

    vertexData.indices = indicies;
    vertexData.normals = normals;

    vertexData.applyToMesh(this);

    this.alwaysSelectAsActiveMesh = true;
    //@ts-ignore
    this.material = material;
    this.scaling = new Vector3(
      this.terrainData.terrainSize / this.terrainData.terrainResolution,
      1,
      this.terrainData.terrainSize / this.terrainData.terrainResolution
    );
    this.position = new Vector3(-this.terrainData.terrainSize / 2, 0, -this.terrainData.terrainSize / 2);

    return;
  };

  /**
   * "TerrainMesh"
   * @returns "TerrainMesh"
   */
  public getClassName(): string {
    return "TerrainMesh";
  }

  public getBoundingInfo = () => {
    if (!this.terrainData.terrainSize) throw new Error("terrainData not set");
    return new BoundingInfo(
      new Vector3(-this.terrainData.terrainSize / 2, this.position.y, -this.terrainData.terrainSize / 2),
      new Vector3(
        this.terrainData.terrainSize / 2,
        this.position.y + this.terrainData.terrainSize,
        this.terrainData.terrainSize / 2
      )
    );
  };
}
