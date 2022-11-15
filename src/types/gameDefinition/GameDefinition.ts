import { defaultAssets } from "../../utils/DefaultAssets";
import {
  makeMeshAssetDefinition,
  makeSoundAssetDefinition,
  MeshAssetDefinition,
  SoundAssetDefinition,
  TerrainAssetDefinition,
} from "./AssetDefinition";
import { EditorInstruction } from "./CommonDefinition";
import { EnemyInstruction } from "./EnemyDefinition";
import { PlayableCharacterDefinition } from "./PlayableCharacterDefinition";
import { IVector3 } from "./UtilTypes";

export type StageInstructionType = "playMusic" | "spawnEnemy";
export const stageInstructionTypes = ["playMusic", "spawnEnemy"];

export type PlayMusicInstruction = {
  type: "playMusic";
  asset: SoundAssetDefinition;
};

export const makePlayMusicInstruction = (): PlayMusicInstruction => ({
  type: "playMusic",
  asset: {
    isAsset: true,
    type: "sound",
    url: defaultAssets.music,
  },
});

export type SpawnEnemyInstruction = {
  type: "spawnEnemy";
  asset: MeshAssetDefinition;
  position: IVector3;
  hidden: boolean;
  hurtSound: SoundAssetDefinition;
  instructions: EnemyInstruction[];
};

export const makeSpawnEnemyInstruction = (): SpawnEnemyInstruction => ({
  type: "spawnEnemy",
  asset: {
    isAsset: true,
    type: "mesh",
    url: defaultAssets.mesh,
  },
  position: { x: 0, y: 5, z: 0 },
  hidden: false,
  hurtSound: makeSoundAssetDefinition(),
  instructions: [],
});

export type BaseStageInstruction = PlayMusicInstruction | SpawnEnemyInstruction;

export type StageInstruction = BaseStageInstruction & EditorInstruction;

export type PhaseDefinition = {
  delayAfter: number;
  instructions: StageInstruction[];
};

export const makePhaseDefinition = (): PhaseDefinition => ({
  delayAfter: 0,
  instructions: [],
});

export type TerrainStageDefinition = {
  type: "terrain";
  asset: TerrainAssetDefinition;
  grass: MeshAssetDefinition;
  trees: MeshAssetDefinition[];
};

export type MeshStageDefinition = {
  type: "mesh";
  asset: MeshAssetDefinition;
};

export type StageDefinition = TerrainStageDefinition | MeshStageDefinition;

export const makeStageDefinition = (): StageDefinition => ({
  type: "mesh",
  asset: makeMeshAssetDefinition(),
});

export type GameDefinition = {
  stageDefinition: StageDefinition;
  playableCharacters: PlayableCharacterDefinition[];
};
