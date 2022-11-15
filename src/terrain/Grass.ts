import { Color3, Quaternion, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { CustomMaterial } from "../forks/CustomMaterial";
import { MeshAsset, TerrainAsset } from "../types/Assets";
import { glsl, makeInstancesIdentity } from "../utils/BabylonUtils";
import { convertToCell } from "../utils/MaterialUtils";
import { COMMON_SHADER_FUNC, makeTerrainHeight, makeTerrainUV, makeTerrainVaryings } from "./CommonShader";

export class Grass {
  public grassBase: Mesh;
  public uniformVector: Vector3;

  constructor(
    grassAsset: MeshAsset,
    scene: Scene,
    terrainData: TerrainAsset,
    grassStart: number,
    grassDistance: number,
    grassPerMeter: number,
    stretching = 1
  ) {
    if (!scene.activeCamera) throw new Error("Scene has no active camera");

    const newInstance = grassAsset.container.instantiateModelsToScene();
    const grass = newInstance.rootNodes[0].getChildren()[0] as Mesh;
    grass.parent = null;
    if (!grass) throw new Error("Couldn't find grass model");

    grass.makeGeometryUnique();
    grass.scaling = new Vector3(1, 1, 1);
    grass.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
    grass.bakeCurrentTransformIntoVertices();
    grass.createNormals(false);
    this.grassBase = grass;
    this.uniformVector = new Vector3();

    this.grassBase.alwaysSelectAsActiveMesh = true;
    this.grassBase.receiveShadows = true;

    const numGrass = Math.pow(grassPerMeter * grassDistance * 2, 2) - Math.pow(grassPerMeter * grassStart * 2, 2);
    makeInstancesIdentity(this.grassBase, numGrass);
    const material = new CustomMaterial("grassMat", scene) as CustomMaterial;
    material.specularColor = new Color3(0, 0, 0);
    material.AddUniform("grassPerMeter", "float", grassPerMeter);
    material.AddUniform("grassStart", "float", grassStart);
    material.AddUniform("grassDistance", "float", grassDistance);
    material.AddUniform("stretching", "float", stretching);
    material.AddUniform("cameraPosition", "vec3", scene.activeCamera.globalPosition);
    material.AddUniform("heightMapTexture", "sampler2D", terrainData.heightMapTexture);
    material.AddUniform("heightMapNormalTexture", "sampler2D", terrainData.heightMapNormalTexture);
    material.AddUniform("terrainSize", "float", terrainData.terrainSize);
    material.AddUniform("terrainResolution", "float", terrainData.terrainResolution);
    material.AddUniform("terrainHeightScale", "float", terrainData.terrainHeightScale);
    material.AddUniform("uniformVector", "vec3", this.uniformVector);

    material.Vertex_Definitions(glsl`
        ${makeTerrainVaryings}

        ${COMMON_SHADER_FUNC}
    `);

    material.Vertex_Before_PositionUpdated(glsl`
        int instance = gl_InstanceID;
        float grassPerSide = grassDistance * 2. * grassPerMeter;
        float grassStartPerSide = grassStart * 2. * grassPerMeter;
        float grassPerMiniSection = (grassPerSide - grassStartPerSide)/2.;

        float grassInterval = 1./grassPerMeter;
        float grassWidth = grassDistance - grassStart;

        float grassLongPatch = grassPerSide * grassPerMiniSection;
        float grassWalls = grassStartPerSide * grassPerMiniSection;

        vec2 grassSection1 = vec2(
            float(instance % int(grassPerMiniSection)),
            float(instance / int(grassPerMiniSection))
        );

        vec2 grassSection2 = vec2(
            float((instance - int(grassLongPatch)) % int(grassStartPerSide)),
            float((instance - int(grassLongPatch)) / int(grassStartPerSide))
        ) + vec2(
            grassPerMiniSection,
            0.
        );

        vec2 grassSection3 = vec2(
            float((instance - int(grassLongPatch + grassWalls)) % int(grassStartPerSide)),
            float((instance - int(grassLongPatch + grassWalls)) / int(grassStartPerSide))
        ) + vec2(
            grassPerMiniSection,
            grassPerMiniSection + grassStartPerSide
        );

        vec2 grassSection4 = vec2(
            float((instance - int(grassLongPatch + grassWalls * 2.)) % int(grassPerMiniSection)),
            float((instance - int(grassLongPatch + grassWalls * 2.)) / int(grassPerMiniSection))
        ) + vec2(
            grassPerMiniSection + grassStartPerSide,
            0.
        );

        float isGrassSection1 = float(instance < int(grassLongPatch));
        float isGrassSection2 = float(instance >= int(grassLongPatch) && instance < int(grassLongPatch + grassWalls));
        float isGrassSection3 = float(instance >= int(grassLongPatch + grassWalls) && instance < int(grassLongPatch + grassWalls * 2.));
        float isGrassSection4 = float(instance >= int(grassLongPatch + grassWalls * 2.));

        vec2 positionNew =
            isGrassSection1 * grassSection1 +
            isGrassSection2 * grassSection2 +
            isGrassSection3 * grassSection3 +
            isGrassSection4 * grassSection4;

        positionNew -= vec2((grassPerSide-1.)/2., (grassPerSide-1.)/2.);

        positionNew *= grassInterval;

        float oneSquare = max(1., grassInterval);
        positionNew.x += round(cameraPosition.x / oneSquare) * oneSquare;
        positionNew.y += round(cameraPosition.z / oneSquare) * oneSquare;
        positionNew += rand(positionNew.xy)*(grassInterval*2.);

        ${makeTerrainUV("positionNew")}
        vec3 terrainNormal = texture(heightMapNormalTexture, terrainUV).xyz;
        ${makeTerrainHeight}

        vPositionHMap = vec3(positionNew.x, 0., positionNew.y) + vec3(0., terrainHeight, 0.);

        //becomeRock?
        float isRock = invLerp(0.752, 0.751, terrainNormal.y);

        //becomeSand?
        float isSand = invLerp(0.345, 0.335, normTerrainHeight);

        //becomeSnow?
        float isSnow = invLerp(0.57, 0.63, normTerrainHeight);

        float display = 1. - max(float(isRock > 0.75), max(float(isSand > 0.75), float(isSnow > 0.75)));

        mat3 rotationMatrix =
            rotAxis(vec3(0, 1, 0), rand2d(positionNew) * PI * 2.);
        positionUpdated.xz *= stretching;
        positionUpdated *= rotationMatrix;

        positionUpdated *= 0.3 + (snoise(positionNew) * .1) + (snoise(positionNew*1000.) * .2);

        float intensity = 0.125;
        float time = uniformVector.x;
        vec3 wind = vec3(sin(PI * 2. * time * intensity + positionNew.x) + sin(PI * 2. * time * intensity + positionNew.y * 2.) + sin(PI * 2. * time * intensity * 0.1 + positionNew.x), 0.,
    	cos(PI * 2. * time * intensity + positionNew.x * 2.) + cos(PI * 2. * time * intensity + positionNew.y));

        positionUpdated.xz += 0.2 * wind.xz * positionUpdated.y * positionUpdated.y;

        positionUpdated.xz += positionNew;
        positionUpdated.y += terrainHeight - 0.1;
        positionUpdated *= display;

    `);

    material.Vertex_After_WorldPosComputed(glsl`
        vNormalW = terrainNormal;
    `);

    material.Fragment_Definitions(glsl`
        ${makeTerrainVaryings}

        ${COMMON_SHADER_FUNC}
    `);

    material.Fragment_Custom_Diffuse(glsl`
        float normHeight = vPositionHMap.y/terrainHeightScale;

        vec3 grass = vec3(.025, .625, .225);
        vec3 grassClose = mix(vec3(0., .6, .2), vec3(.05, .65, .25), snoise(vPositionHMap.xz * 100.));

        vec3 sand = mix(vec3(.76, .70, .50), vec3(.8, .75, .55), snoise(vPositionHMap.xz/100.));
        vec3 snow = vec3(1.0, 1.0, 1.0);

        //grass
        float cameraDistance = distance(cameraPosition, vPositionW) / 20.;
        vec3 ground = mix(grassClose, grass, clamp(cameraDistance + 0.5, 0., 1.));

        //becomeSand?
        float isSand = invLerp(0.345, 0.335, normHeight);
        ground = mix(ground, sand, isSand);

        //becomeSnow?
        float isSnow = invLerp(0.57, 0.63, normHeight);
        ground = mix(ground, snow, isSnow);

        vec4 cellFrag = vec4(ground, 1.);
    `);

    convertToCell(material, scene, 0);
    material.backFaceCulling = false;
    material.useLogarithmicDepth = true;

    this.grassBase.material = material;
  }
  update(time: number) {
    this.uniformVector.x += time;
    this.uniformVector.x = this.uniformVector.x % 80;
  }
  dispose(): void {
    this.grassBase.dispose();
  }
}
