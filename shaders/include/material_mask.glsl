#if !defined INCLUDE_MATERIAL_MASK
#define INCLUDE_MATERIAL_MASK

// 8 bit material mask
// Bits 0-4 | Emission

uint create_material_mask(uint block) {
	return iris_getEmission(block);
}

uint material_mask_emission(uint material_mask) {
	return material_mask & 0xff;
}

#endif // INCLUDE_MATERIAL_MASK
