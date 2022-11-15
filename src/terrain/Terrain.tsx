import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { useMemo, useRef, useState } from "react";
import { TerrainStageDefinition } from "../types/gameDefinition/GameDefinition";
import { SkyBox } from "./SkyBox";
import { TerrainContext } from "./TerrainContext";
import { TerrainMesh, TerrainMeshComponent } from "./TerrainMesh";
import { Water } from "./Water";

export const mapSize = 8000;
export const heightScale = 640;

type TerrainProps = {
  terrainAssetDefinition: TerrainStageDefinition;
};

export const Terrain = ({ terrainAssetDefinition }: TerrainProps) => {
  const skyBoxRef = useRef<Mesh>(null);
  const [ground, setGround] = useState<TerrainMesh>();
  const providerValue = useMemo(() => ({ ground, setGround }), [ground, setGround]);

  return (
    <TerrainContext.Provider value={providerValue}>
      <TerrainMeshComponent />
      {/* <Trees mapSize={mapSize} heightScale={heightScale} terrainAssetDefinition={terrainAssetDefinition} /> */}
      <Water skyBoxRef={skyBoxRef} y={heightScale * 0.337} />
      <SkyBox skyBoxRef={skyBoxRef} />
      {/* <TerrainGrassComponent grassMeshDefinition={terrainAssetDefinition.grass} /> */}
    </TerrainContext.Provider>
  );
};
