import { AssetContainer, Sound, Texture, Vector3 } from "@babylonjs/core";
import { GLSLAssetDefinition } from "./gameDefinition/AssetDefinition";
import { BulletPatternDefinition } from "./gameDefinition/BulletPatternDefinition";

export interface MeshAdditionalData {
  animations?: {
    [key: string]: string;
  };
}

export interface MeshAsset {
  container: AssetContainer;
  additionalData?: MeshAdditionalData;
}

export type BulletPatternAsset = {
  positionFunctionGLSL: GLSLAssetDefinition;
  velocityFunctionGLSL: GLSLAssetDefinition;
  collisionFunctionGLSL: GLSLAssetDefinition;
} & BulletPatternDefinition;

export type TerrainAsset = {
  heightMap: number[][];
  heightMapNormalBuffer: Float32Array;
  terrainResolution: number;
  terrainSize: number;
  terrainHeightScale: number;
  heightMapTexture: Texture;
  heightMapNormalTexture: Texture;
  getHeightAtCoordinates: (x: number, z: number) => number;
  getNormalAtCoordinates: (x: number, z: number) => Vector3;
};

export type GLSLAsset = {
  shader: string;
};

export interface Assets {
  sounds: { [key: string]: Sound };
  meshes: {
    [key: string]: MeshAsset;
  };
  bulletPatterns: { [key: string]: BulletPatternAsset };
  textures: { [key: string]: Texture };
  glsl: { [key: string]: GLSLAsset };
  terrains: { [key: string]: TerrainAsset };
}

export const makeDefaultAssets = (): Assets => ({
  sounds: {},
  meshes: {},
  bulletPatterns: {},
  textures: {},
  glsl: {},
  terrains: {},
});
