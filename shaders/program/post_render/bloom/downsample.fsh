#version 430

noperspective in vec2 uv;

layout (location = 0) out vec3 bloom_tiles_out;

uniform sampler2D SRC_TEX;

#include "/include/prelude.glsl"

void main() {
	vec2 src_pixel_size = rcp(textureSize(SRC_TEX, SRC_LOD));

	// 6x6 downsampling filter made from overlapping 4x4 box kernels
	// As described in "Next Generation Post-Processing in Call of Duty Advanced Warfare"
	bloom_tiles_out  = textureLod(SRC_TEX, uv + vec2( 0.0,  0.0) * src_pixel_size, SRC_LOD).rgb * 0.125;

	bloom_tiles_out += textureLod(SRC_TEX, uv + vec2( 1.0,  1.0) * src_pixel_size, SRC_LOD).rgb * 0.125;
	bloom_tiles_out += textureLod(SRC_TEX, uv + vec2(-1.0,  1.0) * src_pixel_size, SRC_LOD).rgb * 0.125;
	bloom_tiles_out += textureLod(SRC_TEX, uv + vec2( 1.0, -1.0) * src_pixel_size, SRC_LOD).rgb * 0.125;
	bloom_tiles_out += textureLod(SRC_TEX, uv + vec2(-1.0, -1.0) * src_pixel_size, SRC_LOD).rgb * 0.125;

	bloom_tiles_out += textureLod(SRC_TEX, uv + vec2( 2.0,  0.0) * src_pixel_size, SRC_LOD).rgb * 0.0625;
	bloom_tiles_out += textureLod(SRC_TEX, uv + vec2(-2.0,  0.0) * src_pixel_size, SRC_LOD).rgb * 0.0625;
	bloom_tiles_out += textureLod(SRC_TEX, uv + vec2( 0.0,  2.0) * src_pixel_size, SRC_LOD).rgb * 0.0625;
	bloom_tiles_out += textureLod(SRC_TEX, uv + vec2( 0.0, -2.0) * src_pixel_size, SRC_LOD).rgb * 0.0625;

	bloom_tiles_out += textureLod(SRC_TEX, uv + vec2( 2.0,  2.0) * src_pixel_size, SRC_LOD).rgb * 0.03125;
	bloom_tiles_out += textureLod(SRC_TEX, uv + vec2(-2.0,  2.0) * src_pixel_size, SRC_LOD).rgb * 0.03125;
	bloom_tiles_out += textureLod(SRC_TEX, uv + vec2( 2.0, -2.0) * src_pixel_size, SRC_LOD).rgb * 0.03125;
	bloom_tiles_out += textureLod(SRC_TEX, uv + vec2(-2.0, -2.0) * src_pixel_size, SRC_LOD).rgb * 0.03125;
}
