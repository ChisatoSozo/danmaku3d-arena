import { defaultAssets } from "../../utils/DefaultAssets";
import { BulletPatternAssetDefinition } from "./AssetDefinition";
import { EditorInstruction } from "./CommonDefinition";
import { IVector3 } from "./UtilTypes";

export type EnemyMoveToInstruction = {
    type: "moveTo";
    position: IVector3;
    speed: number;
};

export const makeMoveToInstruction = (): EnemyMoveToInstruction => ({
    type: "moveTo",
    position: { x: 5, y: 5, z: 0 },
    speed: 1,
});

export type EnemyAttackInstruction = {
    type: "attack";
    bulletPattern: BulletPatternAssetDefinition;
};

export const makeEnemyAttackInstruction = (): EnemyAttackInstruction => ({
    type: "attack",
    bulletPattern: {
        type: "bulletPattern",
        isAsset: true,
        url: defaultAssets.bulletPattern,
    },
});

export type EnemyLeaveInstruction = {
    type: "leave";
};

export const makeEnemyLeaveInstruction = (): EnemyLeaveInstruction => ({
    type: "leave",
});

export type BaseEnemyInstruction = EnemyMoveToInstruction | EnemyAttackInstruction | EnemyLeaveInstruction;

export type EnemyInstruction = BaseEnemyInstruction & EditorInstruction;
