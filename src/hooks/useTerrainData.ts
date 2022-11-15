import { useMemo } from "react";
import { useAssets } from "./useAsset";

export const useTerrainData = () => {
  const assets = useAssets();
  const terrainData = useMemo(() => {
    return Object.values(assets.terrains)[0];
  }, [assets]);
  if (!terrainData) throw new Error("Terrain data not loaded");
  return terrainData;
};
