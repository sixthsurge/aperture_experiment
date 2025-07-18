#version 430
#include "/include/prelude.glsl"
#include "/include/buffer/sky_sh.glsl"

layout (local_size_x = 256) in;

shared vec3 shared_memory[256][9];

layout (std140, binding = 0) buffer SkyShBuffer {
	SkySh sky_sh;
};

uniform sampler2D sky_view_tex;

#include "/include/sky/projection.glsl"
#include "/include/utility/random.glsl"
#include "/include/utility/sampling.glsl"
#include "/include/utility/spherical_harmonics.glsl"

void main() {
	const uint sample_count = 256;
	uint i = uint(gl_LocalInvocationIndex);

	// Calculate SH coefficients for each sample

	vec3 direction = uniform_hemisphere_sample(vec3(0.0, 1.0, 0.0), r2(int(i)));
	vec3 radiance  = texture(sky_view_tex, project_sky(direction)).rgb;
	float[9] coeff = sh_coeff_order_2(direction);

	for (uint band = 0u; band < 9u; ++band) {
		shared_memory[i][band] = radiance * coeff[band] * (tau / float(sample_count));
	}
	
	barrier();

	// Sum samples using parallel reduction

	for (uint stride = sample_count / 2u; stride > 0u; stride /= 2u) {
		if (i >= stride) {
			return;
		}

		for (uint band = 0u; band < 9u; ++band) {
			shared_memory[i][band] += shared_memory[i + stride][band];
		}

		barrier();
	}

	// Save SH coeff in SH skylight buffer

	for (uint band = 0u; band < 9u; ++band) {
		sky_sh.coeff[band] = shared_memory[0][band];
	}

	// Store irradiance facing up for forward lighting 
	sky_sh.irradiance_up = shared_memory[0][0];
}
