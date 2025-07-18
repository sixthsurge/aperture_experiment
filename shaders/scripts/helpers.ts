import type {} from "./iris";

export class Flipper<T> {
    a: T;
    b: T;
    flipped: boolean;

    constructor(a: T, b: T) {
        this.a = a;
        this.b = b;
        this.flipped = false;
    }

    flip() {
        this.flipped = !this.flipped;
    }

    front() {
        return this.flipped ? this.b : this.a;
    }

    back() {
        return this.flipped ? this.a : this.b;
    }
}

export function defineGloballyIf(key: string, value: string | number, condition: boolean) {
    if (condition) {
        defineGlobally(key, value);
    }
}
