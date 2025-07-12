#version 430

layout (local_size_x = 8, local_size_y = 8, local_size_z = 1) in;

layout (std140, binding = 0) buffer HistogramBuffer {
    uint bin[HISTOGRAM_BINS];
} histogram;

uniform sampler2D radiance_tex;

#include "/include/prelude.glsl"
#include "/include/exposure.glsl"
#include "/include/utility/color.glsl"

void main() {
    ivec2 pixel_pos = ivec2(gl_GlobalInvocationID.xy);

    if (any(greaterThan(pixel_pos, ap.game.screenSize))) return;

    vec3 radiance = texelFetch(radiance_tex, pixel_pos, 0).rgb;
    float luminance = dot(radiance, luminance_weights_rec709);
    uint bin_index = uint(get_bin_from_luminance(luminance));
    atomicAdd(histogram.bin[bin_index], 1u);
}
