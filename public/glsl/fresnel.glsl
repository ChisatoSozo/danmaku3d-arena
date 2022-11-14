#include<logDepthDeclaration>
varying vec3 vPositionW;
varying vec3 vNormalW;
uniform vec3 cameraPosition;
uniform vec3 playerPosition;
uniform float greyscaleDistance;

void main() {
  vec3 color = vec3(1., 1., 1.);
  vec3 toColor = vec3(1., 0., 0.);

  vec3 vNormalW2 = vNormalW;

  vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
  float fresnelTerm = dot(viewDirectionW, vNormalW2);
  fresnelTerm = clamp(1. - fresnelTerm, 0., 1.0);

  color = mix(color, toColor, fresnelTerm);

  float grey = dot(color, vec3(0.299, 0.587, 0.114));
  float greyscale = float(distance(playerPosition, vPositionW) > greyscaleDistance);

  vec3 kindagrey = mix(vec3(grey), color, 0.2);

  color = greyscale * kindagrey + (1. - greyscale) * color;

  gl_FragColor = vec4(color, 1.0);
  #include<logDepthFragment>
}
