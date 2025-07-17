import type {} from './iris'

export function setupOptions() {
    return new Page("main")
        .add(asBool("normalMapEnabled", false, true))
        .add(asBool("specularMapEnabled", false, true))
        .add(
            new Page("pointShadow")
                .add(
                    asBool("pointShadowEnabled", false, true)
                )
                .add(
                    asInt("pointShadowMaxCount", ...range(0, 256, 1))
                        .needsReload(true)
                        .build(64)
                )
                .add(
                    asInt("pointShadowResolution", ...range(256, 2048, 256))
                        .needsReload(true)
                        .build(256)
                )
                .build()
        )
        .add(
            new Page("bloom")
                .add(asBool("bloomEnabled", true, false))
                .add(
                    asInt("bloomTileCount", ...range(1, 12, 1))
                        .needsReload(true)
                        .build(7)
                )
                .build()
        )
        .add(new Page("exposure")
            .add(
                asBool("autoExposureEnabled", true, false)
            )
            .add(
                asFloat("manualExposureValue", ...range(0.0, 1024.0, 1.0))
                    .needsReload(false)
                    .build(8.0)
            )
            .build()
        )
        .build();
}

function range(min: number, max: number, step: number): number[] {
    let values: number[] = []

    for (let x = min; x <= max; x += step) values.push(x); 

    return values;
}
