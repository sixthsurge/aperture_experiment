#if !defined INCLUDE_SHADOW_SAMPLING
#define INCLUDE_SHADOW_SAMPLING

int get_shadow_cascade(vec3 position_sv, out vec3 position_sc) {
    int cascade;

    for (cascade = 0; cascade < 4; cascade++){
        position_sc = project_ortho(ap.celestial.projection[cascade], position_sv);

        if (clamp(position_sc.xy, vec2(-1.0), vec2(1.0)) == position_sc.xy) break;
    }

    return cascade;
}

vec3 get_shadow(
    vec3 position_p,
    vec3 flat_normal_w
) {
    if (dot(flat_normal_w, global.light_dir) < eps) {
        return vec3(0.0);
    }

    float bias = 0.05;
    position_p += bias * flat_normal_w;

    vec3 position_sv = transform(ap.celestial.view, position_p);
    vec3 position_sc;

    int cascade = get_shadow_cascade(position_sv, position_sc);

    vec3 position_ss = position_sc * 0.5 + 0.5;

    float shadow_solid = texture(solidShadowMapFiltered, vec4(position_ss, cascade).xywz);

    return vec3(shadow_solid);
}

#endif
