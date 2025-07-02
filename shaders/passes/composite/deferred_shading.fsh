#version 430

#include "/include/prelude.glsl"
#include "/include/buffer/global.glsl"
#include "/include/utility/color.glsl"
#include "/include/utility/space_conversion.glsl"
#include "/include/atmosphere.glsl"
#include "/include/gbuffer_encoding.glsl"

layout (location = 0) out vec3 radiance_out;

noperspective in vec2 uv;

uniform sampler3D atmosphere_scattering_lut;

uniform sampler2D gbuffer_data_tex;

uniform sampler2D solidDepthTex;

layout (std140, binding = 0) uniform GlobalDataBuffer {
    GlobalData global_data;
};

void main() {
    ivec2 pixel_pos = ivec2(gl_FragCoord.xy);

    // Sample textures

    float depth = texelFetch(solidDepthTex, pixel_pos, 0).x;
    vec4 encoded_gbuffer_data = texelFetch(gbuffer_data_tex, pixel_pos, 0);

    // Space conversions

    vec3 position_screen = vec3(uv, depth);
    vec3 position_view   = screen_to_view_space(position_screen);
    vec3 position_scene  = view_to_scene_space(position_view);
    vec3 position_world  = position_scene + ap.camera.pos;

    vec3 direction_world = normalize(position_scene - ap.camera.view[3].xyz);

    if (depth == 1.0) {
        // Sky
        radiance_out = atmosphere_scattering(
            atmosphere_scattering_lut,
            direction_world,
            sun_irradiance,
            global_data.sun_direction,
            moon_irradiance,
            global_data.moon_direction,
            true
        );
    } else {
        // Decode gbuffer data

        GbufferData gbuffer_data = decode_gbuffer_data(encoded_gbuffer_data);

        radiance_out = srgb_eotf_inv(gbuffer_data.base_color) * max0(dot(gbuffer_data.flat_normal, global_data.light_direction)) * global_data.light_irradiance * rcp(pi);
    }
}
