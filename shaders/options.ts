import type {} from './iris'

export function setupOptions() {
    return new Page("main")
        .add(
            new Page("point_shadow")
                .add(
                    asBool("POINT_SHADOW", false, true)
                )
                .add(
                    asInt("POINT_SHADOW_MAX_COUNT", ...range(0, 256, 1))
                        .needsReload(true)
                        .build(64)
                )
                .add(
                    asInt("POINT_SHADOW_RESOLUTION", ...range(256, 2048, 256))
                        .needsReload(true)
                        .build(256)
                )
                .build()
        )
        .add(
            asFloat("EXPOSURE", ...range(0.0, 1024.0, 1.0))
                .needsReload(false)
                .build(8.0)
        )
        .build();
}

function range(min: number, max: number, step: number): number[] {
    let values: number[] = []

    for (let x = min; x <= max; x += step) values.push(x); 

    return values;
}
