#if !defined INCLUDE_MISC_MATERIAL
#define INCLUDE_MISC_MATERIAL

#include "/include/utility/color.glsl"

const float air_n   = 1.000293; // for 0°C and 1 atm
const float water_n = 1.333;    // for 20°C

struct Material {
	vec3 albedo;
	vec3 emission;
	vec3 f0;
	vec3 f82; // hardcoded metals only
	float roughness;
	float sss_amount;
	float sheen_amount; // SSS "sheen" for tall grass
	float porosity;
	bool is_metal;
	bool is_hardcoded_metal;
};

const Material water_material = Material(vec3(0.0), vec3(0.0), vec3(0.02), vec3(0.0), 0.002, 1.0, 0.0, 0.0, false, false);

#if TEXTURE_FORMAT == TEXTURE_FORMAT_LAB
void decode_specular_map(vec4 specular_map, inout Material material) {
	// f0 and f82 values for hardcoded metals from Jessie LC (https://github.com/Jessie-LC)
	const vec3[] metal_f0 = vec3[](
		vec3(0.78, 0.77, 0.74), // Iron
		vec3(1.00, 0.90, 0.61), // Gold
		vec3(1.00, 0.98, 1.00), // Aluminum
		vec3(0.77, 0.80, 0.79), // Chrome
		vec3(1.00, 0.89, 0.73), // Copper
		vec3(0.79, 0.87, 0.85), // Lead
		vec3(0.92, 0.90, 0.83), // Platinum
		vec3(1.00, 1.00, 0.91)  // Silver
	);
	const vec3[] metal_f82 = vec3[](
		vec3(0.74, 0.76, 0.76),
		vec3(1.00, 0.93, 0.73),
		vec3(0.96, 0.97, 0.98),
		vec3(0.74, 0.79, 0.78),
		vec3(1.00, 0.90, 0.80),
		vec3(0.83, 0.80, 0.83),
		vec3(0.89, 0.87, 0.81),
		vec3(1.00, 1.00, 0.95)
	);

	material.roughness = sqr(1.0 - specular_map.r);
	material.emission = max(material.emission, material.albedo * specular_map.a * float(specular_map.a != 1.0));

	if (specular_map.g < 229.5 / 255.0) {
		// Dielectrics
		material.f0 = max(material.f0, specular_map.g);

		float has_sss = step(64.5 / 255.0, specular_map.b);
		material.sss_amount = max(material.sss_amount, linear_step(64.0 / 255.0, 1.0, specular_map.b * has_sss));
		material.porosity = linear_step(0.0, 64.0 / 255.0, max0(specular_map.b - specular_map.b * has_sss));
	} else if (specular_map.g < 237.5 / 255.0) {
		// Hardcoded metals
		uint metal_id = clamp(uint(255.0 * specular_map.g) - 230u, 0u, 7u);

		material.f0 = metal_f0[metal_id];
		material.f82 = metal_f82[metal_id];
		material.is_metal = true;
		material.is_hardcoded_metal = true;
	} else {
		// Albedo metal
		material.f0 = material.albedo;
		material.is_metal = true;
	}
}
#elif TEXTURE_FORMAT == TEXTURE_FORMAT_OLD
void decode_specular_map(vec4 specular_map, inout Material material) {
	material.roughness = sqr(1.0 - specular_map.r);
	material.is_metal  = specular_map.g > 0.5;
	material.f0        = material.is_metal ? material.albedo : material.f0;
	material.emission  = max(material.emission, material.albedo * specular_map.b);
}
#endif

void decode_specular_map(vec4 specular_map, inout Material material, out bool parallax_shadow) {
#if defined POM && defined POM_SHADOW
		// Specular map alpha >= 0.5 => parallax shadow
		parallax_shadow = specular_map.a >= 0.5;
		specular_map.a = fract(specular_map.a * 2.0);
#endif

		decode_specular_map(specular_map, material);
}

Material material_from(vec3 albedo_srgb) {
	// Create material with default values

	Material material;
	material.albedo             = srgb_eotf_inv(albedo_srgb) * rec709_to_rec2020;
	material.emission           = vec3(0.0);
	material.f0                 = vec3(0.02);
	material.f82                = vec3(0.0);
	material.roughness          = 1.0;
	material.sss_amount         = 0.0;
	material.sheen_amount       = 0.0;
	material.porosity           = 0.0;
	material.is_metal           = false;
	material.is_hardcoded_metal = false;

	return material;
}

#endif // INCLUDE_MISC_MATERIAL
