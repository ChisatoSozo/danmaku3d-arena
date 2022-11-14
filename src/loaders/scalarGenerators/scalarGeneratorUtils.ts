import { Constants, RawTexture, Scene } from "@babylonjs/core";

export const nextPowerOfTwo = (n: number) => {
    if (n === 0) return 1;
    n--;
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;
    return n + 1;
};

export const makeTextureFromScalars = (scalars: number[], scene: Scene, fill = -510) => {
    const num = scalars.length;
    const WIDTH = Math.max(nextPowerOfTwo(Math.ceil(Math.sqrt(num))), 2);
    const data = new Float32Array(WIDTH * WIDTH * 4);

    let offset = 0;

    scalars.forEach((scalar, i) => {
        offset = i;
        data[offset] = scalar;
    });

    for (let i = offset + 1; i < WIDTH * WIDTH; i++) {
        offset = i;
        data[offset] = fill;
    }

    return RawTexture.CreateRTexture(
        data,
        WIDTH,
        WIDTH,
        scene,
        false,
        false,
        Constants.TEXTURE_NEAREST_NEAREST,
        Constants.TEXTURETYPE_FLOAT
    );
};
