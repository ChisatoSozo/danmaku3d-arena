import { Scene } from "@babylonjs/core/scene";
import { useEffect, useState } from "react";
import { useScene } from "react-babylonjs";
import { useDeltaBeforeRender } from "../hooks/useDeltaBeforeRender";
import { useTerrainData } from "../hooks/useTerrainData";
import { useMeshAsset } from "../loaders/meshLoader";
import { MeshAsset, TerrainAsset } from "../types/Assets";
import { MeshAssetDefinition } from "../types/gameDefinition/AssetDefinition";
import { Grass } from "./Grass";

type TerrainGrassComponentProps = {
  grassMeshDefinition: MeshAssetDefinition;
};

export const TerrainGrassComponent = ({ grassMeshDefinition }: TerrainGrassComponentProps) => {
  const terrainData = useTerrainData();
  const meshAsset = useMeshAsset(grassMeshDefinition);
  const scene = useScene();
  const [grass, setGrass] = useState<LODGrass>();

  useEffect(() => {
    if (!scene || !terrainData || !meshAsset) return;
    const grass = new LODGrass(meshAsset, scene, terrainData);
    setGrass(grass);
    return () => {
      grass.dispose();
      setGrass(undefined);
    };
  }, [meshAsset, scene, terrainData]);

  useDeltaBeforeRender(
    (scene, deltaS) => {
      grass?.update(deltaS);
    },
    [grass]
  );

  return null;
};

const maxLod = 4;
const distPerLod = 8;
export class LODGrass {
  public grasses: Grass[];

  constructor(grass: MeshAsset, scene: Scene, terrainData: TerrainAsset) {
    this.grasses = [];
    for (let i = 0; i < maxLod; i++) {
      let grassStart = Math.pow(2, i);
      if (grassStart === 1) grassStart = 0;

      const grassEnd = Math.pow(2, i + 1);

      const lodPow = Math.pow(2, i);
      const stretching = (i + 1) * (i + 1);
      const density = 6 / lodPow;
      this.grasses.push(new Grass(grass, scene, terrainData, grassStart * distPerLod, grassEnd * distPerLod, density, stretching));
    }
  }
  update(time: number) {
    this.grasses.forEach((grass) => grass.update(time));
  }
  dispose(): void {
    this.grasses.forEach((grass) => grass.dispose());
  }
}
