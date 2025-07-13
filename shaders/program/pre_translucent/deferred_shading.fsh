#version 430

layout (location = 0) out vec3 radiance_out;

noperspective in vec2 uv;

layout (std140, binding = 0) uniform
#include "/include/buffer/global.glsl"

layout (std140, binding = 1) uniform
#include "/include/buffer/sky_sh.glsl"

uniform sampler2D solidDepthTex;
uniform sampler2DArrayShadow solidShadowMapFiltered;

#ifdef POINT_SHADOW
uniform samplerCubeArrayShadow pointLightFiltered;
#endif

uniform sampler3D atmosphere_scattering_lut;
uniform sampler2D gbuffer_data_tex;

#include "/include/prelude.glsl"
#include "/include/atmosphere.glsl"
#include "/include/bsdf.glsl"
#include "/include/gbuffer_encoding.glsl"
#include "/include/material.glsl"
#include "/include/material_mask.glsl"
#include "/include/shadow/sampling.glsl"
#include "/include/utility/color.glsl"
#include "/include/utility/fast_math.glsl"
#include "/include/utility/space_conversion.glsl"
#include "/include/utility/spherical_harmonics.glsl"

void main() {
    ivec2 pixel_pos = ivec2(gl_FragCoord.xy);

    // Sample textures

    float depth = texelFetch(solidDepthTex, pixel_pos, 0).x;
    vec4 encoded_gbuffer_data = texelFetch(gbuffer_data_tex, pixel_pos, 0);

    // Space conversions

    vec3 pos_screen = vec3(uv, depth);
    vec3 pos_view   = screen_to_view_space(pos_screen);
    vec3 pos_scene  = view_to_scene_space(pos_view);
    vec3 pos_world  = pos_scene + ap.camera.pos;

    vec3 dir_w = normalize(pos_scene - ap.camera.view[3].xyz);

    if (depth == 1.0) {
        // Sky
        radiance_out = atmosphere_scattering(
            atmosphere_scattering_lut,
            dir_w,
            sun_irradiance,
            global.sun_dir,
            moon_irradiance,
            global.moon_dir,
            true
        );
    } else {
        // Decode gbuffer data

        GbufferData gbuffer_data = decode_gbuffer_data(encoded_gbuffer_data);

        vec3 normal = gbuffer_data.flat_normal;

        // Get material

        Material material = material_from(gbuffer_data.base_color);

		// Directional light

		float NoL = dot(normal, global.light_dir);
		float NoV = clamp01(dot(normal, -dir_w));
		float LoV = dot(global.light_dir, -dir_w);
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
        vec3 shadow = get_shadow(pos_scene, gbuffer_data.flat_normal);

        radiance_out = (diffuse + specular) * shadow * global.light_irradiance;

        // Ambient light 

        vec3 ambient_irradiance = sh_evaluate_irradiance(
            sky_sh.coeff, 
            normal, 
            1.0
        );

        radiance_out += material.albedo * rcp(pi) * ambient_irradiance;

        // Emission 

        float emission = float(material_mask_emission(gbuffer_data.material_mask)) * rcp(15.0);
        radiance_out += 0.1 * emission * material.albedo;

        // Point shadows

#ifdef POINT_SHADOW
        for (uint i = 0; i <= ap.point.total; ++i) {
            ap_PointLight light = iris_getPointLight(i);
            if (light.block == -1) continue;

            vec3 fragment_to_light = light.pos - pos_scene;
            vec3 light_dir; float light_distance;
            length_normalize(fragment_to_light, light_dir, light_distance);

            // Sample shadow
            float shadow_depth = linear_step(
                ap.point.nearPlane,
                ap.point.farPlane,
                light_distance
            );
            float shadow = texture(pointLightFiltered, vec4(-light_dir, i), shadow_depth - 0.005).x;

            float attenuation = rcp(sqr(light_distance));
            float edge_fade = pow32(1.0 - shadow_depth);
            float light_intensity = iris_getEmission(light.block);
            vec3 light_color = srgb_eotf_inv(iris_getLightColor(light.block).rgb) * rec709_to_rec2020;

            vec3 irradiance = 0.05 * light_color * (light_intensity * shadow * attenuation * edge_fade * max0(dot(normal, light_dir)));

            radiance_out += material.albedo * irradiance * rcp(pi);
        }
#endif
    }
}
