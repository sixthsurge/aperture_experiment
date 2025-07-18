#version 430

layout (local_size_x = WORK_GROUP_SIZE, local_size_y = 1, local_size_z = 1) in;

#define FILTER_RADIUS 4
#define SHARED_SIZE (WORK_GROUP_SIZE + 2 * FILTER_RADIUS)

shared vec3 preloaded[SHARED_SIZE];

layout (r11f_g11f_b10f) uniform writeonly image2D DST_IMG;

uniform sampler2D SRC_TEX;

const float binomial_weights_9[] = float[](0.2734375, 0.21875, 0.109375, 0.03125, 0.00390625);

void preload() {
    ivec2 tex_size = ivec2(textureSize(SRC_TEX, SRC_LOD));
    int group_base = int(gl_WorkGroupID.x) * WORK_GROUP_SIZE - FILTER_RADIUS;

    // Load area of SHARED_SIZE into `preloaded`
    for (uint i = gl_LocalInvocationIndex; i < SHARED_SIZE; i += WORK_GROUP_SIZE) {
        ivec2 texel = clamp(
            ivec2(
                group_base + i,
                gl_GlobalInvocationID.y
            ),
            ivec2(0),
            tex_size
        );

        // Preload
        preloaded[i] = texelFetch(SRC_TEX, texel, SRC_LOD).rgb;
    }
}

void main() {
    preload();
    barrier();

    ivec2 texel = ivec2(gl_GlobalInvocationID.xy);
    ivec2 tex_size = ivec2(textureSize(SRC_TEX, SRC_LOD));

    vec3 color_sum = vec3(0.0);
    float weight_sum = 0.0;

    for (int i = -FILTER_RADIUS; i <= FILTER_RADIUS; i++) {
        ivec2 sample_pos = texel + ivec2(i, 0);

        bool in_bounds = texel == clamp(
            texel,
            ivec2(0),
            tex_size
        );

        float weight = binomial_weights_9[abs(i)] * float(in_bounds);

        color_sum += preloaded[gl_LocalInvocationIndex + FILTER_RADIUS + i] * weight;
        weight_sum += weight;
    }

    imageStore(DST_IMG, texel, vec4(color_sum / weight_sum, 1.0));
}
