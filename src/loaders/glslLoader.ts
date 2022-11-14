import { Effect, Scene } from "@babylonjs/core";
import { getAsset, useAssets } from "../hooks/useAsset";
import { Assets, GLSLAsset } from "../types/Assets";
import { GLSLAssetDefinition, ShaderType } from "../types/gameDefinition/AssetDefinition";
import { assetHost } from "../utils/Utils";

export const hashGLSL = (glslAssetDefinition: GLSLAssetDefinition) => {
    return glslAssetDefinition.url + glslAssetDefinition.shaderType;
};
export const manualHashGLSL = (name: string, shaderType: ShaderType) => {
    return name + shaderType;
};
export const glslLoaded = (assetDefinition: GLSLAssetDefinition, assets: Assets) => {
    const hash = hashGLSL(assetDefinition);
    if (assets.glsl[hash]) {
        assetDefinition.hash = hash;
        return true;
    }

    return false;
};

const shaderTypeToSuffixMap: { [key in ShaderType]: string } = {
    vertex: "VertexShader",
    fragment: "FragmentShader",
    pixel: "PixelShader",
};

export const loadGLSL = async (
    gameDefinitionName: string,
    assetDefinition: GLSLAssetDefinition,
    scene: Scene,
    assets: Assets
) => {
    const hash = hashGLSL(assetDefinition);
    const URI = `${assetHost}${gameDefinitionName}/glsl/${assetDefinition.url}`;
    const response = await fetch(URI);
    if (!response.ok) throw new Error(`Failed to load ${URI}: ${response.statusText}`);
    const glsl = await response.text();
    const shaderName = hash + shaderTypeToSuffixMap[assetDefinition.shaderType];
    assets.glsl[hash] = {
        shader: hash,
    };
    Effect.ShadersStore[shaderName] = glsl;
    assetDefinition.hash = hash;
};

export const manualLoadGLSL = (glslName: string, glslContent: string, shaderType: ShaderType, assets: Assets) => {
    const hash = manualHashGLSL(glslName, shaderType);
    const glsl = glslContent;
    const shaderName = hash + shaderTypeToSuffixMap[shaderType];
    assets.glsl[hash] = {
        shader: hash,
    };
    Effect.ShadersStore[shaderName] = glsl;
    return hash;
};

export const useGLSLAsset = (assetDefinition: GLSLAssetDefinition) => {
    const assets = useAssets();
    return getAsset(assets, assetDefinition) as GLSLAsset;
};

export const useGLSLAssetArray = (assetDefinitions: GLSLAssetDefinition[]) => {
    const assets = useAssets();
    return assetDefinitions.map((assetDefinition) => getAsset(assets, assetDefinition)) as GLSLAsset[];
};
