#version 430
#include "/include/prelude.glsl"
#include "/include/buffer/exposure.glsl"
#include "/include/buffer/streamed_settings.glsl"

layout(location = 0) out vec3 color_out;

in vec2 uv;

uniform sampler3D tony_mcmapface_lut;

uniform sampler2D radiance_tex;
uniform sampler2D bloom_tiles_tex_a;
uniform sampler2D bloom_tiles_tex_b;

layout(std140, binding = 0) uniform StreamedSettingsBuffer {
    StreamedSettings streamed_settings;
};

layout(std140, binding = 1) uniform ExposureBuffer {
    ExposureData exposure;
};

#include "/include/tony_mcmapface.glsl"
#include "/include/utility/bicubic.glsl"
#include "/include/utility/color.glsl"
#include "/include/utility/dithering.glsl"

// Source: http://www.diva-portal.org/smash/get/diva2:24136/FULLTEXT01.pdf
vec3 purkinje_shift(vec3 rgb, float purkinje_intensity) {
    if (purkinje_intensity == 0.0) return rgb;

    const vec3 purkinje_tint = vec3(0.5, 0.7, 1.0) * rec709_to_rec2020;
    const vec3 rod_response = vec3(7.15e-5, 4.81e-1, 3.28e-1) * rec709_to_rec2020;
    vec3 xyz = rgb * rec2020_to_xyz;

    vec3 scotopic_luminance = xyz * (1.33 * (1.0 + (xyz.y + xyz.z) / xyz.x) - 1.68);

    float purkinje = dot(rod_response, scotopic_luminance * xyz_to_rec2020);

    rgb = mix(rgb, purkinje * purkinje_tint, exp2(-rcp(purkinje_intensity) * purkinje));

    return max0(rgb);
}

vec3 apply_bloom(ivec2 texel, vec3 color) {
    // Final upsampling step from lod 1 to lod 0
    // Blurred lod 0 in bloom_tiles_a
    // Blurred lod 1 in:
    //   Even BLOOM_TILES => bloom_tiles_tex_a
    //   Odd  BLOOM_TILES => bloom_tiles_tex_b

#if BLOOM_TILES & 1 == 0 
    #define BLOOM_LOD_1_SRC bloom_tiles_tex_a
#else
    #define BLOOM_LOD_1_SRC bloom_tiles_tex_b
#endif

    vec3 bloom_0 = texelFetch(bloom_tiles_tex_a, texel, 0).rgb; 
    vec3 bloom_1 = bicubic_filter_lod(BLOOM_LOD_1_SRC, uv, 1).rgb;

    vec3 bloom = (bloom_0 + bloom_1) * rcp(float(BLOOM_TILES));

    return mix(color_out, bloom, streamed_settings.bloom_intensity);
}

void main() {
    ivec2 texel = ivec2(gl_FragCoord.xy);

    color_out = texelFetch(radiance_tex, texel, 0).rgb;

    // Apply bloom
    if (streamed_settings.bloom_enabled) {
        color_out = apply_bloom(texel, color_out);
    }

    // Exposure
    if (streamed_settings.auto_exposure_enabled) {
        color_out *= exposure.value;
    } else {
        color_out *= streamed_settings.manual_exposure_value;
    }

    // Purkinje shift
    color_out = purkinje_shift(color_out, 0.01);

	// Contrast
    const float contrast = 1.1;
	const float log_midpoint = log2(0.18);
	color_out = log2(color_out + eps);
	color_out = contrast * (color_out - log_midpoint) + log_midpoint;
	color_out = max0(exp2(color_out) - eps);

    // Saturation
    const float saturation = 1.03;
    color_out = max0(mix(
        vec3(dot(color_out, luminance_weights_rec2020)),
        color_out, 
        1.05
    ));

    // Rec. 2020 -> Rec. 709
    color_out = color_out * rec2020_to_rec709;

    // Tonemap
    color_out = tony_mcmapface(tony_mcmapface_lut, max0(color_out));

    // Linear -> sRGB
    color_out = srgb_eotf(color_out);

    // Dithering
    color_out = dither_8bit(color_out, bayer16(vec2(texel)));
}
