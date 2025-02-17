#define GLSLIFY 1
uniform float time;
uniform sampler2D texture;
varying vec2 vUvOrg;
varying vec2 vUv;
varying float vA0;
varying float vAlpha;
varying float vTextureColorFactor;
varying vec2 vCenterUV;
varying vec3 vColor;
void main(void){
    float textureAlpha=texture2D(texture, vUv).a;
    float texturePlaneCenterAlpha=texture2D(texture, vCenterUV).a;
    vec2 _uv=vUvOrg*2.0-1.0;
    float circleAlpha=(1.0-smoothstep(0.0, 1.0, length(_uv)))*vAlpha*texturePlaneCenterAlpha;
    vec4 distColor=vec4(vColor, mix(circleAlpha, textureAlpha, vTextureColorFactor));
    gl_FragColor=distColor;
}

