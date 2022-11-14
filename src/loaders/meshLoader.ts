import { Scene, SceneLoader } from "@babylonjs/core";
import { getAsset, useAssets } from "../hooks/useAsset";
import { Assets, MeshAdditionalData, MeshAsset } from "../types/Assets";
import { MeshAssetDefinition } from "../types/gameDefinition/AssetDefinition";
import { assetHost } from "../utils/Utils";

export const hashMesh = (meshAssetDefinition: MeshAssetDefinition) => {
    return meshAssetDefinition.url;
};
export const meshLoaded = (assetDefinition: MeshAssetDefinition, assets: Assets) => {
    const hash = hashMesh(assetDefinition);
    if (assets.meshes[hash]) {
        assetDefinition.hash = hash;
        return true;
    }

    return false;
};
export const loadMesh = (
    gameDefinitionName: string,
    assetDefinition: MeshAssetDefinition,
    scene: Scene,
    assets: Assets
) => {
    return new Promise<boolean>((resolve) => {
        const hash = hashMesh(assetDefinition);
        const root = `${assetHost}${gameDefinitionName}/meshes/`;
        const URI = assetDefinition.url;
        SceneLoader.LoadAssetContainer(root, URI, scene, async (container) => {
            assetDefinition.hash = hash;

            let additionalData: MeshAdditionalData | undefined;

            try {
                const URINoExtension = URI.substring(0, URI.lastIndexOf("."));
                const JSONURI = `${root}${URINoExtension}.json`;
                const response = await fetch(JSONURI);
                const json = await response.json();
                additionalData = json;
            } catch (e) {
                //nothing
            }

            assets.meshes[hash] = {
                container,
                additionalData,
            };

            resolve(true);
        });
    });
};

export const useMeshAsset = (assetDefinition: MeshAssetDefinition) => {
    const assets = useAssets();
    return getAsset(assets, assetDefinition) as MeshAsset;
};

export const useMeshAssetArray = (assetDefinitions: MeshAssetDefinition[]) => {
    const assets = useAssets();
    return assetDefinitions.map((assetDefinition) => getAsset(assets, assetDefinition)) as MeshAsset[];
};
