import { AnimationGroup, Mesh, Scene, SceneLoader, Skeleton, TransformNode } from "@babylonjs/core";
import { useMemo } from "react";
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
export const loadMesh = (gameDefinitionName: string, assetDefinition: MeshAssetDefinition, scene: Scene, assets: Assets) => {
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

const extractMesh = (meshAsset: TransformNode | Mesh) => {
  if (meshAsset instanceof Mesh) {
    return [meshAsset];
  }
  if (meshAsset instanceof TransformNode) {
    const children = meshAsset.getChildren(undefined, false);
    return children.filter((child) => child instanceof Mesh) as Mesh[];
  }
  throw new Error("extractMesh: meshAsset did not contain a mesh");
};

export interface Model {
  mesh: Mesh;
  animationGroups: AnimationGroup[] | undefined;
  animationSkeleton: Skeleton | undefined;
}

const getAllChildMeshes = (meshAsset: TransformNode | Mesh) => {
  const meshes = [];
  if (meshAsset instanceof Mesh) {
    if (meshAsset.geometry) {
      meshAsset.parent = null;
      meshes.push(meshAsset);
    }
  }
  meshAsset.getChildMeshes(false).forEach((mesh) => {
    if (mesh instanceof Mesh) {
      if (mesh.geometry) {
        mesh.parent = null;
        meshes.push(mesh);
      }
    }
  });
  return meshes;
};

export const useInstantiateMeshArray = (meshAssets: MeshAsset[]) => {
  return useMemo(() => {
    return meshAssets.map((meshAsset) => {
      const meshInstances = meshAsset.container.instantiateModelsToScene();
      return getAllChildMeshes(meshInstances.rootNodes[0]);
    });
  }, [meshAssets]);
};

export const useInstantiateFirstMesh = (meshAsset: MeshAsset) => {
  return useMemo(() => {
    return instantiateFirstMesh(meshAsset);
  }, [meshAsset]);
};

export const instantiateFirstMesh = (meshAsset: MeshAsset) => {
  const meshInstances = meshAsset.container.instantiateModelsToScene();
  const childMesh = getAllChildMeshes(meshInstances.rootNodes[0]).find((mesh) => mesh.geometry);
  if (!childMesh) {
    throw new Error("useInstantiateFirstMesh: meshAsset did not contain a mesh");
  }
  childMesh.parent = null;
  return childMesh;
};
