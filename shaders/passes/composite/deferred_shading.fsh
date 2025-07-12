#version 430

layout (location = 0) out vec3 radiance_out;

noperspective in vec2 uv;

layout (std140, binding = 0) uniform
#include "/include/buffer/global.glsl"

layout (std140, binding = 1) uniform
#include "/include/buffer/sky_sh.glsl"

uniform sampler2D solidDepthTex;
uniform sampler2DArrayShadow solidShadowMapFiltered;

uniform sampler3D atmosphere_scattering_lut;
uniform sampler2D gbuffer_data_tex;

#include "/include/prelude.glsl"
#include "/include/atmosphere.glsl"
#include "/include/bsdf.glsl"
#include "/include/gbuffer_encoding.glsl"
#include "/include/material.glsl"
#include "/include/shadow/sampling.glsl"
#include "/include/utility/color.glsl"
#include "/include/utility/space_conversion.glsl"
#include "/include/utility/spherical_harmonics.glsl"

void main() {
    ivec2 pixel_pos = ivec2(gl_FragCoord.xy);

    // Sample textures

    float depth = texelFetch(solidDepthTex, pixel_pos, 0).x;
    vec4 encoded_gbuffer_data = texelFetch(gbuffer_data_tex, pixel_pos, 0);

    // Space conversions

    vec3 position_s = vec3(uv, depth);
    vec3 position_v = screen_to_view_space(position_s);
    vec3 position_p = view_to_scene_space(position_v);
    vec3 position_w = position_p + ap.camera.pos;

    vec3 direction_w = normalize(position_p - ap.camera.view[3].xyz);

    if (depth == 1.0) {
        // Sky
        radiance_out = atmosphere_scattering(
            atmosphere_scattering_lut,
            direction_w,
            sun_irradiance,
            global.sun_direction,
            moon_irradiance,
            global.moon_direction,
            true
        );
    } else {
        // Decode gbuffer data

        GbufferData gbuffer_data = decode_gbuffer_data(encoded_gbuffer_data);

        vec3 normal = gbuffer_data.flat_normal;

        // Get material

        Material material = material_from(gbuffer_data.base_color);

		// Directional light

		float NoL = dot(normal, global.light_direction);
		float NoV = clamp01(dot(normal, -direction_w));
		float LoV = dot(global.light_direction, -direction_w);
		float halfway_norm = inversesqrt(2.0 * LoV + 2.0);
		float NoH = (NoL + NoV) * halfway_norm;
		float LoH = LoV * halfway_norm + halfway_norm;

        vec3 diffuse = diffuse_hammon(
            material.albedo,
            material.roughness,
            material.f0.x,
            NoL,
            NoV,
            NoH,
            LoV
        ) * material.albedo;
        vec3 specular = specular_smith_ggx(
            material,
            NoL,
            NoV,
            NoH,
            LoV,
            LoH
        );
        vec3 shadow = get_shadow(position_p, gbuffer_data.flat_normal);

        radiance_out = (diffuse + specular) * shadow * global.light_irradiance;

        // Ambient light 

        vec3 ambient_irradiance = sh_evaluate_irradiance(
            sky_sh.coeff, 
            normal, 
            1.0
        );

        radiance_out += (material.albedo * rcp(pi)) * ambient_irradiance;
    }
}
