import { Matrix, Quaternion, Vector3 } from "@babylonjs/core";

export const modRange = (number: number, max: number, min: number) => {
    return ((number - min) % (max - min)) + min
}

export const modDist = (a: number, b: number, mod: number) => {
    const diff = Math.abs(b - a);
    const sign = Math.sign(b - a);

    return (diff < (mod / 2)) ? sign * diff : -sign * (mod - diff);
}

export const orthoganalProjection = (vec: Vector3, forward: Vector3) => {
    const projection = forward.scale(Vector3.Dot(vec, forward))
    return vec.subtract(projection);
}

export const extractBasis = (quat: Quaternion) => {
    const matrix = new Matrix();
    quat.toRotationMatrix(matrix);
    return {
        up: Vector3.TransformCoordinates(Vector3.Up(), matrix),
        right: Vector3.TransformCoordinates(Vector3.Right(), matrix),
        forward: Vector3.TransformCoordinates(Vector3.Forward(), matrix),
    }
}

export const blerp = (values: number[][], x1: number, y1: number, x2: number, y2: number, x: number, y: number) => {
    const q11 = (((x2 - x) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values[x1][y1]
    const q21 = (((x - x1) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values[x2][y1]
    const q12 = (((x2 - x) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values[x1][y2]
    const q22 = (((x - x1) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values[x2][y2]
    return q11 + q21 + q12 + q22
}

export const blerpVec = (values: Vector3[][], x1: number, y1: number, x2: number, y2: number, x: number, y: number) => {
    const q11x = (((x2 - x) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values[x1][y1].x
    const q21x = (((x - x1) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values[x2][y1].x
    const q12x = (((x2 - x) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values[x1][y2].x
    const q22x = (((x - x1) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values[x2][y2].x
    const xNew = q11x + q21x + q12x + q22x

    const q11y = (((x2 - x) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values[x1][y1].y
    const q21y = (((x - x1) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values[x2][y1].y
    const q12y = (((x2 - x) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values[x1][y2].y
    const q22y = (((x - x1) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values[x2][y2].y
    const yNew = q11y + q21y + q12y + q22y

    const q11z = (((x2 - x) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values[x1][y1].z
    const q21z = (((x - x1) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values[x2][y1].z
    const q12z = (((x2 - x) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values[x1][y2].z
    const q22z = (((x - x1) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values[x2][y2].z
    const zNew = q11z + q21z + q12z + q22z

    const normal = new Vector3(xNew, yNew, zNew);
    normal.normalize();
    return normal;
}

export const blerpVecFunc = (values: (i: number, j: number) => Vector3, x1: number, y1: number, x2: number, y2: number, x: number, y: number) => {
    const q11x = (((x2 - x) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values(x1, y1).x
    const q21x = (((x - x1) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values(x2, y1).x
    const q12x = (((x2 - x) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values(x1, y2).x
    const q22x = (((x - x1) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values(x2, y2).x
    const xNew = q11x + q21x + q12x + q22x

    const q11y = (((x2 - x) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values(x1, y1).y
    const q21y = (((x - x1) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values(x2, y1).y
    const q12y = (((x2 - x) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values(x1, y2).y
    const q22y = (((x - x1) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values(x2, y2).y
    const yNew = q11y + q21y + q12y + q22y

    const q11z = (((x2 - x) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values(x1, y1).z
    const q21z = (((x - x1) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * values(x2, y1).z
    const q12z = (((x2 - x) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values(x1, y2).z
    const q22z = (((x - x1) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * values(x2, y2).z
    const zNew = q11z + q21z + q12z + q22z

    const normal = new Vector3(xNew, yNew, zNew);
    normal.normalize();
    return normal;
}

export const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}