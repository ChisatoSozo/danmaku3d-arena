import { Scene, Texture } from "@babylonjs/core";
import hash from "object-hash";
import { getAsset, useAssets } from "../hooks/useAsset";
import { Assets } from "../types/Assets";
import { TimingAssetDefinition } from "../types/gameDefinition/AssetDefinition";
import { generateTimingTexture } from "./scalarGenerators";

export const hashTiming = (vectorAssetDefinition: TimingAssetDefinition) => {
    return hash(vectorAssetDefinition);
};
export const timingLoaded = (assetDefinition: TimingAssetDefinition, assets: Assets) => {
    const hash = hashTiming(assetDefinition);
    if (assets.textures[hash]) {
        assetDefinition.hash = hash;
        return true;
    }

    return false;
};

export const loadTiming = async (
    gameDefinitionName: string,
    assetDefinition: TimingAssetDefinition,
    scene: Scene,
    assets: Assets
) => {
    const hash = hashTiming(assetDefinition);
    const texture = generateTimingTexture(assetDefinition.generator, scene);
    texture.name = hash;
    assets.textures[hash] = texture;
    assetDefinition.hash = hash;
};

export const useTimingAsset = (assetDefinition: TimingAssetDefinition) => {
    const assets = useAssets();
    return getAsset(assets, assetDefinition) as Texture;
};

export const useTimingAssetArray = (assetDefinitions: TimingAssetDefinition[]) => {
    const assets = useAssets();
    return assetDefinitions.map((assetDefinition) => getAsset(assets, assetDefinition)) as Texture[];
};
