#version 430

#include "/include/prelude.glsl"
#include "/include/utility/color.glsl"
#include "/include/tony_mcmapface.glsl"

layout (location = 0) out vec3 color_out;

in vec2 uv;

uniform sampler3D tony_mcmapface_lut;

uniform sampler2D radiance_tex;

void main() {
    const float exposure = 16.0;

    ivec2 pixel_pos = ivec2(gl_FragCoord.xy);

    color_out = texelFetch(radiance_tex, pixel_pos, 0).rgb;

    // Tonemap
    color_out = tony_mcmapface(tony_mcmapface_lut, color_out * exposure);

    // Linear -> sRGB
    color_out = srgb_eotf(color_out);
}
