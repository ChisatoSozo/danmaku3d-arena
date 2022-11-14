import { Vector3 } from "@babylonjs/core";
import { VectorGeneratorFunction } from ".";
import { BlankVectorGenerator } from "../../types/gameDefinition/BulletPatternDefinition";

export const blankVectorGenerator: VectorGeneratorFunction = ({ _count }: BlankVectorGenerator) => {
    const points = [];

    for (let i = 0; i < _count; i++) {
        points.push(new Vector3(0.0001, 0.0001, 0.0001));
    }

    return points;
};
