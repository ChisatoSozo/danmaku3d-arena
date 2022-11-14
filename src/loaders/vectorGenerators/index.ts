import { Scene, Vector3 } from "@babylonjs/core";
import { VectorGenerator } from "../../types/gameDefinition/BulletPatternDefinition";
import { blankVectorGenerator } from "./blankVectorGenerator";
import { burstVectorGenerator } from "./burstVectorGenerator";
import { fillVectorGenerator } from "./fillVectorGenerator";
import { makeTextureFromVectors } from "./vectorGeneratorUtils";

export type VectorGeneratorFunction = (vectorGenerator: any) => Vector3[];

const vectorGeneratorFunctions: { [key in VectorGenerator["type"]]: VectorGeneratorFunction } = {
    burst: burstVectorGenerator,
    blank: blankVectorGenerator,
    fill: fillVectorGenerator,
};

export const generateVectorTexture = (vectorGenerator: VectorGenerator, scene: Scene) => {
    const vectorGeneratorFunction = vectorGeneratorFunctions[vectorGenerator.type];
    if (!vectorGeneratorFunction) {
        throw new Error(`Vector generator type ${vectorGenerator.type} not supported`);
    }
    const vectors = vectorGeneratorFunction(vectorGenerator);
    return makeTextureFromVectors(vectors, scene);
};
