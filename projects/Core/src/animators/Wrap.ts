namespace Aurora.AnimatorWrap {
    export const Clamp: AnimatorWrapType = (elapsed: number, duration: number) => {
        return elapsed < 0 ? 0 : (elapsed > duration ? duration : elapsed);
    }

    export const Loop: AnimatorWrapType = (elapsed: number, duration: number) => {
        if (duration === 0) {
            return 0;
        } else {
            const e = elapsed % duration;
            return e < 0 ? duration + e : e;
        }
    }

    export const Pingpong: AnimatorWrapType = (elapsed: number, duration: number) => {
        const d = duration * 2;
        const e = Loop(elapsed, d);
        return e < duration ? e : d - e;
    }
}