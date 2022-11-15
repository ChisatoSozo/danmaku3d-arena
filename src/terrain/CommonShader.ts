import { glsl } from "../utils/MaterialUtils";

export const makeTerrainUV = (input: string) => {
    return glsl`
        vec2 terrainUV = ((${input}.yx + 0.5)/terrainSize) + 0.5;
    `
}

export const makeTerrainHeight = glsl`
    float normTerrainHeight = texture(heightMapTexture, terrainUV).x;
    float terrainHeight = normTerrainHeight * terrainHeightScale;

`;

export const makeTerrainNormal = (fractionalSegment = 0.5) => glsl`
    float pixelSize = ${fractionalSegment}/terrainResolution;
    float cellSize = 0.5*terrainSize*pixelSize;

    float l = textureBicubic(heightMapTexture, vec2(terrainUV.x - pixelSize, terrainUV.y)).x * terrainHeightScale;
    float u = textureBicubic(heightMapTexture, vec2(terrainUV.x, terrainUV.y + pixelSize)).x * terrainHeightScale;
    float r = textureBicubic(heightMapTexture, vec2(terrainUV.x + pixelSize, terrainUV.y)).x * terrainHeightScale;
    float d = textureBicubic(heightMapTexture, vec2(terrainUV.x, terrainUV.y - pixelSize)).x * terrainHeightScale;

    vec3 vu = vec3(0, u, cellSize);
    vec3 vd = vec3(0, d, -cellSize);
    vec3 vr = vec3(cellSize, r, 0);
    vec3 vl = vec3(-cellSize, l, 0);

    vec3 terrainNormal = normalize(cross((vu - vd), (vr - vl)));
`;

export const makeTerrainVaryings = glsl`
    varying vec3 vPositionHMap;
`;

export const COMMON_SHADER_FUNC = glsl`
    vec4 cubic(float v){
        vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
        vec4 s = n * n * n;
        float x = s.x;
        float y = s.y - 4.0 * s.x;
        float z = s.z - 4.0 * s.y + 6.0 * s.x;
        float w = 6.0 - x - y - z;
        return vec4(x, y, z, w) * (1.0/6.0);
    }

    vec4 textureBicubic(sampler2D tex, vec2 texCoords){

        ivec2 texSizeI = textureSize(tex, 0);
        vec2 texSize = vec2(float(texSizeI.x), float(texSizeI.y));
        vec2 invTexSize = 1.0 / texSize;

        texCoords = texCoords * texSize - 0.5;


        vec2 fxy = fract(texCoords);
        texCoords -= fxy;

        vec4 xcubic = cubic(fxy.x);
        vec4 ycubic = cubic(fxy.y);

        vec4 c = texCoords.xxyy + vec2 (-0.5, +1.5).xyxy;

        vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
        vec4 offset = c + vec4 (xcubic.yw, ycubic.yw) / s;

        offset *= invTexSize.xxyy;

        vec4 sample0 = texture(tex, offset.xz);
        vec4 sample1 = texture(tex, offset.yz);
        vec4 sample2 = texture(tex, offset.xw);
        vec4 sample3 = texture(tex, offset.yw);

        float sx = s.x / (s.x + s.y);
        float sy = s.z / (s.z + s.w);

        return mix(
        mix(sample3, sample2, sx), mix(sample1, sample0, sx)
        , sy);
    }

    float invLerp(float x, float y, float a){
        return clamp((a - x) / (y - x), 0., 1.);
    }

    mat3 rotAxis(vec3 axis, float a) {
        float s=sin(a);
        float c=cos(a);
        float oc=1.0-c;
        vec3 as=axis*s;
        mat3 p=mat3(axis.x*axis,axis.y*axis,axis.z*axis);
        mat3 q=mat3(c,-as.z,as.y,as.z,c,-as.x,-as.y,as.x,c);
        return p*oc+q;
    }

    float rand1d(float n){return fract(sin(n) * 43758.5453123);}
    float rand2d(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }
    vec2 rand(vec2 co){
        float randNum = rand2d(co);
        return vec2(randNum, rand1d(randNum));
    }
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
            dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    mat3 makeUpRotation(vec3 direction)
    {
        
        vec3 zaxis = cross(vec3(1., 0., 0.), direction);
        zaxis = normalize(zaxis);

        vec3 xaxis = cross(direction, zaxis);
        xaxis = normalize(xaxis);

        return mat3(xaxis, direction, zaxis);
    }
`