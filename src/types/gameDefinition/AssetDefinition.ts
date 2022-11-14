import { defaultAssets } from "../../utils/DefaultAssets";
import { TimingGenerator, VectorGenerator } from "./BulletPatternDefinition";

export type AssetType = "mesh" | "sound" | "texture" | "bulletPattern" | "glsl" | "timing" | "vector";
export type ShaderType = "vertex" | "fragment" | "pixel";

export type BaseAssetDefinition<T extends AssetType> = {
    isAsset: true;
    hash?: string;
    type: T;
};

export type GLSLAssetDefinition = BaseAssetDefinition<"glsl"> & {
    shaderType: ShaderType;
    url: string;
};

export const makeGLSLAssetDefinition = (url: string, shaderType: ShaderType): GLSLAssetDefinition => ({
    isAsset: true,
    type: "glsl",
    shaderType,
    url,
});

export type BulletPatternAssetDefinition = BaseAssetDefinition<"bulletPattern"> & {
    isAsset: true;
    url: string;
};

export type MeshAssetDefinition = BaseAssetDefinition<"mesh"> & {
    url: string;
};

export const makeMeshAssetDefinition = (): MeshAssetDefinition => ({
    isAsset: true,
    type: "mesh",
    url: "sphere.glb",
});

export type SoundAssetDefinition = BaseAssetDefinition<"sound"> & {
    url: string;
};

export const makeSoundAssetDefinition = (): SoundAssetDefinition => ({
    isAsset: true,
    type: "sound",
    url: defaultAssets.damageSound,
});

export type TextureAssetDefinition = BaseAssetDefinition<"texture"> & {
    url: string;
};

export type TimingAssetDefinition = BaseAssetDefinition<"timing"> & {
    generator: TimingGenerator;
};

export const makeTimingAssetDefinition = (time: number): TimingAssetDefinition => ({
    isAsset: true,
    type: "timing",
    generator: {
        type: "uniform",
        _count: 100,
        time,
    },
});

export type VectorAssetDefinition = BaseAssetDefinition<"vector"> & {
    generator: VectorGenerator;
};

export const makeVectorAssetDefinition = (count: number = 100): VectorAssetDefinition => ({
    isAsset: true,
    type: "vector",
    generator: {
        type: "burst",
        _count: count,
        radius: 1,
        startTheta: 0,
        thetaLength: 2 * Math.PI,
        startY: 1,
        yLength: 2,
    },
});

export const makeBlankVectorAssetDefinition = (count: number = 100): VectorAssetDefinition => ({
    isAsset: true,
    type: "vector",
    generator: {
        type: "blank",
        _count: count,
    },
});

export const makeFillVectorAssetDefinition = (count: number = 100): VectorAssetDefinition => ({
    isAsset: true,
    type: "vector",
    generator: {
        type: "fill",
        _count: count,
        vector: {
            x: 0,
            y: 0,
            z: 0,
        },
    },
});

export type AnyAssetDefinition =
    | MeshAssetDefinition
    | SoundAssetDefinition
    | TextureAssetDefinition
    | GLSLAssetDefinition
    | BulletPatternAssetDefinition
    | TimingAssetDefinition
    | VectorAssetDefinition;
