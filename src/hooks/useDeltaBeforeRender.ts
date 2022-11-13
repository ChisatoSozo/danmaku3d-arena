import { Scene } from "@babylonjs/core";
import { useBeforeRender } from "react-babylonjs";

export const useDeltaBeforeRender = (
  func: (scene: Scene, deltaS: number) => void
) => {
  useBeforeRender((scene) => {
    const deltaS = scene.getEngine().getDeltaTime() / 1000 || 0;
    func(scene, deltaS);
  });
};
