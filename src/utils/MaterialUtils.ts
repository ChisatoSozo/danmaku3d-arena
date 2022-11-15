import { BaseTexture, Color3, Engine, Texture } from "@babylonjs/core";
import { RawTexture } from "@babylonjs/core/Materials/Textures/rawTexture";
import { Scene } from "@babylonjs/core/scene";
import { CustomMaterial } from "../forks/CustomMaterial";

export const glsl = (template: TemplateStringsArray, ...args: (string | number)[]) => {
  let str = "";
  for (let i = 0; i < args.length; i++) {
    str += template[i] + String(args[i]);
  }
  return str + template[template.length - 1];
};

const gradientTexture: { current?: Texture } = {
  current: undefined,
};

const diffuseTexture: { current?: Texture } = {
  current: undefined,
};

const makeGradientTexture = (scene: Scene) => {
  const gradientBuffer = new Float32Array(100);
  for (let i = 0; i < gradientBuffer.length; i++) {
    if (i < 25) gradientBuffer[i] = 0.125;
    if (i === 25) gradientBuffer[i] = 0.1875;
    if (i > 25 && i < 50) gradientBuffer[i] = 0.25;
    if (i === 50) gradientBuffer[i] = 0.375;
    if (i > 50 && i < 75) gradientBuffer[i] = 0.5;
    if (i === 75) gradientBuffer[i] = 0.75;
    if (i > 75) gradientBuffer[i] = 1;
  }

  return RawTexture.CreateRTexture(gradientBuffer, 100, 1, scene, undefined, undefined, undefined, Engine.TEXTURETYPE_FLOAT);
};

const makeDiffuseTexture = (scene: Scene) => {
  const diffuseBuffer = new Uint8Array([255, 255, 255, 255]);
  return RawTexture.CreateRGBATexture(diffuseBuffer, 1, 1, scene);
};

export const makeCellMaterial = (name: string, cellTexture: BaseTexture, scene: Scene, highlights = 1, lowlights = 1) => {
  const cellMaterial = new CustomMaterial(name, scene);
  if (!diffuseTexture.current) {
    diffuseTexture.current = makeDiffuseTexture(scene);
  }
  cellMaterial.diffuseTexture = diffuseTexture.current;
  cellMaterial.specularColor = new Color3(0, 0, 0);
  cellMaterial.AddUniform("cellTexture", "sampler2D", cellTexture);
  cellMaterial.Fragment_Custom_Diffuse(glsl`
        vec4 cellFrag = texture(cellTexture, vDiffuseUV + uvOffset);
    `);
  return convertToCell(cellMaterial, scene, highlights, lowlights);
};

export const convertToCell = (sourceMaterial: CustomMaterial, scene: Scene, highlights = 1, lowlights = 1) => {
  if (!gradientTexture.current) {
    gradientTexture.current = makeGradientTexture(scene);
  }
  sourceMaterial.AddUniform("colorRamp", "sampler2D", gradientTexture.current);
  sourceMaterial.AddUniform("highlights", "float", highlights);
  sourceMaterial.AddUniform("lowlights", "float", lowlights);

  sourceMaterial.Fragment_Before_Fog(glsl`
        float lightVal = color.x;
        float colorRampOut = texture(colorRamp, vec2(lightVal, 0.5)).x * 2.;
        float lowlightPower = pow(colorRampOut, lowlights);
        float highlightPower = colorRampOut - (2. - highlights);

        vec3 cellColor = cellFrag.rgb;
        float cellAlpha = min(color.a, cellFrag.a);

        vec3 lowlightColor = mix(vec3(0., 0., 0.), cellColor, clamp(lowlightPower, 0., 1.));
        vec3 highlightColor = mix(lowlightColor, vec3(1., 1., 1.), clamp(highlightPower/4., 0., 1.));

        color = vec4(highlightColor, cellAlpha);
    `);

  return sourceMaterial;
};
