#version 430

layout (location = 0) out uvec4 gbuffer_data_out;

in VertexOutputs {
    vec2 atlas_uv;
    vec2 lightmap;
    vec4 color;
    flat mat3 tbn;

#if defined OBJECT_TERRAIN_SOLID || defined OBJECT_TERRAIN_CUTOUT
    flat uint block;
#endif
} inputs;

#include "/include/prelude.glsl"
#include "/include/utility/dithering.glsl"
#include "/include/gbuffer_encoding.glsl"

#if defined OBJECT_TERRAIN_SOLID || defined OBJECT_TERRAIN_CUTOUT
#include "/include/material_mask.glsl"
#endif

#if   TEXTURE_FORMAT == TEXTURE_FORMAT_LAB
void decode_normal_map(vec3 normal_map, out vec3 normal, out float ao) {
	normal.xy = normal_map.xy * 2.0 - 1.0;
	normal.z  = sqrt(clamp01(1.0 - dot(normal.xy, normal.xy)));
	ao        = normal_map.z;
}
#elif TEXTURE_FORMAT == TEXTURE_FORMAT_OLD
void decode_normal_map(vec3 normal_map, out vec3 normal, out float ao) {
	normal  = normal_map * 2.0 - 1.0;
	ao      = length(normal);
	normal *= rcp(ao);
}
#endif

void iris_emitFragment() {
    vec2 new_atlas_uv = inputs.atlas_uv;
    vec2 new_lightmap = inputs.lightmap;
    vec4 new_color    = inputs.color;
    iris_modifyBase(new_atlas_uv, new_color, new_lightmap);
    new_lightmap = linear_step(vec2(1.0 / 32.0), vec2(31.0 / 32.0), new_lightmap);

    vec4 base_color = iris_sampleBaseTex(new_atlas_uv) * new_color;

    vec3 detail_normal = inputs.tbn[2];
    vec4 specular_map = vec4(0.0);

#ifdef USE_NORMAL_MAP
    vec3 normal_map = iris_sampleNormalMap(new_atlas_uv).xyz;
    float texture_ao;
    decode_normal_map(normal_map, detail_normal, texture_ao);
    detail_normal = inputs.tbn * detail_normal;
#endif

#ifdef USE_SPECULAR_MAP
    specular_map = iris_sampleSpecularMap(new_atlas_uv);
#endif

    // Alpha test
    if (iris_discardFragment(base_color)) discard;

    // Dithering for lightmaps
    float dither = interleaved_gradient_noise(gl_FragCoord.xy, ap.time.frames);

    // Encode gbuffer data
    GbufferData gbuffer_data;
    gbuffer_data.base_color = base_color.rgb;
    gbuffer_data.flat_normal = inputs.tbn[2];
    gbuffer_data.lightmap = dither_8bit(new_lightmap, dither);
    gbuffer_data.detail_normal = detail_normal;
    gbuffer_data.specular_map = specular_map;

#if defined OBJECT_TERRAIN_SOLID || defined OBJECT_TERRAIN_CUTOUT
    gbuffer_data.material_mask = create_material_mask(inputs.block);
#else
    gbuffer_data.material_mask = 0u;
#endif

    gbuffer_data_out = encode_gbuffer_data(gbuffer_data);
}
