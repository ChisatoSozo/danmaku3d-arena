import { TimingGeneratorFunction } from ".";
import { UniformTimingGenerator } from "../../types/gameDefinition/BulletPatternDefinition";

export const uniformTimingGenerator: TimingGeneratorFunction = ({ time, _count }: UniformTimingGenerator) => {
    const times = [];

    for (let i = 0; i < _count; i++) {
        times.push(time);
    }

    return times;
};
