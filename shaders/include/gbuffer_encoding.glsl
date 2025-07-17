#if ! defined INCLUDE_GBUFFER_ENCODING
#define INCLUDE_GBUFFER_ENCODING

#include "/include/utility/encoding.glsl"

struct GbufferData {
    vec3 base_color;
    vec3 flat_normal;
    vec2 lightmap;
    uint material_mask;
    vec3 detail_normal;
    vec4 specular_map;
};

uvec4 encode_gbuffer_data(GbufferData data) {
    return uvec4(
        packUnorm4x8(vec4(data.base_color, float(data.material_mask) * rcp(255.0))),
        packUnorm4x8(vec4(encode_unit_vector(data.flat_normal), data.lightmap)),
        packUnorm2x16(encode_unit_vector(data.detail_normal)),
        packUnorm4x8(data.specular_map)
    );
}

GbufferData decode_gbuffer_data(uvec4 encoded) {
    mat3x4 unpacked = mat3x4(
        unpackUnorm4x8(encoded.x),
        unpackUnorm4x8(encoded.y),
        unpackUnorm4x8(encoded.w)
    );

    GbufferData data;
    data.base_color = unpacked[0].xyz;
    data.material_mask = uint(unpacked[0].w * 255.0 + 0.5);
    data.flat_normal = decode_unit_vector(unpacked[1].xy);
    data.lightmap = unpacked[1].zw;
    data.detail_normal = decode_unit_vector(unpackUnorm2x16(encoded[2]));
    data.specular_map = unpacked[2];

    return data;
}

#endif // INCLUDE_GBUFFER_ENCODING

