#version 430

/*
 * Thanks to Bálint Csala for help with optimisation
 */

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout (std140, binding = 0) buffer HistogramBuffer {
    uint bin[256];
} histogram;

uniform sampler2D radiance_tex;

#include "/include/prelude.glsl"
#include "/include/exposure.glsl"
#include "/include/utility/color.glsl"

shared uint[256] local_histogram;

void add_to_histogram(vec3 radiance) {
    float luminance = dot(radiance, luminance_weights_rec709);
    uint bin_index = uint(get_bin_from_luminance(luminance));
    atomicAdd(local_histogram[bin_index], 1u);
}

void main() {
    // Zero local histogram
    local_histogram[gl_LocalInvocationIndex] = 0;
    barrier();

    // Both PIXELS_PER_THREAD_X and PIXELS_PER_THREAD_Y are 2
    ivec2 pixel_pos = ivec2(
        gl_GlobalInvocationID.x * PIXELS_PER_THREAD_X,
        gl_GlobalInvocationID.y * PIXELS_PER_THREAD_Y
    ); 

    // Reuse computation as much as possible
    bool inside00 = all(lessThan(pixel_pos, ap.game.screenSize));
    bool inside10 = pixel_pos.x + 1 < ap.game.screenSize.x;
    bool inside01 = pixel_pos.y + 1 < ap.game.screenSize.y;

    if (inside00) {
        add_to_histogram(texelFetchOffset(radiance_tex, pixel_pos, 0, ivec2(0, 0)).rgb);
    }
    if (inside10) {
        add_to_histogram(texelFetchOffset(radiance_tex, pixel_pos, 0, ivec2(1, 0)).rgb);
    }
    if (inside01) {
        add_to_histogram(texelFetchOffset(radiance_tex, pixel_pos, 0, ivec2(0, 1)).rgb);
    }
    if (inside10 && inside01) {
        add_to_histogram(texelFetchOffset(radiance_tex, pixel_pos, 0, ivec2(1, 1)).rgb);
    }

    // Add local histogram to global histogram
    barrier();
    atomicAdd(histogram.bin[gl_LocalInvocationIndex], local_histogram[gl_LocalInvocationIndex]);
}
