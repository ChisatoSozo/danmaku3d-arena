/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-inferrable-types */
import { IAnimatable } from "@babylonjs/core/Animations/animatable.interface";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Effect, IEffectCreationOptions } from "@babylonjs/core/Materials/effect";
import { EffectFallbacks } from "@babylonjs/core/Materials/effectFallbacks";
import {
  IImageProcessingConfigurationDefines,
  ImageProcessingConfiguration,
} from "@babylonjs/core/Materials/imageProcessingConfiguration";
import { MaterialDefines } from "@babylonjs/core/Materials/materialDefines";
import { MaterialFlags } from "@babylonjs/core/Materials/materialFlags";
import { MaterialHelper } from "@babylonjs/core/Materials/materialHelper";
import { PushMaterial } from "@babylonjs/core/Materials/pushMaterial";
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Plane } from "@babylonjs/core/Maths/math.plane";
import { Matrix, Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { VertexBuffer } from "@babylonjs/core/Meshes/buffer";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { SubMesh } from "@babylonjs/core/Meshes/subMesh";
import {
  expandToProperty,
  SerializationHelper,
  serialize,
  serializeAsColor3,
  serializeAsTexture,
  serializeAsVector2,
} from "@babylonjs/core/Misc/decorators";
import { Observer } from "@babylonjs/core/Misc/observable";
import { SmartArray } from "@babylonjs/core/Misc/smartArray";
import { Scene } from "@babylonjs/core/scene";
import { Nullable } from "@babylonjs/core/types";
import { glsl } from "../utils/MaterialUtils";

const BindEyePosition = function (effect: Effect, scene: Scene, variableName?: string) {
  if (variableName === void 0) {
    variableName = "vEyePosition";
  }
  if (scene._forcedViewPosition) {
    effect.setVector3(variableName, scene._forcedViewPosition);
    return;
  }

  //@ts-ignore
  var globalPosition = scene.activeCamera.globalPosition;
  if (!globalPosition) {
    // Use WebVRFreecamera's device position as global position is not it's actual position in babylon space
    //@ts-ignore
    globalPosition = scene.activeCamera.devicePosition;
  }
  effect.setVector3(variableName, scene._mirroredCameraPosition ? scene._mirroredCameraPosition : globalPosition);
};

Effect.ShadersStore["waterVertexShader"] = glsl`
precision highp float;

// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<bonesDeclaration>

// Uniforms
#include<instancesDeclaration>

uniform mat4 view;
uniform mat4 viewProjection;

#ifdef BUMP
varying vec2 vNormalUV;
#ifdef BUMPSUPERIMPOSE
    varying vec2 vNormalUV2;
#endif
uniform mat4 normalMatrix;
uniform vec2 vNormalInfos;
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#include<clipPlaneVertexDeclaration>

#include<fogVertexDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]

#include<logDepthDeclaration>

// Water uniforms
uniform mat4 worldReflectionViewProjection;
uniform vec2 windDirection;
uniform float waveLength;
uniform float time;
uniform float windForce;
uniform float waveHeight;
uniform float waveSpeed;
uniform float waveCount;

// Water varyings
varying vec3 vPosition;
varying vec3 vRefractionMapTexCoord;
varying vec3 vReflectionMapTexCoord;



void main(void) {

    #include<instancesVertex>
    #include<bonesVertex>

	vec4 worldPos = finalWorld * vec4(position, 1.0);
	vPositionW = vec3(worldPos);

#ifdef NORMAL
	vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));
#endif

	// Texture coordinates
#ifndef UV1
	vec2 uv = vec2(0., 0.);
#endif
#ifndef UV2
	vec2 uv2 = vec2(0., 0.);
#endif

#ifdef BUMP
	if (vNormalInfos.x == 0.)
	{
		vNormalUV = vec2(normalMatrix * vec4((uv * 1.0) / waveLength + time * windForce * windDirection, 1.0, 0.0));
        #ifdef BUMPSUPERIMPOSE
		    vNormalUV2 = vec2(normalMatrix * vec4((uv * 0.721) / waveLength + time * 1.2 * windForce * windDirection, 1.0, 0.0));
		#endif
	}
	else
	{
		vNormalUV = vec2(normalMatrix * vec4((uv2 * 1.0) / waveLength + time * windForce * windDirection , 1.0, 0.0));
        #ifdef BUMPSUPERIMPOSE
    		vNormalUV2 = vec2(normalMatrix * vec4((uv2 * 0.721) / waveLength + time * 1.2 * windForce * windDirection , 1.0, 0.0));
    	#endif
	}
#endif

	// Clip plane
	#include<clipPlaneVertex>

	// Fog
    #include<fogVertex>
	
	// Shadows
    #include<shadowsVertex>[0..maxSimultaneousLights]
    
	// Vertex color
#ifdef VERTEXCOLOR
	vColor = color;
#endif

	// Point size
#ifdef POINTSIZE
	gl_PointSize = pointSize;
#endif

	float finalWaveCount = 1.0 / (waveCount * 0.5);

	vec3 p = position;
	float newY = (sin(((p.x / finalWaveCount) + time * waveSpeed)) * waveHeight * windDirection.x * 5.0)
			   + (cos(((p.z / finalWaveCount) +  time * waveSpeed)) * waveHeight * windDirection.y * 5.0);
	p.y += abs(newY);
	
	gl_Position = viewProjection * finalWorld * vec4(p, 1.0);

#ifdef REFLECTION
	worldPos = viewProjection * finalWorld * vec4(p, 1.0);
	
	// Water
	vPosition = position;
	
	vRefractionMapTexCoord.x = 0.5 * (worldPos.w + worldPos.x);
	vRefractionMapTexCoord.y = 0.5 * (worldPos.w + worldPos.y);
	vRefractionMapTexCoord.z = worldPos.w;
	
	worldPos = worldReflectionViewProjection * vec4(position, 1.0);
	vReflectionMapTexCoord.x = 0.5 * (worldPos.w + worldPos.x);
	vReflectionMapTexCoord.y = 0.5 * (worldPos.w + worldPos.y);
	vReflectionMapTexCoord.z = worldPos.w;
#endif

#include<logDepthVertex>

}
`;

Effect.ShadersStore["waterFragmentShader"] = glsl`
#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

precision highp float;

// Constants
uniform vec3 vEyePosition;
uniform vec4 vDiffuseColor;

#ifdef SPECULARTERM
uniform vec4 vSpecularColor;
#endif

// Input
varying vec3 vPositionW;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Helper functions
#include<helperFunctions>

#include<imageProcessingDeclaration>
#include<imageProcessingFunctions>

// Lights
#include<__decl__lightFragment>[0..maxSimultaneousLights]

#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>

// Samplers
#ifdef BUMP
varying vec2 vNormalUV;
varying vec2 vNormalUV2;
uniform sampler2D normalSampler;
uniform vec2 vNormalInfos;
#endif

uniform sampler2D refractionSampler;
uniform sampler2D reflectionSampler;

// Water uniforms
const float LOG2 = 1.442695;

uniform vec3 cameraPosition;

uniform vec4 waterColor;
uniform float colorBlendFactor;

uniform vec4 waterColor2;
uniform float colorBlendFactor2;

uniform float bumpHeight;

uniform float time;

// Water varyings
varying vec3 vRefractionMapTexCoord;
varying vec3 vReflectionMapTexCoord;
varying vec3 vPosition;

#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>

// Fog
#include<fogFragmentDeclaration>

void main(void) {
	// Clip plane
    #include<clipPlaneFragment>

	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

	// Base color
	vec4 baseColor = vec4(1., 1., 1., 1.);
	vec3 diffuseColor = vDiffuseColor.rgb;

	// Alpha
	float alpha = vDiffuseColor.a;

#ifdef BUMP
    #ifdef BUMPSUPERIMPOSE
    	baseColor = 0.6 * texture2D(normalSampler, vNormalUV) + 0.4 * texture2D(normalSampler,vec2(vNormalUV2.x,vNormalUV2.y));
    #else
	    baseColor = texture2D(normalSampler, vNormalUV);
    #endif
	vec3 bumpColor = baseColor.rgb;

#ifdef ALPHATEST
	if (baseColor.a < 0.4)
		discard;
#endif

	baseColor.rgb *= vNormalInfos.y;
#else
	vec3 bumpColor = vec3(1.0);
#endif

#ifdef VERTEXCOLOR
	baseColor.rgb *= vColor.rgb;
#endif

	// Bump
#ifdef NORMAL
	vec2 perturbation = bumpHeight * (baseColor.rg - 0.5);
	#ifdef BUMPAFFECTSREFLECTION
	    vec3 normalW = normalize(vNormalW + vec3(perturbation.x*8.0,0.0,perturbation.y*8.0));
	    if (normalW.y<0.0) {
	        normalW.y = -normalW.y;
	    }
    #else
    	vec3 normalW = normalize(vNormalW);
	#endif
#else
	vec3 normalW = vec3(1.0, 1.0, 1.0);
	vec2 perturbation = bumpHeight * (vec2(1.0, 1.0) - 0.5);
#endif

#ifdef FRESNELSEPARATE
    #ifdef REFLECTION
        // Water
        vec2 projectedRefractionTexCoords = clamp(vRefractionMapTexCoord.xy / vRefractionMapTexCoord.z + perturbation*0.5, 0.0, 1.0);
        vec4 refractiveColor = texture2D(refractionSampler, projectedRefractionTexCoords);
        #ifdef IS_REFRACTION_LINEAR
            refractiveColor.rgb = toGammaSpace(refractiveColor.rgb);
        #endif

        vec2 projectedReflectionTexCoords = clamp(vec2(
            vReflectionMapTexCoord.x / vReflectionMapTexCoord.z + perturbation.x * 0.3,
            vReflectionMapTexCoord.y / vReflectionMapTexCoord.z + perturbation.y
        ),0.0, 1.0);

        vec4 reflectiveColor = texture2D(reflectionSampler, projectedReflectionTexCoords);
        #ifdef IS_REFLECTION_LINEAR
            reflectiveColor.rgb = toGammaSpace(reflectiveColor.rgb);
        #endif

        vec3 upVector = vec3(0.0, 1.0, 0.0);

        float fresnelTerm = clamp(abs(pow(dot(viewDirectionW, upVector),3.0)),0.05,0.65);
        float IfresnelTerm = 1.0 - fresnelTerm;

        refractiveColor = colorBlendFactor*waterColor + (1.0-colorBlendFactor)*refractiveColor;
        reflectiveColor = IfresnelTerm*colorBlendFactor2*waterColor + (1.0-colorBlendFactor2*IfresnelTerm)*reflectiveColor;

        vec4 combinedColor = refractiveColor * fresnelTerm + reflectiveColor * IfresnelTerm;
        baseColor = combinedColor;
    #endif

    // Lighting
    vec3 diffuseBase = vec3(0., 0., 0.);
    lightingInfo info;
    float shadow = 1.;

    #ifdef SPECULARTERM
        float glossiness = vSpecularColor.a;
        vec3 specularBase = vec3(0., 0., 0.);
        vec3 specularColor = vSpecularColor.rgb;
    #else
        float glossiness = 0.;
    #endif

    #include<lightFragment>[0..maxSimultaneousLights]

    vec3 finalDiffuse = clamp(baseColor.rgb, 0.0, 1.0);

    #ifdef VERTEXALPHA
        alpha *= vColor.a;
    #endif

    #ifdef SPECULARTERM
        vec3 finalSpecular = specularBase * specularColor;
    #else
        vec3 finalSpecular = vec3(0.0);
    #endif


#else // !FRESNELSEPARATE
    #ifdef REFLECTION
        // Water
        vec2 projectedRefractionTexCoords = clamp(vRefractionMapTexCoord.xy / vRefractionMapTexCoord.z + perturbation, 0.0, 1.0);
        vec4 refractiveColor = texture2D(refractionSampler, projectedRefractionTexCoords);
        #ifdef IS_REFRACTION_LINEAR
            refractiveColor.rgb = toGammaSpace(refractiveColor.rgb);
        #endif

        vec2 projectedReflectionTexCoords = clamp(vReflectionMapTexCoord.xy / vReflectionMapTexCoord.z + perturbation, 0.0, 1.0);
        vec4 reflectiveColor = texture2D(reflectionSampler, projectedReflectionTexCoords);
        #ifdef IS_REFLECTION_LINEAR
            reflectiveColor.rgb = toGammaSpace(reflectiveColor.rgb);
        #endif

        vec3 upVector = vec3(0.0, 1.0, 0.0);

        float fresnelTerm = max(dot(viewDirectionW, upVector), 0.0);

        vec4 combinedColor = refractiveColor * fresnelTerm + reflectiveColor * (1.0 - fresnelTerm);

        baseColor = colorBlendFactor * waterColor + (1.0 - colorBlendFactor) * combinedColor;
    #endif

    // Lighting
    vec3 diffuseBase = vec3(0., 0., 0.);
    lightingInfo info;
    float shadow = 1.;

    #ifdef SPECULARTERM
        float glossiness = vSpecularColor.a;
        vec3 specularBase = vec3(0., 0., 0.);
        vec3 specularColor = vSpecularColor.rgb;
    #else
        float glossiness = 0.;
    #endif

    #include<lightFragment>[0..maxSimultaneousLights]

    vec3 finalDiffuse = clamp(baseColor.rgb, 0.0, 1.0);


    #ifdef VERTEXALPHA
        alpha *= vColor.a;
    #endif

    #ifdef SPECULARTERM
        vec3 finalSpecular = specularBase * specularColor;
    #else
        vec3 finalSpecular = vec3(0.0);
    #endif

#endif

// Composition
vec4 color = vec4(finalDiffuse + finalSpecular, alpha);

#include<logDepthFragment>
#include<fogFragment>

// Apply image processing if relevant. As this applies in linear space, 
// We first move from gamma to linear.
#ifdef IMAGEPROCESSINGPOSTPROCESS
	color.rgb = toLinearSpace(color.rgb);
#elif defined(IMAGEPROCESSING)
    color.rgb = toLinearSpace(color.rgb);
    color = applyImageProcessing(color);
#endif
	
	gl_FragColor = color;
}

`;

class WaterMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
  public BUMP = false;
  public REFLECTION = false;
  public CLIPPLANE = false;
  public CLIPPLANE2 = false;
  public CLIPPLANE3 = false;
  public CLIPPLANE4 = false;
  public CLIPPLANE5 = false;
  public CLIPPLANE6 = false;
  public ALPHATEST = false;
  public DEPTHPREPASS = false;
  public POINTSIZE = false;
  public FOG = false;
  public NORMAL = false;
  public UV1 = false;
  public UV2 = false;
  public VERTEXCOLOR = false;
  public VERTEXALPHA = false;
  public NUM_BONE_INFLUENCERS = 0;
  public BonesPerMesh = 0;
  public INSTANCES = false;
  public SPECULARTERM = false;
  public LOGARITHMICDEPTH = false;
  public FRESNELSEPARATE = false;
  public BUMPSUPERIMPOSE = false;
  public BUMPAFFECTSREFLECTION = false;

  public IMAGEPROCESSING = false;
  public VIGNETTE = false;
  public VIGNETTEBLENDMODEMULTIPLY = false;
  public VIGNETTEBLENDMODEOPAQUE = false;
  public TONEMAPPING = false;
  public TONEMAPPING_ACES = false;
  public CONTRAST = false;
  public EXPOSURE = false;
  public COLORCURVES = false;
  public COLORGRADING = false;
  public COLORGRADING3D = false;
  public SAMPLER3DGREENDEPTH = false;
  public SAMPLER3DBGRMAP = false;
  public IMAGEPROCESSINGPOSTPROCESS = false;

  constructor() {
    super();
    this.rebuild();
  }
  //@ts-ignore
  DITHER: boolean;
  //@ts-ignore
  SKIPFINALCOLORCLAMP: boolean;
}

export class WaterMaterial extends PushMaterial {
  /*
   * Public members
   */
  @serializeAsTexture("bumpTexture")
  //@ts-ignore
  private _bumpTexture: BaseTexture;
  @expandToProperty("_markAllSubMeshesAsTexturesDirty")
  //@ts-ignore
  public bumpTexture: BaseTexture;

  @serializeAsColor3()
  public diffuseColor = new Color3(1, 1, 1);

  @serializeAsColor3()
  public specularColor = new Color3(0, 0, 0);

  @serialize()
  public specularPower = 64;

  @serialize("disableLighting")
  private _disableLighting = false;
  @expandToProperty("_markAllSubMeshesAsLightsDirty")
  //@ts-ignore
  public disableLighting: boolean;

  @serialize("maxSimultaneousLights")
  private _maxSimultaneousLights = 4;
  @expandToProperty("_markAllSubMeshesAsLightsDirty")
  //@ts-ignore
  public maxSimultaneousLights: number;

  /**
   * Defines the wind force.
   */
  @serialize()
  public windForce: number = 6;
  /**
   * Defines the direction of the wind in the plane (X, Z).
   */
  @serializeAsVector2()
  public windDirection: Vector2 = new Vector2(0, 1);
  /**
   * Defines the height of the waves.
   */
  @serialize()
  public waveHeight: number = 0.4;
  /**
   * Defines the bump height related to the bump map.
   */
  @serialize()
  public bumpHeight: number = 0.4;
  /**
   * Defines wether or not: to add a smaller moving bump to less steady waves.
   */
  @serialize("bumpSuperimpose")
  private _bumpSuperimpose = false;
  @expandToProperty("_markAllSubMeshesAsMiscDirty")
  //@ts-ignore
  public bumpSuperimpose: boolean;

  /**
   * Defines wether or not color refraction and reflection differently with .waterColor2 and .colorBlendFactor2. Non-linear (physically correct) fresnel.
   */
  @serialize("fresnelSeparate")
  private _fresnelSeparate = false;
  @expandToProperty("_markAllSubMeshesAsMiscDirty")
  //@ts-ignore
  public fresnelSeparate: boolean;

  /**
   * Defines wether or not bump Wwves modify the reflection.
   */
  @serialize("bumpAffectsReflection")
  private _bumpAffectsReflection = false;
  @expandToProperty("_markAllSubMeshesAsMiscDirty")
  //@ts-ignore
  public bumpAffectsReflection: boolean;

  /**
   * Defines the water color blended with the refraction (near).
   */
  @serializeAsColor3()
  public waterColor: Color3 = new Color3(0.1, 0.1, 0.6);
  /**
   * Defines the blend factor related to the water color.
   */
  @serialize()
  public colorBlendFactor: number = 0.2;
  /**
   * Defines the water color blended with the reflection (far).
   */
  @serializeAsColor3()
  public waterColor2: Color3 = new Color3(0.1, 0.1, 0.6);
  /**
   * Defines the blend factor related to the water color (reflection, far).
   */
  @serialize()
  public colorBlendFactor2: number = 0.2;
  /**
   * Defines the maximum length of a wave.
   */
  @serialize()
  public waveLength: number = 0.1;

  /**
   * Defines the waves speed.
   */
  @serialize()
  public waveSpeed: number = 1.0;

  /**
   * Defines the number of times waves are repeated. This is typically used to adjust waves count according to the ground's size where the material is applied on.
   */
  @serialize()
  public waveCount: number = 20;
  /**
   * Sets or gets whether or not automatic clipping should be enabled or not. Setting to true will save performances and
   * will avoid calculating useless pixels in the pixel shader of the water material.
   */
  @serialize()
  public disableClipPlane: boolean = false;

  protected _renderTargets = new SmartArray<RenderTargetTexture>(16);

  /*
   * Private members
   */
  private _mesh: Nullable<AbstractMesh> = null;

  //@ts-ignore
  private _refractionRTT: Nullable<RenderTargetTexture>;
  //@ts-ignore
  private _reflectionRTT: Nullable<RenderTargetTexture>;

  private _reflectionTransform: Matrix = Matrix.Zero();
  private _lastTime: number = 0;
  private _lastDeltaTime: number = 0;

  //@ts-ignore
  private _useLogarithmicDepth: boolean;

  //@ts-ignore
  private _waitingRenderList: Nullable<string[]>;

  private _imageProcessingConfiguration: Nullable<ImageProcessingConfiguration>;
  //@ts-ignore
  private _imageProcessingObserver: Nullable<Observer<ImageProcessingConfiguration>>;

  /**
   * Gets a boolean indicating that current material needs to register RTT
   */
  public get hasRenderTargetTextures(): boolean {
    return true;
  }

  /**
   * Constructor
   */
  constructor(name: string, scene: Scene, public renderTargetSize: Vector2 = new Vector2(512, 512)) {
    super(name, scene);

    this._createRenderTargets(scene, renderTargetSize);

    // Create render targets
    this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
      this._renderTargets.reset();
      this._renderTargets.push(<RenderTargetTexture>this._reflectionRTT);
      this._renderTargets.push(<RenderTargetTexture>this._refractionRTT);

      return this._renderTargets;
    };

    this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration;
    if (this._imageProcessingConfiguration) {
      this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
        this._markAllSubMeshesAsImageProcessingDirty();
      });
    }
  }

  @serialize()
  public get useLogarithmicDepth(): boolean {
    return this._useLogarithmicDepth;
  }

  public set useLogarithmicDepth(value: boolean) {
    this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
    this._markAllSubMeshesAsMiscDirty();
  }

  // Get / Set
  public get refractionTexture(): Nullable<RenderTargetTexture> {
    return this._refractionRTT;
  }

  public get reflectionTexture(): Nullable<RenderTargetTexture> {
    return this._reflectionRTT;
  }

  // Methods
  public addToRenderList(node: any): void {
    if (this._refractionRTT && this._refractionRTT.renderList) {
      this._refractionRTT.renderList.push(node);
    }

    if (this._reflectionRTT && this._reflectionRTT.renderList) {
      this._reflectionRTT.renderList.push(node);
    }
  }

  public enableRenderTargets(enable: boolean): void {
    const refreshRate = enable ? 1 : 0;

    if (this._refractionRTT) {
      this._refractionRTT.refreshRate = refreshRate;
    }

    if (this._reflectionRTT) {
      this._reflectionRTT.refreshRate = refreshRate;
    }
  }

  public getRenderList(): Nullable<AbstractMesh[]> {
    return this._refractionRTT ? this._refractionRTT.renderList : [];
  }

  public get renderTargetsEnabled(): boolean {
    return !(this._refractionRTT && this._refractionRTT.refreshRate === 0);
  }

  public needAlphaBlending(): boolean {
    return this.alpha < 1.0;
  }

  public needAlphaTesting(): boolean {
    return false;
  }

  public getAlphaTestTexture(): Nullable<BaseTexture> {
    return null;
  }

  public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
    if (this.isFrozen) {
      if (subMesh.effect && subMesh.effect._wasPreviouslyReady) {
        return true;
      }
    }

    if (!subMesh.materialDefines) {
      subMesh.materialDefines = new WaterMaterialDefines();
    }

    const defines = <WaterMaterialDefines>subMesh.materialDefines;
    const scene = this.getScene();

    if (this._isReadyForSubMesh(subMesh)) {
      return true;
    }

    const engine = scene.getEngine();

    // Textures
    if (defines._areTexturesDirty) {
      defines._needUVs = false;
      if (scene.texturesEnabled) {
        if (this.bumpTexture && MaterialFlags.BumpTextureEnabled) {
          if (!this.bumpTexture.isReady()) {
            return false;
          } else {
            defines._needUVs = true;
            defines.BUMP = true;
          }
        }

        if (MaterialFlags.ReflectionTextureEnabled) {
          defines.REFLECTION = true;
        }
      }
    }

    MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false);

    MaterialHelper.PrepareDefinesForMisc(
      mesh,
      scene,
      this._useLogarithmicDepth,
      this.pointsCloud,
      this.fogEnabled,
      this._shouldTurnAlphaTestOn(mesh),
      defines
    );

    if (defines._areMiscDirty) {
      if (this._fresnelSeparate) {
        defines.FRESNELSEPARATE = true;
      }

      if (this._bumpSuperimpose) {
        defines.BUMPSUPERIMPOSE = true;
      }

      if (this._bumpAffectsReflection) {
        defines.BUMPAFFECTSREFLECTION = true;
      }
    }

    // Lights
    defines._needNormals = MaterialHelper.PrepareDefinesForLights(
      scene,
      mesh,
      defines,
      true,
      this._maxSimultaneousLights,
      this._disableLighting
    );

    // Image processing
    if (defines._areImageProcessingDirty && this._imageProcessingConfiguration) {
      if (!this._imageProcessingConfiguration.isReady()) {
        return false;
      }

      this._imageProcessingConfiguration.prepareDefines(defines);

      defines.IS_REFLECTION_LINEAR = this.reflectionTexture != null && !this.reflectionTexture.gammaSpace;
      defines.IS_REFRACTION_LINEAR = this.refractionTexture != null && !this.refractionTexture.gammaSpace;
    }

    // Attribs
    MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);

    // Configure this
    this._mesh = mesh;

    if (this._waitingRenderList) {
      for (let i = 0; i < this._waitingRenderList.length; i++) {
        this.addToRenderList(scene.getNodeByID(this._waitingRenderList[i]));
      }

      this._waitingRenderList = null;
    }

    // Get correct effect
    if (defines.isDirty) {
      defines.markAsProcessed();
      scene.resetCachedMaterial();

      // Fallbacks
      const fallbacks = new EffectFallbacks();
      if (defines.FOG) {
        fallbacks.addFallback(1, "FOG");
      }

      if (defines.LOGARITHMICDEPTH) {
        fallbacks.addFallback(0, "LOGARITHMICDEPTH");
      }

      MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);

      if (defines.NUM_BONE_INFLUENCERS > 0) {
        fallbacks.addCPUSkinningFallback(0, mesh);
      }

      //Attributes
      const attribs = [VertexBuffer.PositionKind];

      if (defines.NORMAL) {
        attribs.push(VertexBuffer.NormalKind);
      }

      if (defines.UV1) {
        attribs.push(VertexBuffer.UVKind);
      }

      if (defines.UV2) {
        attribs.push(VertexBuffer.UV2Kind);
      }

      if (defines.VERTEXCOLOR) {
        attribs.push(VertexBuffer.ColorKind);
      }

      MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
      MaterialHelper.PrepareAttributesForInstances(attribs, defines);

      // Legacy browser patch
      const shaderName = "water";
      const join = defines.toString();
      const uniforms = [
        "world",
        "view",
        "viewProjection",
        "vEyePosition",
        "vLightsType",
        "vDiffuseColor",
        "vSpecularColor",
        "vFogInfos",
        "vFogColor",
        "pointSize",
        "vNormalInfos",
        "mBones",
        "vClipPlane",
        "vClipPlane2",
        "vClipPlane3",
        "vClipPlane4",
        "vClipPlane5",
        "vClipPlane6",
        "normalMatrix",
        "logarithmicDepthConstant",

        // Water
        "worldReflectionViewProjection",
        "windDirection",
        "waveLength",
        "time",
        "windForce",
        "cameraPosition",
        "bumpHeight",
        "waveHeight",
        "waterColor",
        "waterColor2",
        "colorBlendFactor",
        "colorBlendFactor2",
        "waveSpeed",
        "waveCount",
      ];
      const samplers = [
        "normalSampler",
        // Water
        "refractionSampler",
        "reflectionSampler",
      ];
      const uniformBuffers = new Array<string>();

      if (ImageProcessingConfiguration) {
        ImageProcessingConfiguration.PrepareUniforms(uniforms, defines);
        ImageProcessingConfiguration.PrepareSamplers(samplers, defines);
      }

      MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
        uniformsNames: uniforms,
        uniformBuffersNames: uniformBuffers,
        samplers: samplers,
        defines: defines,
        maxSimultaneousLights: this.maxSimultaneousLights,
      });
      subMesh.setEffect(
        scene.getEngine().createEffect(
          shaderName,
          <IEffectCreationOptions>{
            attributes: attribs,
            uniformsNames: uniforms,
            uniformBuffersNames: uniformBuffers,
            samplers: samplers,
            defines: join,
            fallbacks: fallbacks,
            onCompiled: this.onCompiled,
            onError: this.onError,
            indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights },
          },
          engine
        ),
        defines
      );
    }
    if (!subMesh.effect || !subMesh.effect.isReady()) {
      return false;
    }

    defines._renderId = scene.getRenderId();
    subMesh.effect._wasPreviouslyReady = true;

    return true;
  }

  public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
    const scene = this.getScene();

    const defines = <WaterMaterialDefines>subMesh.materialDefines;
    if (!defines) {
      return;
    }

    const effect = subMesh.effect;
    if (!effect || !this._mesh) {
      return;
    }
    this._activeEffect = effect;

    // Matrices
    this.bindOnlyWorldMatrix(world);
    this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());

    // Bones
    MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

    if (this._mustRebind(scene, effect)) {
      // Textures
      if (this.bumpTexture && MaterialFlags.BumpTextureEnabled) {
        this._activeEffect.setTexture("normalSampler", this.bumpTexture);

        this._activeEffect.setFloat2("vNormalInfos", this.bumpTexture.coordinatesIndex, this.bumpTexture.level);
        this._activeEffect.setMatrix("normalMatrix", this.bumpTexture.getTextureMatrix());
      }
      // Clip plane
      MaterialHelper.BindClipPlane(this._activeEffect, scene);

      // Point size
      if (this.pointsCloud) {
        this._activeEffect.setFloat("pointSize", this.pointSize);
      }

      BindEyePosition(effect, scene);
    }

    this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);

    if (defines.SPECULARTERM) {
      this._activeEffect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
    }

    if (scene.lightsEnabled && !this.disableLighting) {
      MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);
    }

    // View
    if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
      this._activeEffect.setMatrix("view", scene.getViewMatrix());
    }

    // Fog
    MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

    // Log. depth
    MaterialHelper.BindLogDepth(defines, this._activeEffect, scene);

    // Water
    if (MaterialFlags.ReflectionTextureEnabled) {
      this._activeEffect.setTexture("refractionSampler", this._refractionRTT);
      this._activeEffect.setTexture("reflectionSampler", this._reflectionRTT);
    }

    const wrvp = this._mesh.getWorldMatrix().multiply(this._reflectionTransform).multiply(scene.getProjectionMatrix());

    // Add delta time. Prevent adding delta time if it hasn't changed.
    const deltaTime = scene.getEngine().getDeltaTime();
    if (deltaTime !== this._lastDeltaTime) {
      this._lastDeltaTime = deltaTime;
      this._lastTime += this._lastDeltaTime;
    }

    this._activeEffect.setMatrix("worldReflectionViewProjection", wrvp);
    this._activeEffect.setVector2("windDirection", this.windDirection);
    this._activeEffect.setFloat("waveLength", this.waveLength);
    this._activeEffect.setFloat("time", this._lastTime / 100000);
    this._activeEffect.setFloat("windForce", this.windForce);
    this._activeEffect.setFloat("waveHeight", this.waveHeight);
    this._activeEffect.setFloat("bumpHeight", this.bumpHeight);
    this._activeEffect.setColor4("waterColor", this.waterColor, 1.0);
    this._activeEffect.setFloat("colorBlendFactor", this.colorBlendFactor);
    this._activeEffect.setColor4("waterColor2", this.waterColor2, 1.0);
    this._activeEffect.setFloat("colorBlendFactor2", this.colorBlendFactor2);
    this._activeEffect.setFloat("waveSpeed", this.waveSpeed);
    this._activeEffect.setFloat("waveCount", this.waveCount);

    // image processing
    if (this._imageProcessingConfiguration && !this._imageProcessingConfiguration.applyByPostProcess) {
      this._imageProcessingConfiguration.bind(this._activeEffect);
    }

    this._afterBind(mesh, this._activeEffect);
  }

  private _createRenderTargets(scene: Scene, renderTargetSize: Vector2): void {
    // Render targets
    this._refractionRTT = new RenderTargetTexture(
      this.name + "_refraction",
      { width: renderTargetSize.x, height: renderTargetSize.y },
      scene,
      false,
      true
    );
    this._refractionRTT.wrapU = Constants.TEXTURE_MIRROR_ADDRESSMODE;
    this._refractionRTT.wrapV = Constants.TEXTURE_MIRROR_ADDRESSMODE;
    this._refractionRTT.ignoreCameraViewport = true;

    this._reflectionRTT = new RenderTargetTexture(
      this.name + "_reflection",
      { width: renderTargetSize.x, height: renderTargetSize.y },
      scene,
      false,
      true
    );
    this._reflectionRTT.wrapU = Constants.TEXTURE_MIRROR_ADDRESSMODE;
    this._reflectionRTT.wrapV = Constants.TEXTURE_MIRROR_ADDRESSMODE;
    this._reflectionRTT.ignoreCameraViewport = true;

    let isVisible: boolean;
    let clipPlane: Nullable<Plane> = null;
    let savedViewMatrix: Matrix;
    const mirrorMatrix = Matrix.Zero();

    this._refractionRTT.onBeforeRender = () => {
      if (this._mesh) {
        isVisible = this._mesh.isVisible;
        this._mesh.isVisible = false;
      }

      // Clip plane
      if (!this.disableClipPlane) {
        clipPlane = scene.clipPlane;

        const positiony = this._mesh ? this._mesh.position.y : 0.0;
        scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, positiony + 0.05, 0), new Vector3(0, 1, 0));
      }
    };

    this._refractionRTT.onAfterRender = () => {
      if (this._mesh) {
        this._mesh.isVisible = isVisible;
      }

      // Clip plane
      if (!this.disableClipPlane) {
        scene.clipPlane = clipPlane;
      }
    };

    this._reflectionRTT.onBeforeRender = () => {
      if (this._mesh) {
        isVisible = this._mesh.isVisible;
        this._mesh.isVisible = false;
      }

      // Clip plane
      if (!this.disableClipPlane) {
        clipPlane = scene.clipPlane;

        const positiony = this._mesh ? this._mesh.position.y : 0.0;
        scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, positiony - 0.05, 0), new Vector3(0, -1, 0));

        Matrix.ReflectionToRef(scene.clipPlane, mirrorMatrix);
      }

      // Transform
      savedViewMatrix = scene.getViewMatrix();

      mirrorMatrix.multiplyToRef(savedViewMatrix, this._reflectionTransform);
      scene.setTransformMatrix(this._reflectionTransform, scene.getProjectionMatrix());
      scene.getEngine().cullBackFaces = false;
      scene._mirroredCameraPosition = Vector3.TransformCoordinates((<Camera>scene.activeCamera).position, mirrorMatrix);
    };

    this._reflectionRTT.onAfterRender = () => {
      if (this._mesh) {
        this._mesh.isVisible = isVisible;
      }

      // Clip plane
      scene.clipPlane = clipPlane;

      // Transform
      scene.setTransformMatrix(savedViewMatrix, scene.getProjectionMatrix());
      scene.getEngine().cullBackFaces = true;
      scene._mirroredCameraPosition = null;
    };
  }

  public getAnimatables(): IAnimatable[] {
    const results = [];

    if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
      results.push(this.bumpTexture);
    }
    if (this._reflectionRTT && this._reflectionRTT.animations && this._reflectionRTT.animations.length > 0) {
      results.push(this._reflectionRTT);
    }
    if (this._refractionRTT && this._refractionRTT.animations && this._refractionRTT.animations.length > 0) {
      results.push(this._refractionRTT);
    }

    return results;
  }

  public getActiveTextures(): BaseTexture[] {
    const activeTextures = super.getActiveTextures();

    if (this._bumpTexture) {
      activeTextures.push(this._bumpTexture);
    }

    return activeTextures;
  }

  public hasTexture(texture: BaseTexture): boolean {
    if (super.hasTexture(texture)) {
      return true;
    }

    if (this._bumpTexture === texture) {
      return true;
    }

    return false;
  }

  public dispose(forceDisposeEffect?: boolean): void {
    if (this.bumpTexture) {
      this.bumpTexture.dispose();
    }

    let index = this.getScene().customRenderTargets.indexOf(<RenderTargetTexture>this._refractionRTT);
    if (index !== -1) {
      this.getScene().customRenderTargets.splice(index, 1);
    }
    index = -1;
    index = this.getScene().customRenderTargets.indexOf(<RenderTargetTexture>this._reflectionRTT);
    if (index !== -1) {
      this.getScene().customRenderTargets.splice(index, 1);
    }

    if (this._reflectionRTT) {
      this._reflectionRTT.dispose();
    }
    if (this._refractionRTT) {
      this._refractionRTT.dispose();
    }

    // Remove image-processing observer
    if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
      this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
    }

    super.dispose(forceDisposeEffect);
  }

  public clone(name: string): WaterMaterial {
    return SerializationHelper.Clone(() => new WaterMaterial(name, this.getScene()), this);
  }

  public serialize(): any {
    const serializationObject = SerializationHelper.Serialize(this);
    serializationObject.customType = "BABYLON.WaterMaterial";

    serializationObject.renderList = [];
    if (this._refractionRTT && this._refractionRTT.renderList) {
      for (let i = 0; i < this._refractionRTT.renderList.length; i++) {
        serializationObject.renderList.push(this._refractionRTT.renderList[i].id);
      }
    }

    return serializationObject;
  }

  public getClassName(): string {
    return "WaterMaterial";
  }

  // Statics
  public static Parse(source: any, scene: Scene, rootUrl: string): WaterMaterial {
    const mat = SerializationHelper.Parse(() => new WaterMaterial(source.name, scene), source, scene, rootUrl);
    mat._waitingRenderList = source.renderList;

    return mat;
  }

  public static CreateDefaultMesh(name: string, scene: Scene): Mesh {
    const mesh = Mesh.CreateGround(name, 512, 512, 32, scene, false);
    return mesh;
  }
}
