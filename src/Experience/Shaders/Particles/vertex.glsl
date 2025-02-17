/* Custrom Uniforms and Attributes */
#include ../Includes/simplexNoise4d.glsl
#include ../Includes/simplexNoise3d.glsl

#ifndef HALF_PI
#define HALF_PI 1.5707963267948966
#endif

uniform float uTime;
uniform float uProgress;
uniform sampler2D uLogoTexture;
attribute vec2 aParticlesUv;
varying vec3 vPosition;

float sineOut(float t){
    return sin(t*HALF_PI);
}

float exponentialOut(float t){
    return t==1.0 ? t : 1.0-pow(2.0, -10.0*t);
}

float inOutProgress(vec3 position, vec3 target, float progress) {
    // Mixed position
    float noiseOrigin = simplexNoise3d(position * 0.4);
    float noiseTarget = simplexNoise3d(target * 0.1);
    float noise = mix(noiseOrigin, noiseTarget, progress);
    noise = smoothstep(-1.0, 1.0, noise);

    float duration = 0.3;
    float delay = (1.0 - duration) * noise;
    float end = delay + duration;
    float progressOut = smoothstep(delay, end, progress);

    return progressOut;
}
/* End Custrom Uniforms and Attributes */

uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
varying vec2 vUv;
uniform mat3 uvTransform;
#endif
void main() {
    #ifdef USE_POINTS_UV
    vUv = (uvTransform * vec3(uv, 1)).xy;
    #endif
    #include <color_vertex>
    #include <morphinstance_vertex>
    #include <morphcolor_vertex>
    #include <begin_vertex>

    float time = uTime * 0.2;
    vec4 logoTexture = texture(uLogoTexture, aParticlesUv);


    float inOutProgress = inOutProgress(transformed.xyz, logoTexture.xyz, uProgress);



    transformed.xyz = mix(transformed.xyz, logoTexture.xyz, inOutProgress);

    transformed.x *= sin(inOutProgress * 10.0); // force swirly effect



    vPosition = transformed.xyz;

    #include <morphtarget_vertex>
    #include <project_vertex>
    gl_PointSize = size;
    #ifdef USE_SIZEATTENUATION
    bool isPerspective = isPerspectiveMatrix(projectionMatrix);
    if (isPerspective) gl_PointSize *= (scale / - mvPosition.z);
    #endif
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    #include <worldpos_vertex>
    #include <fog_vertex>
}
