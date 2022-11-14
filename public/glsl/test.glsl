uniform vec2 resolution;
uniform float delta;
uniform float timeSinceStart;
uniform sampler2D positionSampler;
uniform sampler2D velocitySampler;
uniform sampler2D collisionSampler;
uniform sampler2D initialPositionSampler;
uniform sampler2D initialVelocitySampler;
uniform sampler2D timingsSampler;

void main() {
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

    float phaseState = positionWithW.w;

    if(phaseState == 0. && 0. < timeSinceStart + startTime) {
        gl_FragColor = vec4(0., 0., 0., 0.);
    } else {

        if(phaseState == 1.) {
            vec3 updatedValue = position + (velocity * delta);

        }
        if(phaseState == 0.) {
            vec3 updatedValue = initialPosition;
            phaseState = 1.;
        }

        gl_FragColor = vec4(updatedValue, phaseState);
    }
}