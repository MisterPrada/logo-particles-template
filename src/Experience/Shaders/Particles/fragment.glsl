/* Custom code */

varying vec3 vPosition;

// add function bokeh
float bokeh(float distanceToCenter, float strength) {
    return 0.05 / distanceToCenter - 0.1;
}

// End Custom code

uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
    vec4 diffuseColor = vec4(diffuse, opacity);
    #include <clipping_planes_fragment>
    vec3 outgoingLight = vec3(0.0);
    #include <logdepthbuf_fragment>
    #include <map_particle_fragment>
    #include <color_fragment>
    #include <alphatest_fragment>
    #include <alphahash_fragment>

    // Custom code
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05 / distanceToCenter - 0.1;
    diffuseColor.rgb = vec3(1.0, 1.0, 1.0) * strength;
    // End Custom code

    outgoingLight = diffuseColor.rgb;
    #include <opaque_fragment>
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>



    //gl_FragColor.a = strength - (length(vPosition.z) * 0.1);
    //gl_FragColor.a = 30.0 - length(vPosition.z);
}
