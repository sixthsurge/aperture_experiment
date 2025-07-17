#version 430

#ifdef BLUR_VERTICAL
   #define OFFSET(i) ivec2(0, i)
#else
   #define OFFSET(i) ivec2(i, 0)
#endif

layout (location = 0) out vec3 bloom_tiles_out;

uniform sampler2D SRC_TEX;

const float[5] binomial_weights_9 = float[5](
   0.2734375,
   0.21875,
   0.109375,
   0.03125,
   0.00390625
);

void main() {
   ivec2 texel = ivec2(gl_FragCoord.xy);

   bloom_tiles_out  = texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET(-4)).rgb * binomial_weights_9[4];
   bloom_tiles_out += texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET(-3)).rgb * binomial_weights_9[3];
   bloom_tiles_out += texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET(-2)).rgb * binomial_weights_9[2];
   bloom_tiles_out += texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET(-1)).rgb * binomial_weights_9[1];
   bloom_tiles_out += texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET( 0)).rgb * binomial_weights_9[0];
   bloom_tiles_out += texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET( 1)).rgb * binomial_weights_9[1];
   bloom_tiles_out += texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET( 2)).rgb * binomial_weights_9[2];
   bloom_tiles_out += texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET( 3)).rgb * binomial_weights_9[3];
   bloom_tiles_out += texelFetchOffset(SRC_TEX, texel, SRC_LOD, OFFSET( 4)).rgb * binomial_weights_9[4];
}
