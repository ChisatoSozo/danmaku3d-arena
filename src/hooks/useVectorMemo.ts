import { Vector3 } from "@babylonjs/core";
import { useMemo } from "react";
import { IVector3 } from "../types/gameDefinition/UtilTypes";

export const useVectorMemo = (vector: IVector3) => {
  return useMemo(() => new Vector3(vector.x, vector.y, vector.z), [vector]);
};
