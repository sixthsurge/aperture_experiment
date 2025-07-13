#if !defined INCLUDE_GBUFFER_ENCODING 
#define INCLUDE_GBUFFER_ENCODING

#include "/include/utility/encoding.glsl"

struct GbufferData {
    vec3 base_color;
    vec3 flat_normal;
    vec2 lightmap;
    uint material_mask;
};

vec4 encode_gbuffer_data(GbufferData gbuffer_data) {
    return vec4(
        pack_unorm_2x8(gbuffer_data.base_color.rg),
        pack_unorm_2x8(gbuffer_data.base_color.b, float(gbuffer_data.material_mask) * rcp(255.0)),
        pack_unorm_2x8(encode_unit_vector(gbuffer_data.flat_normal)),
        pack_unorm_2x8(gbuffer_data.lightmap)
    );
}

GbufferData decode_gbuffer_data(vec4 encoded_gbuffer_data) {
    mat4x2 data = mat4x2(
        unpack_unorm_2x8(encoded_gbuffer_data.x),
        unpack_unorm_2x8(encoded_gbuffer_data.y),
        unpack_unorm_2x8(encoded_gbuffer_data.z),
        unpack_unorm_2x8(encoded_gbuffer_data.w)
    );

    GbufferData gbuffer_data;
    gbuffer_data.base_color    = vec3(data[0], data[1].x);
    gbuffer_data.flat_normal   = decode_unit_vector(data[2]);
    gbuffer_data.lightmap      = data[3];
    gbuffer_data.material_mask = uint(data[1].y * 255.0 + 0.5);

    return gbuffer_data;
}

#endif // INCLUDE_GBUFFER_ENCODING

