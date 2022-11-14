#include<logDepthDeclaration>
#include<instancesDeclaration>
#include<helperFunctions>

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
uniform mat4 worldViewProjection;
varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;

uniform sampler2D positionSampler;
uniform sampler2D velocitySampler;
uniform float size;

uniform float timeSinceStart;

void makeRotation(in vec3 direction, out mat3 rotation)
{
  vec3 xaxis = cross(vec3(0., 1., 0.), direction);
  xaxis = normalize(xaxis);

  vec3 yaxis = cross(direction, xaxis);
  yaxis = normalize(yaxis);

  rotation = mat3(xaxis, yaxis, direction);
}

void main() {
  int instance = gl_InstanceID;
  int width = textureSize(positionSampler, 0).x;
  int x = instance % width;
  int y = instance / width; // integer division
  float u = (float(x) + 0.5) / float(width); // map into 0-1 range
  float v = (float(y) + 0.5) / float(width);
  vec4 instPos = texture(positionSampler, vec2(u, v));
  vec4 instVel = texture(velocitySampler, vec2(u, v));

  mat3 rotation;
  makeRotation(normalize(vec3(instVel)), rotation);
  vec4 rotatedVert = vec4(rotation * position, 1.0);

  rotatedVert *= size;

  vec4 totalPosition = vec4(rotatedVert.xyz + instPos.xyz, 1.0);

  vPositionW = totalPosition.xyz;
  vNormalW = rotation * normal;

  gl_Position = worldViewProjection * totalPosition;
  #include<logDepthVertex>
}
