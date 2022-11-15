import { GroundMesh, Mesh, Texture, Vector2 } from "@babylonjs/core";
import React, { RefObject, useContext, useEffect, useRef } from "react";
import { useScene } from "react-babylonjs";
import { WaterMaterial } from "../forks/WaterMaterial";
import { useVectorMemo } from "../hooks/useVectorMemo";
import { TerrainContext } from "./TerrainContext";

interface WaterProps {
  skyBoxRef: RefObject<Mesh>;
  y: number;
}

export const Water: React.FC<WaterProps> = ({ skyBoxRef, y }) => {
  const scene = useScene();
  const groundRef = useRef<GroundMesh>(null);
  const { ground } = useContext(TerrainContext);

  useEffect(() => {
    if (!groundRef.current || !scene || !ground || !skyBoxRef.current) return;

    const water = new WaterMaterial("water", scene, new Vector2(1024, 1024));
    groundRef.current.material = water;
    water.backFaceCulling = true;
    const bumpTexture = new Texture("/textures/waterbump.png", scene);
    bumpTexture.uScale = 50;
    bumpTexture.vScale = 50;
    water.bumpTexture = bumpTexture;
    water.windForce = -0.05;
    water.waveHeight = 0;
    water.bumpHeight = 1;
    water.waveLength = 0.1;
    water.colorBlendFactor = 0;
    water.useLogarithmicDepth = true;
    water.disableClipPlane = false;
    water.addToRenderList(ground);
    water.addToRenderList(skyBoxRef.current);
  }, [ground, scene, skyBoxRef]);

  const position = useVectorMemo({
    x: 0,
    y,
    z: 0,
  });

  return <ground position={position} ref={groundRef} width={10000} height={10000} name="ground" />;
};
