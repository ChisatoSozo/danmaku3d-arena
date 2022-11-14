import { useContext } from "react";
import { AssetsContext } from "../containers/GameContainer";
import { Assets } from "../types/Assets";
import { AnyAssetDefinition } from "../types/gameDefinition/AssetDefinition";
import { assertNever } from "../utils/Utils";

export const useAssets = () => useContext(AssetsContext);

export const getAsset = (assets: Assets, assetDefinition: AnyAssetDefinition) => {
    const hash = assetDefinition.hash;
    if (!hash) {
        throw new Error(`Asset ${hash} was never loaded`);
    }
    if (assetDefinition.type === "sound") {
        if (!assets.sounds[hash]) throw new Error(`Sound ${hash} was never loaded`);
        return assets.sounds[hash];
    } else if (assetDefinition.type === "mesh") {
        if (!assets.meshes[hash]) throw new Error(`Mesh ${hash} was never loaded`);
        return assets.meshes[hash];
    } else if (assetDefinition.type === "glsl") {
        if (!assets.glsl[hash]) throw new Error(`GLSL ${hash} was never loaded`);
        return assets.glsl[hash];
    } else if (assetDefinition.type === "texture") {
        if (!assets.textures[hash]) throw new Error(`Texture ${hash} was never loaded`);
        return assets.textures[hash];
    } else if (assetDefinition.type === "vector") {
        if (!assets.textures[hash]) throw new Error(`Vector ${hash} was never loaded`);
        return assets.textures[hash];
    } else if (assetDefinition.type === "timing") {
        if (!assets.textures[hash]) throw new Error(`Timing ${hash} was never loaded`);
        return assets.textures[hash];
    } else if (assetDefinition.type === "bulletPattern") {
        if (!assets.bulletPatterns[hash]) throw new Error(`Bullet Pattern ${hash} was never loaded`);
        return assets.bulletPatterns[hash];
    } else {
        assertNever(assetDefinition);
    }
};
