#define GLSLIFY 1
attribute vec3 position;
attribute vec2 uv;
attribute vec2 planeUV;
attribute vec2 uvOffset;
attribute vec2 centerUV;
attribute vec4 randomValues;
attribute vec4 charRandomValues;
attribute vec2 offset;
attribute float charIndex;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec2 uvSize;
uniform float animationValue0;
uniform float animationValue1;
uniform float planeSize;
uniform float time;
uniform float numChars;
uniform float animationTimeOffset;
uniform vec3 color0;
uniform vec3 color1;
varying vec2 vUvOrg;
varying vec2 vUv;
varying vec2 vScaledUv;
varying vec2 vCenterUV;
varying float vA0;
varying float vAlpha;
varying float vTextureColorFactor;
varying vec3 vColor;
const float PI=3.1415926535897932384626433832795;
float getAnimationValueRandomDuration(float aValue, float randomValue1, float randomValue2, float minOffsetRatio, float maxOffsetRatio, float minDurationRatio, float maxDurationRatio){
    float offsetRatio=minOffsetRatio+(maxOffsetRatio-minOffsetRatio)*randomValue1;
    float durationRatioBase=1.0-offsetRatio;
    float durationRatio=durationRatioBase*(minDurationRatio+(maxDurationRatio-minDurationRatio)*randomValue2);
    float vertexAnimationValue=max(0.0, aValue-offsetRatio);
    vertexAnimationValue=vertexAnimationValue/durationRatio;
    return clamp(vertexAnimationValue, 0.0, 1.0);
}
vec3 mod289_0(vec3 x){
    return x-floor(x*(1.0/289.0))*289.0;
}
vec2 mod289_0(vec2 x){
    return x-floor(x*(1.0/289.0))*289.0;
}
vec3 permute_0(vec3 x){
    return mod289_0(((x*34.0)+1.0)*x);
}
float snoise_0(vec2 v){
    const vec4 C=vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i=floor(v+dot(v, C.yy));
    vec2 x0=v-i+dot(i, C.xx);
    vec2 i1;
    i1=(x0.x>x0.y)? vec2(1.0, 0.0): vec2(0.0, 1.0);
    vec4 x12=x0.xyxy+C.xxzz;
    x12.xy-=i1;
    i=mod289_0(i);
    vec3 p=permute_0(permute_0(i.y+vec3(0.0, i1.y, 1.0))+i.x+vec3(0.0, i1.x, 1.0));
    vec3 m=max(0.5-vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m=m*m;
    m=m*m;
    vec3 x=2.0*fract(p*C.www)-1.0;
    vec3 h=abs(x)-0.5;
    vec3 ox=floor(x+0.5);
    vec3 a0=x-ox;
    m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x=a0.x*x0.x+h.x*x0.y;
    g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.0*dot(m, g);
}
vec3 mod289_1(vec3 x){
    return x-floor(x*(1.0/289.0))*289.0;
}
vec4 mod289_1(vec4 x){
    return x-floor(x*(1.0/289.0))*289.0;
}
vec4 permute_1(vec4 x){
    return mod289_1(((x*34.0)+1.0)*x);
}
vec4 taylorInvSqrt(vec4 r){
    return 1.79284291400159-0.85373472095314*r;
}
float snoise_1(vec3 v){
    const vec2 C=vec2(1.0/6.0, 1.0/3.0);
    const vec4 D=vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i=floor(v+dot(v, C.yyy));
    vec3 x0=v-i+dot(i, C.xxx);
    vec3 g_0=step(x0.yzx, x0.xyz);
    vec3 l=1.0-g_0;
    vec3 i1=min(g_0.xyz, l.zxy);
    vec3 i2=max(g_0.xyz, l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289_1(i);
    vec4 p=permute_1(permute_1(permute_1(i.z+vec4(0.0, i1.z, i2.z, 1.0))+i.y+vec4(0.0, i1.y, i2.y, 1.0))+i.x+vec4(0.0, i1.x, i2.x, 1.0));
    float n_=0.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy, y.xy);
    vec4 b1=vec4(x.zw, y.zw);
    vec4 s0=floor(b0)*2.0+1.0;
    vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h, vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy, h.x);
    vec3 p1=vec3(a0.zw, h.y);
    vec3 p2=vec3(a1.xy, h.z);
    vec3 p3=vec3(a1.zw, h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0*=norm.x;
    p1*=norm.y;
    p2*=norm.z;
    p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m=m*m;
    return 42.0*dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

#ifndef HALF_PI
#define HALF_PI 1.5707963267948966
#endif
float sineOut(float t){

    return sin(t*HALF_PI);

}


float exponentialOut(float t){
    return t==1.0 ? t : 1.0-pow(2.0, -10.0*t);
}

void main(void){

    float noiseValue=snoise_0(vec2(offset.xy));

    float _a0=getAnimationValueRandomDuration(animationValue0, randomValues.x*0.25+charIndex/numChars*0.5, randomValues.w, 0.0, 0.6, 0.1, 1.0);
    vAlpha=smoothstep(0.0, 0.4, _a0);
    vTextureColorFactor=smoothstep(0.8, 1.0, _a0);
    float a0=sineOut(_a0);
    vColor=mix(color1, color0, min(1.0, randomValues.z*0.4+a0));
    float scale=10.0+randomValues.x*6.0;
    vec3 pos=position*(scale-a0*(scale-1.0));
    pos+=vec3(charRandomValues.x*planeSize*50.0*(randomValues.y*0.2+0.8), charRandomValues.y*planeSize*320.0*(randomValues.x*0.2+0.8), charRandomValues.z*planeSize*18.0)*(1.0-a0);
    pos.x+=planeSize*60.0*(randomValues.z*0.2+0.8)*sin(animationTimeOffset+a0*PI*1.6*(randomValues.w*0.2+0.8)+charIndex*100.0)*(1.0-smoothstep(0.6, 1.0, a0));
    pos.xy+=offset*a0;
    vUvOrg=uv;
    vUv=uvOffset+vec2(uv.x, 1.0-uv.y)*uvSize;
    vUv.y=1.0-vUv.y;
    vCenterUV=centerUV;
    vA0=a0;
    vec4 modelPos=modelMatrix*vec4(pos, 1.0);
    gl_Position=projectionMatrix*viewMatrix*modelPos;
}


