#version 430

#ifdef BLUR_VERTICAL
#define OFFSET(i) ivec2(0, i)
#else
#define OFFSET(i) ivec2(i, 0)
#endif

layout(location = 0) out vec3 bloom_tiles_out;

in vec2 uv;

uniform sampler2D SRC_TEX;

const float[5] binomial_weights_9 = float[5](0.2734375, 0.21875, 0.109375, 0.03125, 0.00390625);

void main() {
    ivec2 texel = ivec2(gl_FragCoord.xy);
    ivec2 tex_size = ivec2(textureSize(SRC_TEX, SRC_LOD));

    // Perform samples all together
    vec3 samples[] = vec3[](
        texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET(-4)).rgb,
        texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET(-3)).rgb,
        texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET(-2)).rgb,
        texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET(-1)).rgb,
        texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET( 0)).rgb,
        texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET( 1)).rgb,
        texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET( 2)).rgb,
        texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET( 3)).rgb,
        texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET( 4)).rgb
    );

    // Calculate 1D convolution
    vec3 color_sum = vec3(0.0);
    float weight_sum = 0.0;

    for (int i = -4; i <= 4; i++) {
        ivec2 sample_pos = texel + OFFSET(i);

        if (clamp(sample_pos, ivec2(0), tex_size) == sample_pos) {
            float w = binomial_weights_9[abs(i)];
            color_sum += samples[i + 4] * w;
            weight_sum += w;
        }
    }

    bloom_tiles_out = color_sum / weight_sum;
}
