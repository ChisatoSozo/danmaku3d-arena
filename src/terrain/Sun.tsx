/* eslint-disable @typescript-eslint/no-explicit-any */
import { CascadedShadowGenerator, DirectionalLight, Vector3 } from "@babylonjs/core";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";
import { useDeltaBeforeRender } from "../hooks/useDeltaBeforeRender";

interface IShadowContext {
  addShadowCaster: (mesh: AbstractMesh) => void;
}

export const ShadowContext = React.createContext<IShadowContext>({
  addShadowCaster: () => {
    return;
  },
});

const shadowLength = 2000;
const shadowUpdate = 1;

export const Sun = ({ children }: PropsWithChildren<{}>) => {
  const sunRef = useRef<DirectionalLight>(null);
  const [shadowGenerator, setShadowGenerator] = useState<CascadedShadowGenerator>();
  const [newShadowCasters, setNewShadowCasters] = useState<AbstractMesh[]>([]);
  const frameRef = useRef(-1);

  const addShadowCaster = useCallback((mesh: AbstractMesh) => {
    (mesh as any).castsShadows = true;
  }, []);

  useEffect(() => {
    if (!sunRef.current) return;

    const shadowGenerator = new CascadedShadowGenerator(2048, sunRef.current);
    shadowGenerator.lambda = 0.9;
    shadowGenerator.numCascades = 4;
    shadowGenerator.autoCalcDepthBounds = true;
    shadowGenerator.depthClamp = true;
    shadowGenerator.bias = 0.001;
    shadowGenerator.shadowMaxZ = shadowLength;
    shadowGenerator.filter = 6;
    shadowGenerator.splitFrustum();

    setShadowGenerator(shadowGenerator);
  }, []);

  useDeltaBeforeRender(
    (scene, deltaS) => {
      frameRef.current += deltaS;
      const shadowMap = shadowGenerator?.getShadowMap();
      if (
        (frameRef.current === -1 || frameRef.current > shadowUpdate) &&
        scene.activeCamera?.globalPosition &&
        shadowGenerator &&
        shadowMap
      ) {
        frameRef.current = 0;
        const meshes = scene.meshes;

        shadowMap.renderList = [];
        meshes.forEach((mesh) => {
          if ((mesh as any).castsShadows) {
            shadowGenerator.addShadowCaster(mesh);
          }
        });
      }
    },
    [shadowGenerator]
  );

  useEffect(() => {
    if (!shadowGenerator) return;
    newShadowCasters.forEach((shadowCaster) => {
      shadowGenerator.addShadowCaster(shadowCaster);
    });
    if (newShadowCasters.length) setNewShadowCasters([]);
  }, [newShadowCasters, shadowGenerator]);

  return (
    <ShadowContext.Provider value={{ addShadowCaster }}>
      <directionalLight ref={sunRef} name="sun" intensity={0.7} direction={new Vector3(0, -1, -1)} />
      {children}
    </ShadowContext.Provider>
  );
};
