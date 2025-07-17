#version 430
#include "/include/prelude.glsl"
#include "/include/buffer/global.glsl"
#include "/include/buffer/sky_sh.glsl"

layout (location = 0) out vec3 radiance_out;

in vec2 uv;

layout (std140, binding = 0) uniform GlobalBuffer {
    GlobalData global;
};

layout (std140, binding = 1) uniform SkyShBuffer {
    SkySh sky_sh;
};

uniform sampler2D solidDepthTex;
uniform sampler2D handDepth;
uniform sampler2DArrayShadow solidShadowMapFiltered;

#ifdef POINT_SHADOW
uniform samplerCubeArrayShadow pointLightFiltered;
#endif

uniform sampler3D atmosphere_scattering_lut;
uniform usampler2D gbuffer_data_tex;

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
    ivec2 iuv = ivec2(gl_FragCoord.xy);

    // Sample textures

    float depth = texelFetch(solidDepthTex, iuv, 0).x;
    float hand_depth = texelFetch(handDepth, iuv, 0).x;
    uvec4 encoded_gbuffer_data = texelFetch(gbuffer_data_tex, iuv, 0);

    // Space conversions

    bool is_hand = hand_depth != 1.0;
    if (is_hand) { depth = hand_depth; }

    vec3 pos_screen = vec3(uv, depth);
    vec3 pos_view   = screen_to_view_space(pos_screen);
    vec3 pos_scene  = view_to_scene_space(pos_view);
    vec3 pos_world  = pos_scene + ap.camera.pos;

    vec3 dir_world = normalize(pos_scene - ap.camera.view[3].xyz);

    if (depth == 1.0) {
        // Sky
        radiance_out = atmosphere_scattering(
            atmosphere_scattering_lut,
            dir_world,
            sun_irradiance,
            global.sun_dir,
            moon_irradiance,
            global.moon_dir,
            true
        );
    } else {
        // Decode gbuffer data

        GbufferData gbuffer_data = decode_gbuffer_data(encoded_gbuffer_data);

        vec3 normal = gbuffer_data.detail_normal;

        // Get material

        Material material = material_from(gbuffer_data.base_color);

#ifdef USE_SPECULAR_MAP
        decode_specular_map(gbuffer_data.specular_map, material);
#endif

		// Directional light

		float NoL = dot(normal, global.light_dir);
		float NoV = clamp01(dot(normal, -dir_world));
		float LoV = dot(global.light_dir, -dir_world);
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
            sun_angular_radius,
            NoL,
            NoV,
            NoH,
            LoV,
            LoH
        );
        vec3 shadow = get_shadow(pos_scene, gbuffer_data.flat_normal);

        radiance_out = (diffuse + specular) * max0(NoL) * shadow * global.light_irradiance;

        // Ambient light 

        vec3 ambient_irradiance = sh_evaluate_irradiance(
            sky_sh.coeff, 
            normal,
            1.0
        ) * sqr(gbuffer_data.lightmap.y);

        radiance_out += material.albedo * ambient_irradiance * rcp(pi);

        // Emission 

        float emission = float(material_mask_emission(gbuffer_data.material_mask)) * rcp(15.0);
        radiance_out += 0.1 * emission * material.albedo;

        // Point shadows

#ifdef POINT_SHADOW
        vec3 pos_biased = pos_scene + 0.15 * gbuffer_data.flat_normal;
        for (uint i = 0; i <= ap.point.total; ++i) {
            ap_PointLight light = iris_getPointLight(i);
            if (light.block == -1) continue;

            vec3 fragment_to_light = light.pos - pos_biased;
            vec3 light_dir; float light_distance;
            length_normalize(fragment_to_light, light_dir, light_distance);

            // Sample shadow
            float shadow_depth = linear_step(
                ap.point.nearPlane,
                ap.point.farPlane,
                light_distance
            );
            if (shadow_depth > 1.0) {
                continue;
            }

            // Normalize depth to NDC space [-1 to +1]
            // From point shadow sample by Null
            float sample_dist = max_of(abs(fragment_to_light)) - 0.02;
            float ndc_depth = (ap.point.farPlane + ap.point.nearPlane - 2.0 * ap.point.nearPlane * ap.point.farPlane / sample_dist) / (ap.point.farPlane - ap.point.nearPlane);
            float shadow = texture(pointLightFiltered, vec4(-light_dir, i), ndc_depth * 0.5 + 0.5).x
                * float(dot(gbuffer_data.flat_normal, light_dir) > eps);

            float attenuation = rcp(sqr(light_distance));
            float edge_fade = 1.0 - pow8(shadow_depth);
            float light_intensity = iris_getEmission(light.block);
            vec3 light_color = srgb_eotf_inv(iris_getLightColor(light.block).rgb) * rec709_to_rec2020;

            vec3 irradiance = 0.05 * light_color * (light_intensity * shadow * attenuation * edge_fade * max0(dot(normal, light_dir)));

            float NoL = dot(normal, light_dir);
            float NoV = clamp01(dot(normal, -dir_world));
            float LoV = dot(light_dir, -dir_world);
            float halfway_norm = inversesqrt(2.0 * LoV + 2.0);
            float NoH = (NoL + NoV) * halfway_norm;
            float LoH = LoV * halfway_norm + halfway_norm;

            float light_angular_radius = clamp(0.5 / max(light_distance, eps), 0.0, pi);

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
                light_angular_radius,
                NoL,
                NoV,
                NoH,
                LoV,
                LoH
            );

            radiance_out += (diffuse + specular) * irradiance * shadow * max0(NoL);
        }
#endif
    }
}
