import { useRef } from "react";
import { useBeforeRender, useEngine } from "react-babylonjs";

const mode = (arr: number[]) => {
    return arr.reduce(
        function (current, item) {
            var val = (current.numMapping[item] = (current.numMapping[item] || 0) + 1);
            if (val > current.greatestFreq) {
                current.greatestFreq = val;
                current.mode = item;
            }
            return current;
        },
        { mode: null as null | number, greatestFreq: -Infinity, numMapping: {} as { [key: number]: number } }
    ).mode;
};

export const useNormalizedFrameSkipRef = (frameSkipInit: number) => {
    const frameSkipRef = useRef(frameSkipInit);
    const fpsHistory = useRef([] as number[]);
    const engine = useEngine();

    useBeforeRender(() => {
        if (!engine) return;
        const fps = engine.getFps();
        fpsHistory.current.push(fps);
        if (fpsHistory.current.length > 10) {
            fpsHistory.current.shift();
        }
        const fpsMode = mode(fpsHistory.current);

        if (!fpsMode) return;

        const newFrameSkip = Math.round((frameSkipInit / 60) * fpsMode);

        frameSkipRef.current = newFrameSkip || 1;
    });

    return frameSkipRef;
};
