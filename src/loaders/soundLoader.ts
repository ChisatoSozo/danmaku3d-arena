import { Scene, Sound } from "@babylonjs/core";
import { LimitSound } from "../components/LimitSound";
import { getAsset, useAssets } from "../hooks/useAsset";
import { Assets } from "../types/Assets";
import { SoundAssetDefinition } from "../types/gameDefinition/AssetDefinition";
import { assetHost } from "../utils/Utils";

export const hashSound = (soundAssetDefinition: SoundAssetDefinition) => {
  return soundAssetDefinition.url;
};
export const soundLoaded = (
  assetDefinition: SoundAssetDefinition,
  assets: Assets
) => {
  const hash = hashSound(assetDefinition);
  if (assets.sounds[hash]) {
    assetDefinition.hash = hash;
    return true;
  }

  return false;
};
export const loadSound = (
  gameDefinitionName: string,
  assetDefinition: SoundAssetDefinition,
  scene: Scene,
  assets: Assets
) => {
  return new Promise<boolean>((resolve) => {
    const hash = hashSound(assetDefinition);
    const URI = `${assetHost}${gameDefinitionName}/sounds/${assetDefinition.url}`;
    const sound = new Sound(
      hash,
      URI,
      scene,
      () => {
        assets.sounds[hash] = sound;
        assetDefinition.hash = hash;
        resolve(true);
      },
      {
        autoplay: false,
      }
    );
  });
};

export const useSoundAsset = (assetDefinition: SoundAssetDefinition) => {
  const assets = useAssets();
  return getAsset(assets, assetDefinition) as Sound;
};

export const useLimitSoundAsset = (
  assetDefinition: SoundAssetDefinition,
  limit: number
) => {
  const assets = useAssets();
  return new LimitSound(getAsset(assets, assetDefinition) as Sound, limit);
};

export const useSoundAssetArray = (
  assetDefinitions: SoundAssetDefinition[]
) => {
  const assets = useAssets();
  return assetDefinitions.map((assetDefinition) =>
    getAsset(assets, assetDefinition)
  ) as Sound[];
};
