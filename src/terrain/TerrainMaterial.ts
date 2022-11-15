import { Color3, Scene } from "@babylonjs/core";
import { CustomMaterial } from "../forks/CustomMaterial";
import { TerrainAsset } from "../types/Assets";
import { convertToCell, glsl } from "../utils/MaterialUtils";
import { COMMON_SHADER_FUNC, makeTerrainHeight, makeTerrainVaryings } from "./CommonShader";

export const createTerrainMaterial = (terrainData: TerrainAsset, lods: number[], scene: Scene) => {
  if (!scene.activeCamera) throw new Error("Attempt to construct material with no active camera");
  const material = new CustomMaterial("myMaterial", scene) as CustomMaterial;

  material.AddUniform("heightMapNormalTexture", "sampler2D", terrainData.heightMapNormalTexture);
  material.AddUniform("heightMapTexture", "sampler2D", terrainData.heightMapTexture);
  material.AddUniform("terrainSize", "float", terrainData.terrainSize);
  material.AddUniform("terrainResolution", "float", terrainData.terrainResolution);
  material.AddUniform("terrainHeightScale", "float", terrainData.terrainHeightScale);
  material.AddUniform("cameraPosition", "vec3", scene.activeCamera.globalPosition);
  material.AddUniform("maxPolyWidth", "float", Math.pow(2, lods.length));

  material.Vertex_Definitions(glsl`
		varying vec2 vTerrainUV;

		${makeTerrainVaryings}

		${COMMON_SHADER_FUNC}
	`);

  material.Vertex_Before_PositionUpdated(glsl`
		float squareSize = 1.;
		float oneSquare = squareSize * maxPolyWidth;

		vec3 updatedCamera = (cameraPosition)
			/ vec3(terrainSize, terrainSize, terrainSize)
			* vec3(terrainResolution, terrainResolution, terrainResolution);

		positionUpdated.x += round(updatedCamera.x / oneSquare) * oneSquare;
		positionUpdated.z += round(updatedCamera.z / oneSquare) * oneSquare;

		vec2 terrainCoord = vec2(positionUpdated.z + 0.5, positionUpdated.x + 0.5);
		
		vec2 terrainUV = terrainCoord/vec2(terrainResolution, terrainResolution);
		vTerrainUV = terrainUV;
		vec3 terrainNormal = texture(heightMapNormalTexture, terrainUV).xyz;
		${makeTerrainHeight}
		vPositionHMap = positionUpdated.xyz + vec3(0., terrainHeight, 0.);
		positionUpdated.y += terrainHeight;
	`);

  material.Vertex_After_WorldPosComputed(glsl`
		vNormalW = terrainNormal;
	`);

  material.Fragment_Definitions(glsl`
		varying vec2 vTerrainUV;

		${COMMON_SHADER_FUNC}

		vec3 rockColor( float t )
		{
			return vec3(t);
			//return mix(vec3(0.3, 0.1, 0.0),vec3(0.6, 0.4, 0.3), invLerp(0.1, 0.3, t));
		}

		// rescaling function

		float rescale(float x, vec2 range)
		{
			float a = range.x, b = range.y;
			return (x - a)/(b - a);
		}

		// simple LCG

		#define LCG(k) k = (65 * k) % 1021
		#define lr(k) float(k)/1021.

		// permutation polynomial

		int permp (int i1, int i2)
		{
			int t = (i1 + i2) & 255;
				
			return ((112 * t + 153) * t + 151) & 255;
		}

		// return the two closest distances for 3D Worley noise
		// type controls the type of metric used

		vec2 worley(int type, vec3 p)
		{
			vec2 dl = vec2(20.0);
			ivec3 iv = ivec3(floor(p));
			vec3 fv = fract(p);
			
			int j = 0; // initialization for Knuth's "algorithm L"
			ivec3 di = ivec3(1), ki = -di;
			ivec4 fi = ivec4(0, 1, 2, 3);
			
			// instead of writing a triply nested loop (!!)
			// generate the indices for the neighbors in Gray order (Knuth's "algorithm L")
			// see section 7.2.1.1 of TAOCP, Volume 4A or https://doi.org/10.1145/360336.360343
			
			for (int k = 0; k < 27; k++) // loop through all neighbors
			{ 
				// seeding
				int s = permp(permp(permp(0, iv.z + ki.z), iv.y + ki.y), iv.x + ki.x); LCG(s);
					
				for (int m = 0; m < 2; m++) // two points per cell
					{
						// generate feature points within the cell
						LCG(s); float sz = lr(s);
						LCG(s); float sy = lr(s);
						LCG(s); float sx = lr(s);
						
						vec3 tp = vec3(ki) + vec3(sx, sy, sz) - fv;
						float c = 0.0;
						if (type == 1) c = dot(tp, tp); // Euclidean metric
						if (type == 2) c = abs(tp.x) + abs(tp.y) + abs(tp.z); // Manhattan metric
						if (type == 3) c = max(abs(tp.x), max(abs(tp.y), abs(tp.z))); // Chebyshev metric
						
						float m1 = min(c, dl.x); // ranked distances
						dl = vec2(min(m1, dl.y), max(m1, min(max(c, dl.x), dl.y)));
					}
				
				// updating steps for Knuth's "algorithm L"
				j = fi[0]; fi[0] = 0; ki[2 - j] += di[j];
				if ((ki[2 - j] & 1) == 1) {
					di[j] = -di[j];
					fi[j] = fi[j + 1]; fi[j + 1] = j + 1;
				}
			}
			
			if (type == 1) dl = sqrt(dl); // don't forget to root at the end for Euclidean distance
				
			return dl;
		}


		const mat3 m = mat3( 0.00,  0.80,  0.60,
							-0.80,  0.36, -0.48,
							-0.60, -0.48,  0.64 );

		${makeTerrainVaryings}

		
	`);

  material.Fragment_Custom_Diffuse(glsl`
		vec3 terrainNormal = texture(heightMapNormalTexture, vTerrainUV).xyz;
		float normHeight = vPositionHMap.y/terrainHeightScale;
		
		vec3 pos = vPositionHMap/10.;
		vec3 col = vec3(0.8);
		float f = 0.0;


		vec3 q = 2.0 * pos; // three octaves
		vec2 w = worley(1, q);
		// f  = 2.0 * (w.y - w.x); q = m * q * 2.01;
		// w = worley(1, q);
		// f += 1.0 * (w.y - w.x); q = m * q * 2.02;
		// w = worley(1, q);
		f += 0.25 * (w.y - w.x);


		f = smoothstep( -0.7, 0.7, f );
		col = rockColor(rescale(f, vec2(0.0, 2.8)));

		col = sqrt( col );
		
		col *= smoothstep( 0.006, 0.008, abs(pos.x) );
		
		vec3 rock = col;

		vec3 grass = vec3(.025, .625, .225);
		vec3 sand = mix(vec3(.76, .70, .50), vec3(.8, .75, .55), snoise(vPositionHMap.xz/100.));
		// vec3 rock = mix(vec3(.35, .3, .25), vec3(.3, .3, .2), snoise(vPositionHMap.xz/100.));;
		vec3 snow = vec3(1.0, 1.0, 1.0);
	
		//grass
		vec3 ground = grass;
	
		//becomeRock?
		float isRock = invLerp(0.75, 0.749, terrainNormal.y);
		ground = mix(ground, rock, isRock);
	
		//becomeSand?
		float isSand = invLerp(0.345, 0.335, normHeight);
		ground = mix(ground, sand, isSand);
	
		//becomeSnow?
		float isSnow = invLerp(0.57, 0.63, normHeight);
		ground = mix(ground, snow, isSnow);
	
		vec4 cellFrag = vec4(ground, 1.);
	`);

  material.useLogarithmicDepth = true;
  material.specularColor = new Color3(0, 0, 0);
  return convertToCell(material, scene, 0);
};
