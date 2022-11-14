import { Scene } from "@babylonjs/core";
import { TimingGenerator } from "../../types/gameDefinition/BulletPatternDefinition";
import { makeTextureFromScalars } from "./scalarGeneratorUtils";
import { uniformTimingGenerator } from "./uniformTimingGenerator";

export type TimingGeneratorFunction = (timingGenerator: TimingGenerator) => number[];

const timingGeneratorFunctions: { [key in TimingGenerator["type"]]: TimingGeneratorFunction } = {
    uniform: uniformTimingGenerator,
};

export const generateTimingTexture = (timingGenerator: TimingGenerator, scene: Scene) => {
    const timingGeneratorFunction = timingGeneratorFunctions[timingGenerator.type];
    if (!timingGeneratorFunction) {
        throw new Error(`Timing generator type ${timingGenerator.type} not supported`);
    }
    const timings = timingGeneratorFunction(timingGenerator);
    return makeTextureFromScalars(timings, scene);
};
