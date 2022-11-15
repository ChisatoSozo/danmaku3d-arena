import { Effect, Scene } from "@babylonjs/core";
import hash from "object-hash";
import { getAsset, useAssets } from "../hooks/useAsset";
import { findAndLoadAssetDefinitions } from "../hooks/useLoadGame";
import { Assets, BulletPatternAsset } from "../types/Assets";
import { BulletPatternAssetDefinition, GLSLAssetDefinition } from "../types/gameDefinition/AssetDefinition";
import {
  BulletPatternDefinition,
  EnemyBulletPatternDefinition,
  PlayerBulletPatternDefinition,
} from "../types/gameDefinition/BulletPatternDefinition";
import { BulletPhase, constructPixelShader, constructPlayerPixelShader, constructRawPixelShader } from "../utils/BabylonUtils";
import { assetHost } from "../utils/Utils";
import { manualLoadGLSL } from "./glslLoader";

const deepExcludeKeyFromObject = (obj: any, key: string) => {
  const newObj = { ...obj };
  delete newObj[key];

  for (const k in newObj) {
    if (newObj.hasOwnProperty(k)) {
      if (typeof newObj[k] === "object") {
        newObj[k] = deepExcludeKeyFromObject(newObj[k], key);
      }
    }
  }

  return newObj;
};

export const hashBulletPattern = (bulletPatternAssetDefinition: BulletPatternAssetDefinition) => {
  const newBulletPatternAssetDefinition = deepExcludeKeyFromObject(bulletPatternAssetDefinition, "hash");
  return hash(newBulletPatternAssetDefinition);
};

export const hashString = (str: string) => {
  return hash({ str });
};

export const bulletPatternLoaded = async (
  gameDefinitionName: string,
  assetDefinition: BulletPatternAssetDefinition,
  scene: Scene,
  assets: Assets,
  assetToReload: string | undefined,
  setStatus: (status: string) => void
) => {
  const hash = hashBulletPattern(assetDefinition);
  if (assets.bulletPatterns[hash]) {
    assetDefinition.hash = hash;
    const URI = `${assetHost}${gameDefinitionName}/bulletPatterns/${assetDefinition.url}`;
    const patternDefinition = (await fetch(URI).then((response) => response.json())) as BulletPatternDefinition;
    const anyUpdated = await findAndLoadAssetDefinitions(
      gameDefinitionName,
      patternDefinition,
      scene,
      assets,
      assetToReload,
      setStatus
    );
    return !anyUpdated;
  }

  return false;
};

const glslAssetDefinitionToContent = (glslAssetDefinition: GLSLAssetDefinition, assets: Assets) => {
  const hash = glslAssetDefinition.hash;
  if (!hash) throw new Error("glslAssetDefinitionToContent: hash is undefined");

  const glslAsset = assets.glsl[hash];
  if (!glslAsset) throw new Error("glslAssetDefinitionToContent: glslAsset is undefined");

  const shaderContent = Effect.ShadersStore[glslAsset.shader + "PixelShader"];
  if (!shaderContent) throw new Error("glslAssetDefinitionToContent: shaderContent is undefined");
  return shaderContent;
};

const makeEnemyBulletPatternGLSL = (patternDefinition: EnemyBulletPatternDefinition, assets: Assets) => {
  const positionPhases = patternDefinition.phases.map((phase): BulletPhase => {
    const at = phase.at;
    const positionInitializationGLSL = glslAssetDefinitionToContent(phase.positionInitializationGLSL, assets);
    const positionUpdateGLSL = glslAssetDefinitionToContent(phase.positionUpdateGLSL, assets);

    return {
      at,
      initializationFunction: positionInitializationGLSL,
      updateFunction: positionUpdateGLSL,
    };
  });

  const velocityPhases = patternDefinition.phases.map((phase): BulletPhase => {
    const at = phase.at;
    const velocityInitializationGLSL = glslAssetDefinitionToContent(phase.velocityInitializationGLSL, assets);
    const velocityUpdateGLSL = glslAssetDefinitionToContent(phase.velocityUpdateGLSL, assets);

    return {
      at,
      initializationFunction: velocityInitializationGLSL,
      updateFunction: velocityUpdateGLSL,
    };
  });

  const positionFunctionGLSL = constructPixelShader(positionPhases, "position");
  const velocityFunctionGLSL = constructPixelShader(velocityPhases, "velocity");
  return { positionFunctionGLSL, velocityFunctionGLSL };
};

const makePlayerBulletPatternGLSL = (patternDefinition: PlayerBulletPatternDefinition, assets: Assets) => {
  const positionUpdateGLSL = glslAssetDefinitionToContent(patternDefinition.positionUpdateGLSL, assets);
  const velocityUpdateGLSL = glslAssetDefinitionToContent(patternDefinition.velocityUpdateGLSL, assets);

  const positionFunctionGLSL = constructPlayerPixelShader(positionUpdateGLSL, "position");
  const velocityFunctionGLSL = constructPlayerPixelShader(velocityUpdateGLSL, "velocity");

  console.log(positionFunctionGLSL, velocityFunctionGLSL);

  return { positionFunctionGLSL, velocityFunctionGLSL };
};

const makeCollisionGLSL = (patternDefinition: BulletPatternDefinition, assets: Assets) => {
  const collisionUpdateGLSL = glslAssetDefinitionToContent(patternDefinition._collisionFunctionGLSL, assets);
  const collisionFunctionGLSL = constructRawPixelShader(collisionUpdateGLSL);

  return collisionFunctionGLSL;
};

export const loadBulletPattern = async (
  gameDefinitionName: string,
  assetDefinition: BulletPatternAssetDefinition,
  scene: Scene,
  assets: Assets,
  setStatus: (status: string) => void
) => {
  const URI = `${assetHost}${gameDefinitionName}/bulletPatterns/${assetDefinition.url}`;
  const patternDefinition = (await fetch(URI).then((response) => response.json())) as BulletPatternDefinition;
  await findAndLoadAssetDefinitions(gameDefinitionName, patternDefinition, scene, assets, undefined, setStatus);

  const hash = hashBulletPattern(assetDefinition);

  const { positionFunctionGLSL, velocityFunctionGLSL } =
    patternDefinition.bulletPatternType === "enemy"
      ? makeEnemyBulletPatternGLSL(patternDefinition, assets)
      : makePlayerBulletPatternGLSL(patternDefinition, assets);
  const collisionFunctionGLSL = makeCollisionGLSL(patternDefinition, assets);

  const positionFunctionGLSLName = hashString(positionFunctionGLSL) + "PositionFunction";
  const velocityFunctionGLSLName = hashString(velocityFunctionGLSL) + "VelocityFunction";
  const collisionFunctionGLSLName = hashString(collisionFunctionGLSL) + "CollisionFunction";

  const positionFunctionGLSLHash = manualLoadGLSL(positionFunctionGLSLName, positionFunctionGLSL, "pixel", assets);
  const velocityFunctionGLSLHash = manualLoadGLSL(velocityFunctionGLSLName, velocityFunctionGLSL, "pixel", assets);
  const collisionFunctionGLSLHash = manualLoadGLSL(collisionFunctionGLSLName, collisionFunctionGLSL, "pixel", assets);

  const bulletPattern: BulletPatternAsset = {
    ...patternDefinition,
    positionFunctionGLSL: {
      isAsset: true,
      hash: positionFunctionGLSLHash,
      type: "glsl",
      shaderType: "pixel",
      url: "",
    },
    velocityFunctionGLSL: {
      isAsset: true,
      hash: velocityFunctionGLSLHash,
      type: "glsl",
      shaderType: "pixel",
      url: "",
    },
    collisionFunctionGLSL: {
      isAsset: true,
      hash: collisionFunctionGLSLHash,
      type: "glsl",
      shaderType: "pixel",
      url: "",
    },
  };

  assets.bulletPatterns[hash] = bulletPattern;
  assetDefinition.hash = hash;
};

export const useBulletPatternAsset = (assetDefinition: BulletPatternAssetDefinition) => {
  const assets = useAssets();
  return getAsset(assets, assetDefinition) as BulletPatternAsset;
};

export const useBulletPatternAssetArray = (assetDefinitions: BulletPatternAssetDefinition[]) => {
  const assets = useAssets();
  return assetDefinitions.map((assetDefinition) => getAsset(assets, assetDefinition)) as BulletPatternAsset[];
};
