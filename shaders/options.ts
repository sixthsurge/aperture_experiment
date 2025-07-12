import type {} from './iris'

export function setupOptions() {
    return new Page("main")
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
