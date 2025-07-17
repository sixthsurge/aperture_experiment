#version 430

layout (local_size_x = 1, local_size_y = 1, local_size_z = 1) in;

layout (std140, binding = 0) buffer 
#include "/include/buffer/exposure.glsl"

uniform usampler2D exposure_histogram_tex;

#include "/include/prelude.glsl"
#include "/include/exposure.glsl"

void main() {
    // Calculate median luminance

    uint histogram_target_cdf = uint(0.75 * ap.game.screenSize.x * ap.game.screenSize.y);

    uint cdf = 0;
    uint best_bin = 0;

    for (uint i = 0; i < HISTOGRAM_BINS; ++i) {
        uint count = texelFetch(exposure_histogram_tex, ivec2(i, 0), 0).x;

        cdf += count;

        if (cdf > histogram_target_cdf) {
            best_bin = i;
            break;
        }
    }

    // Calculate exposure

    float median_luminance = get_luminance_from_bin(int(best_bin));

    const float blend_factor = clamp01(4.0 * ap.time.delta);

    exposure.value = mix(
        max0(exposure.previous_value),
        get_exposure_from_luminance(median_luminance),
        blend_factor
    );

    exposure.previous_value = exposure.value;
}
