import { Scene } from "@babylonjs/core";
import { useEffect } from "react";
import { useScene } from "react-babylonjs";

export const useDeltaBeforeRender = (
  func: (scene: Scene, deltaS: number) => void,
  deps: any[]
) => {
  const scene = useScene();
  useEffect(() => {
    if (!scene) return;
    const observable = scene.onBeforeRenderObservable.add((scene) => {
      const deltaS = scene.getEngine().getDeltaTime() / 1000 || 0;
      func(scene, deltaS);
    });

    return () => {
      scene.onBeforeRenderObservable.remove(observable);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, ...deps]);
};
