import { AssetContainer, Sound, Texture } from "@babylonjs/core";
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
}

export const makeDefaultAssets = (): Assets => ({
    sounds: {},
    meshes: {},
    bulletPatterns: {},
    textures: {},
    glsl: {},
});
