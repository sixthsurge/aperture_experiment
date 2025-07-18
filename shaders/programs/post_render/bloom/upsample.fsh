#version 430

in vec2 uv;

layout(location = 0) out vec3 bloom_tiles_out;

uniform sampler2D SRC_TEX;

#include "/include/prelude.glsl"
#include "/include/utility/bicubic.glsl"

void main() {
    bloom_tiles_out = texelFetch(SRC_TEX, ivec2(gl_FragCoord.xy), DST_LOD).rgb;
    bloom_tiles_out += bicubic_filter_lod(SRC_TEX, uv, SRC_LOD).rgb;
}

