#define get_exposure_from_ev_100(ev100) exp2(-(ev100))
#define get_exposure_from_luminance(l) (calibration / (l))
#define get_luminance_from_exposure(e) (calibration / (e))

// controls
const float min_luminance = 0.001;
const float max_luminance = 10.0;
const float bias = 3.0;

const float K = 12.5; // Light-meter calibration constant
const float sensitivity = 100.0; // ISO
const float calibration = exp2(bias) * K / sensitivity / 1.2;

const float min_log_luminance = log2(min_luminance);
const float max_log_luminance = log2(max_luminance);

float get_bin_from_luminance(float luminance) {
    const float bin_count = HISTOGRAM_BINS;
    const float rcp_log_luminance_range = 1.0 / (max_log_luminance - min_log_luminance);
    const float scaled_min_log_luminance = min_log_luminance * rcp_log_luminance_range;

    if (luminance <= min_luminance) return 0.0; // Avoid taking log of 0

    float log_luminance = clamp01(
        log2(luminance) * rcp_log_luminance_range - scaled_min_log_luminance
    );

    return min(bin_count * log_luminance, bin_count - 1.0);
}

float get_luminance_from_bin(int bin) {
    const float log_luminance_range = max_log_luminance - min_log_luminance;

    float log_luminance = bin * rcp(float(HISTOGRAM_BINS));

    return exp2(log_luminance * log_luminance_range + min_log_luminance);
}

