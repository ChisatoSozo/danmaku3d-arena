import { Matrix, Mesh, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { Instruction } from "../types/gameDefinition/CommonDefinition";
import { MAX_ACTIVE_ENEIMIES, MAX_BULLETS_PER_GROUP } from "./EngineConstants";

export const glsl = (template: TemplateStringsArray, ...args: (string | number)[]) => {
    let str = "";
    for (let i = 0; i < args.length; i++) {
        str += template[i] + String(args[i]);
    }
    return str + template[template.length - 1];
};

type PixelShaderType = "position" | "velocity";

export const uniforms = glsl`
    uniform vec2 resolution;
    uniform float delta;
    uniform float timeSinceStart; 
    uniform sampler2D positionSampler;
    uniform sampler2D velocitySampler;
    uniform sampler2D collisionSampler;
    uniform sampler2D initialPositionSampler;
    uniform sampler2D initialVelocitySampler;
    uniform sampler2D timingsSampler;
    uniform float enemyPositions[${MAX_ACTIVE_ENEIMIES * 3}];
    uniform float enemyRadii[${MAX_ACTIVE_ENEIMIES}];

    uniform float size;
    uniform vec3 parentPosition;
    uniform vec3 parentForward;

    //only used for player bullets
    uniform float firing;
    uniform float fireRate;
    uniform float fireVelocity;
`;

export const processUniforms = glsl`
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    float id = (gl_FragCoord.x - 0.5) + ((gl_FragCoord.y - 0.5) * resolution.x);

    vec4 positionWithW = texture2D(positionSampler, uv);
    vec4 velocityWithW = texture2D(velocitySampler, uv);
    vec4 collisionWithW = texture2D(collisionSampler, uv);
    vec4 initialPositionWithW = texture2D(initialPositionSampler, uv);
    vec4 initialVelocityWithW = texture2D(initialVelocitySampler, uv);
    float startTime = texture2D(timingsSampler, uv).x;

    vec3 position = positionWithW.xyz;
    vec3 velocity = velocityWithW.xyz;
    float collision = collisionWithW.w;
    vec3 initialPosition = initialPositionWithW.xyz;
    vec3 initialVelocity = initialVelocityWithW.xyz;

    vec3 updatedValue = vec3(0.);
`;

export const otherUniforms = glsl`
    float startTime
    vec3 position
    vec3 velocity
    float collision
    vec3 initialPosition
    vec3 initialVelocity
`;

export const MAX_BOMBS = 8;
export const PLAYER_BULLET_WHEEL_SIZE = 256;

export const constants = glsl`
    const int MAX_BOMBS = ${MAX_BOMBS};
    const int PLAYER_BULLET_WHEEL_SIZE = ${PLAYER_BULLET_WHEEL_SIZE};
    const int MAX_ACTIVE_ENEIMIES = ${MAX_ACTIVE_ENEIMIES};
`;

export type BulletPhase = Instruction & {
    initializationFunction: string;
    updateFunction: string;
};

export const lintConstructPixelShader = (body: string) => {
    return glsl`
    ${uniforms}
    ${constants}
    void main() {
        ${processUniforms}
        ${body}
    }`;
};

export const constructPixelShader = (phases: BulletPhase[], type: PixelShaderType) => {
    return glsl`
    ${uniforms}
    ${constants}
    void main() {
        ${processUniforms}

        ${type === "position" ? glsl`float phaseState = positionWithW.w;` : glsl`float phaseState = velocityWithW.w;`}

        if(phaseState == 0. && ${phases[0].at / 1000}. > timeSinceStart + startTime) {
            gl_FragColor = vec4(0.0001, 0.0001, 0.0001, 0.0001);
        }
        else{
            ${phases
                .map((phase, i) => {
                    return glsl`
                    if(phaseState == ${i * 2 + 1}.) {
                        ${phase.updateFunction}
                        ${
                            phases[i + 1]
                                ? glsl`if(timeSinceStart + startTime > ${phases[i + 1].at / 1000}.) {
                            phaseState = ${i * 2 + 2}.;
                        }`
                                : glsl``
                        }
                        
                    }
                    if(phaseState == ${i * 2}.) {
                        ${phase.initializationFunction}
                        phaseState = ${i * 2 + 1}.;
                    }
                `;
                })
                .join("\n")}
    
            gl_FragColor = vec4(updatedValue, phaseState);
        }
    }
`;
};

export const constructRawPixelShader = (mainFunction: string) => {
    return glsl`
    ${uniforms}
    ${constants}
    void main() {
        ${processUniforms}
        ${mainFunction}
    }
    `;
};

export const constructPlayerPixelShader = (updateFunction: string, type: PixelShaderType) => {
    return glsl`
    ${uniforms}
    ${constants}
    void main() {
        ${processUniforms}
        //0. is non initialized
        //1. is initialized
        float phaseState = positionWithW.w;
        float frameState = velocityWithW.w;
        

        float currentWindowStart = frameState;
        float currentWindowEnd = frameState + fireRate;
        float shouldBulletInitialize = float(id >= currentWindowStart && id < currentWindowEnd) * firing;

        if(phaseState == 1. && length(velocity) < 0.01) {
            shouldBulletInitialize = 1.;
        }

        if(shouldBulletInitialize == 1.) {
            position = parentPosition;
            velocity = parentForward * fireVelocity;
            phaseState = 1.0;
        }

        if(collision > 0.) {
            phaseState = 0.;
        }

        frameState = frameState + fireRate;

        ${
            type === "position"
                ? glsl`float outState = phaseState;`
                : glsl`float outState = frameState > float(PLAYER_BULLET_WHEEL_SIZE) ? 0. : frameState;`
        }

        ${
            type === "position"
                ? glsl`vec3 zero = vec3(-510., -510., -510.);`
                : glsl`vec3 zero = vec3(0.001, 0.001, 0.001);`
        }

        if(phaseState == 0. || collision > 0.) {
            gl_FragColor = vec4(zero, outState);
        }
        else{
            vec3 updatedValue = vec3(0.);
            ${updateFunction}
            gl_FragColor = vec4(updatedValue, outState);
        }
    }`;
};

const getLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
};

const bufferMatricesPreCompute = new Float32Array(MAX_BULLETS_PER_GROUP * 16);

export const makeInstances = (mesh: Mesh, num: number) => {
    if (num > MAX_BULLETS_PER_GROUP)
        throw new Error("MAX_BULLETS_PER_GROUP is " + MAX_BULLETS_PER_GROUP + " You have " + num);
    mesh.thinInstanceSetBuffer("matrix", bufferMatricesPreCompute.slice(0, num * 16), 16, true);
};

export const findMeshChild = (node: TransformNode) => {
    const meshes = node.getChildMeshes();
    return meshes.length > 0 ? (meshes[0] as Mesh) : undefined;
};

export const textOnCtx = (
    ctx: CanvasRenderingContext2D,
    text: string,
    size: number,
    x: number,
    y: number,
    fill = "white",
    stroke = "black",
    strokeWidth = 8,
    centered = false
) => {
    ctx.font = `${size * ctx.canvas.height}px tuhu`;
    ctx.textAlign = centered ? "center" : "left";

    const lines = centered ? [text] : getLines(ctx, text, (1 - x * 2) * ctx.canvas.width);

    lines.forEach((line, i) => {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.strokeText(line, x * ctx.canvas.width, y * ctx.canvas.height + i * (size * ctx.canvas.height * 1.1));

        ctx.fillStyle = fill;
        ctx.fillText(line, x * ctx.canvas.width, y * ctx.canvas.height + i * (size * ctx.canvas.height * 1.1));
    });
};

export const arcOnCtx = (ctx: CanvasRenderingContext2D, from: number, to: number, color = "#FF0000") => {
    ctx.beginPath();
    ctx.arc(
        ctx.canvas.width / 2,
        ctx.canvas.height / 2,
        ctx.canvas.width / 4,
        (Math.PI * 3) / 2 + Math.PI * 2 * from,
        (Math.PI * 3) / 2 + Math.PI * 2 * to
    );
    ctx.strokeStyle = color;
    ctx.stroke();
};

export const rotateVector = (vec: Vector3, yaw = 0, pitch = 0, roll = 0) => {
    const rotationQuaternion = Quaternion.RotationYawPitchRoll(yaw, pitch, roll);
    const rotationMatrix = new Matrix();
    rotationQuaternion.toRotationMatrix(rotationMatrix);
    return Vector3.TransformCoordinates(vec, rotationMatrix);
};

export const getRotationMatrix = (transformNode: TransformNode) => {
    const quaternion = transformNode.rotationQuaternion;
    const result = new Matrix();
    if (!quaternion) {
        throw new Error("No rotation quaternion found");
    }
    quaternion.toRotationMatrix(result);
    return result;
};

export const clampVectorInPlace = (vec: Vector3, min: Vector3, max: Vector3, padding = 0) => {
    vec.x = Math.max(min.x + padding, Math.min(max.x - padding, vec.x));
    vec.y = Math.max(min.y + padding, Math.min(max.y - padding, vec.y));
    vec.z = Math.max(min.z + padding, Math.min(max.z - padding, vec.z));
};
