#version 430
#include "/include/prelude.glsl"
#include "/include/buffer/exposure.glsl"
#include "/include/buffer/streamed_settings.glsl"

layout(location = 0) out vec3 color_out;

in vec2 uv;

uniform sampler3D tony_mcmapface_lut;

uniform sampler2D radiance_tex;
uniform sampler2D bloom_tiles_tex;
uniform sampler2D bloom_tiles_alt_tex;

layout(std140, binding = 0) uniform StreamedSettingsBuffer {
    StreamedSettings streamed_settings;
};

layout(std140, binding = 1) uniform ExposureBuffer {
    ExposureData exposure;
};

#include "/include/tony_mcmapface.glsl"
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

void main() {
    ivec2 pixel_pos = ivec2(gl_FragCoord.xy);

    color_out = texelFetch(radiance_tex, pixel_pos, 0).rgb;

    // Apply bloom
    if (streamed_settings.bloom_enabled) {
        vec3 bloom = texelFetch(bloom_tiles_tex, pixel_pos, 0).rgb;
        color_out = mix(color_out, bloom, streamed_settings.bloom_intensity * 0.3);
    }

    // Exposure
    if (streamed_settings.auto_exposure_enabled) {
        color_out *= exposure.value;
    } else {
        color_out *= streamed_settings.manual_exposure_value;
    }

    // Purkinje shift
    color_out = purkinje_shift(color_out, 0.01);

    // Rec. 2020 -> Rec. 709
    color_out = color_out * rec2020_to_rec709;

    // Tonemap
    color_out = tony_mcmapface(tony_mcmapface_lut, color_out);

    // Linear -> sRGB
    color_out = srgb_eotf(color_out);

    // Dithering
    color_out = dither_8bit(color_out, bayer16(vec2(pixel_pos)));
}
