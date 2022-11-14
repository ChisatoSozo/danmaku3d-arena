import { Scene, Texture } from "@babylonjs/core";
import hash from "object-hash";
import { getAsset, useAssets } from "../hooks/useAsset";
import { Assets } from "../types/Assets";
import { VectorAssetDefinition } from "../types/gameDefinition/AssetDefinition";
import { generateVectorTexture } from "./vectorGenerators";

export const hashVector = (vectorAssetDefinition: VectorAssetDefinition) => {
    return hash(vectorAssetDefinition);
};
export const vectorLoaded = (assetDefinition: VectorAssetDefinition, assets: Assets) => {
    const hash = hashVector(assetDefinition);
    if (assets.textures[hash]) {
        assetDefinition.hash = hash;
        return true;
    }

    return false;
};

export const loadVector = async (
    gameDefinitionName: string,
    assetDefinition: VectorAssetDefinition,
    scene: Scene,
    assets: Assets
) => {
    const hash = hashVector(assetDefinition);
    const texture = generateVectorTexture(assetDefinition.generator, scene);
    texture.name = hash;
    assets.textures[hash] = texture;
    assetDefinition.hash = hash;
};

export const useVectorAsset = (assetDefinition: VectorAssetDefinition) => {
    const assets = useAssets();
    return getAsset(assets, assetDefinition) as Texture;
};

export const useVectorAssetArray = (assetDefinitions: VectorAssetDefinition[]) => {
    const assets = useAssets();
    return assetDefinitions.map((assetDefinition) => getAsset(assets, assetDefinition)) as Texture[];
};
