import { Constants, Effect, Scene, Texture, Vector2 } from "@babylonjs/core";
import { CustomFloatProceduralTexture } from "../forks/CustomFloatProceduralTexture";
import { nextPowerOfTwo } from "../loaders/scalarGenerators/scalarGeneratorUtils";
import { glsl } from "./BabylonUtils";

Effect.ShadersStore.addReducerPixelShader = glsl`
    uniform sampler2D source;
    uniform vec2 sourceResolution;
    void main() {
        vec2 offset = ((gl_FragCoord.xy - vec2(0.5, 0.5)) * 2.) + vec2(0.5, 0.5);
        vec4 outValue = vec4(0., 0., 0., 0.);
        for(float i = 0.; i < 2.; i++){
            for(float j = 0.; j < 2.; j++){
                vec2 curPixel = offset + vec2(i, j);
                vec2 uv = curPixel / sourceResolution;
                outValue += texture2D( source, uv );
            }
        }
        
        gl_FragColor = outValue;
    }
`;

const makeProceduralTexture = (
  name: string,
  shader: string,
  WIDTH: number,
  scene: Scene
) => {
  const proceduralTexture = new CustomFloatProceduralTexture(
    name,
    shader,
    WIDTH,
    scene,
    undefined,
    false,
    false,
    Constants.TEXTURETYPE_FLOAT
  );

  return proceduralTexture;
};

const parallelReducer: (
  source: Texture | CustomFloatProceduralTexture,
  sourceResolution: number,
  scene: Scene
) => [CustomFloatProceduralTexture, CustomFloatProceduralTexture[]] = (
  source: Texture | CustomFloatProceduralTexture,
  sourceResolution: number,
  scene: Scene
) => {
  let reducer = new CustomFloatProceduralTexture(
    "",
    "addReducer",
    sourceResolution / 2,
    scene,
    undefined,
    false,
    false,
    Constants.TEXTURETYPE_FLOAT
  );
  reducer.setTexture("source", source);
  reducer.setVector2(
    "sourceResolution",
    new Vector2(sourceResolution, sourceResolution)
  );

  const reducerLayers = [reducer];

  for (
    let newResolution = sourceResolution / 2;
    newResolution > 1;
    newResolution /= 2
  ) {
    const newReducer = new CustomFloatProceduralTexture(
      "",
      "addReducer",
      newResolution / 2,
      scene,
      undefined,
      false,
      false,
      Constants.TEXTURETYPE_FLOAT
    );
    newReducer.setTexture("source", reducer);
    newReducer.setVector2(
      "sourceResolution",
      new Vector2(newResolution, newResolution)
    );
    reducer = newReducer;

    if (newResolution > 2) {
      reducerLayers.push(newReducer);
    }
  }

  return [reducer, reducerLayers];
};

interface DifferentialPositionVelocityCollisionSystemArgs {
  num: number;
  startPositionsState: Texture;
  startVelocitiesState: Texture;
  startCollisionsState: Texture;
  positionShader: string;
  velocityShader: string;
  collisionShader: string;
  downsampleCollisions: boolean;
  scene: Scene;
  initialValuesFunction: (texture: CustomFloatProceduralTexture) => void;
  initialPositionValuesFunction?: (
    texture: CustomFloatProceduralTexture
  ) => void;
  initialVelocityValuesFunction?: (
    texture: CustomFloatProceduralTexture
  ) => void;
  initialCollisionValuesFunction?: (
    texture: CustomFloatProceduralTexture
  ) => void;
}

export default class DifferentialPositionVelocityCollisionSystem {
  private positionTextures: CustomFloatProceduralTexture[];
  private velocityTextures: CustomFloatProceduralTexture[];
  public collisionTextures: CustomFloatProceduralTexture[];
  private allTextures: CustomFloatProceduralTexture[];
  public collisionResult: CustomFloatProceduralTexture;
  private reducerLayers: CustomFloatProceduralTexture[];

  private frame = 0;
  private disposed = false;
  private justStarted = true;

  constructor({
    num,
    startPositionsState,
    startVelocitiesState,
    startCollisionsState,
    positionShader,
    velocityShader,
    collisionShader,
    downsampleCollisions,
    scene,
    initialValuesFunction,
    initialPositionValuesFunction,
    initialVelocityValuesFunction,
    initialCollisionValuesFunction,
  }: DifferentialPositionVelocityCollisionSystemArgs) {
    const WIDTH = Math.max(nextPowerOfTwo(Math.ceil(Math.sqrt(num))), 2);
    this.positionTextures = [
      makeProceduralTexture("", positionShader, WIDTH, scene),
      makeProceduralTexture("", positionShader, WIDTH, scene),
    ];
    this.velocityTextures = [
      makeProceduralTexture("", velocityShader, WIDTH, scene),
      makeProceduralTexture("", velocityShader, WIDTH, scene),
    ];
    this.collisionTextures = [
      makeProceduralTexture("", collisionShader, WIDTH, scene),
      makeProceduralTexture("", collisionShader, WIDTH, scene),
    ];

    this.allTextures = [
      ...this.positionTextures,
      ...this.velocityTextures,
      ...this.collisionTextures,
    ];

    this.allTextures.forEach((texture) => {
      texture.setTexture("positionSampler", startPositionsState);
      texture.setTexture("velocitySampler", startVelocitiesState);
      texture.setTexture("collisionSampler", startCollisionsState);
      texture.setVector2("resolution", new Vector2(WIDTH, WIDTH));
      texture.setFloat("delta", 0.001);
    });

    this.allTextures.forEach(initialValuesFunction);

    if (initialPositionValuesFunction) {
      this.positionTextures.forEach(initialPositionValuesFunction);
    }
    if (initialVelocityValuesFunction) {
      this.velocityTextures.forEach(initialVelocityValuesFunction);
    }
    if (initialCollisionValuesFunction) {
      this.collisionTextures.forEach(initialCollisionValuesFunction);
    }

    if (downsampleCollisions) {
      const [collisionResult, reducerLayers] = parallelReducer(
        this.collisionTextures[0],
        WIDTH,
        scene
      );
      this.collisionResult = collisionResult;
      this.reducerLayers = reducerLayers;
    } else {
      this.collisionResult = this.collisionTextures[0];
      this.reducerLayers = [];
    }
  }

  dispose() {
    this.allTextures.forEach((texture) => {
      texture.dispose();
    });

    this.collisionResult.dispose();

    if (this.reducerLayers) {
      this.reducerLayers.forEach((reducer) => {
        reducer.dispose();
      });
    }

    this.disposed = true;
  }

  update(
    deltaS: number,
    bindOtherUniforms: (texture: CustomFloatProceduralTexture) => void
  ) {
    if (this.disposed) {
      console.warn(
        "DifferentialPositionVelocityCollisionSystem.update() called after dispose()"
      );
      return;
    }

    if (
      this.allTextures.some((texture) => {
        return !texture.isReady();
      })
    ) {
      return;
    }

    if (this.justStarted) {
      this.justStarted = false;
      this.allTextures.forEach((texture) => {
        texture.isReady = () => true;
      });
    }

    const source = this.frame % 2;
    const dest = (this.frame + 1) % 2;

    this.positionTextures[source].sleep = false;
    this.velocityTextures[source].sleep = false;
    this.collisionTextures[source].sleep = false;
    this.positionTextures[dest].sleep = true;
    this.velocityTextures[dest].sleep = true;
    this.collisionTextures[dest].sleep = true;

    const bindSouceTextures = (destTexture: CustomFloatProceduralTexture) => {
      destTexture.setTexture("positionSampler", this.positionTextures[source]);
      destTexture.setTexture("velocitySampler", this.velocityTextures[source]);
      destTexture.setTexture(
        "collisionSampler",
        this.collisionTextures[source]
      );
      destTexture.setFloat("delta", deltaS);
      bindOtherUniforms(destTexture);
    };

    bindSouceTextures(this.positionTextures[dest]);
    bindSouceTextures(this.velocityTextures[dest]);
    bindSouceTextures(this.collisionTextures[dest]);

    if (this.reducerLayers.length) {
      this.reducerLayers[0].setTexture("source", this.collisionTextures[dest]);
    } else {
      this.collisionResult = this.collisionTextures[dest];
    }

    this.frame = (this.frame + 1) % 2;

    return [
      this.positionTextures[dest],
      this.velocityTextures[dest],
      this.collisionTextures[dest],
    ];
  }
}
