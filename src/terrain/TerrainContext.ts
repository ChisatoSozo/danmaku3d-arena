import React, { Dispatch, SetStateAction, useContext } from "react";
import { TerrainMesh } from "./TerrainMesh";

interface ITerrainContext {
  ground: TerrainMesh | undefined;
  setGround: Dispatch<SetStateAction<TerrainMesh | undefined>>;
}

export const TerrainContext = React.createContext<ITerrainContext>({
  ground: undefined,
  setGround: () => {
    return;
  },
});

export const useTerrainContext = () => {
  const { ground, setGround } = useContext(TerrainContext);

  return { ground, setGround };
};
