import { Color3, Mesh, Texture } from "@babylonjs/core";
import { RefObject, useRef } from "react";
import { useScene } from "react-babylonjs";
import { useDeltaBeforeRender } from "../hooks/useDeltaBeforeRender";

interface SkyBoxProps {
  skyBoxRef?: RefObject<Mesh>;
}

export const SkyBox: React.FC<SkyBoxProps> = ({ skyBoxRef }) => {
  const scene = useScene();
  const internalSkyBoxRef = useRef<Mesh>(null);

  useDeltaBeforeRender(() => {
    const ref = skyBoxRef || internalSkyBoxRef;
    if (!ref?.current || !scene?.activeCamera) return;
    ref.current.position.copyFrom(scene.activeCamera.globalPosition.scale(0.8));
  }, [scene?.activeCamera, skyBoxRef]);

  return (
    <box
      ref={skyBoxRef || internalSkyBoxRef}
      applyFog={false}
      name="skybox"
      size={10000}
    >
      <standardMaterial
        name="skyMat"
        disableLighting={true}
        backFaceCulling={false}
        diffuseColor={new Color3(0, 0, 0)}
        specularColor={new Color3(0, 0, 0)}
      >
        <cubeTexture
          name="skyTexture"
          assignTo="reflectionTexture"
          coordinatesMode={Texture.SKYBOX_MODE}
          rootUrl="/textures/skybox/TropicalSunnyDay"
        />
      </standardMaterial>
    </box>
  );
};
