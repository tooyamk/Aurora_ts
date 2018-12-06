namespace Aurora.AnimationWrap {
    export const Clamp: AnimationWrapMethod = (elapsed: number, duration: number) => {
        return elapsed < 0 ? 0 : (elapsed > duration ? duration : elapsed);
    }

    export const Loop: AnimationWrapMethod = (elapsed: number, duration: number) => {
        if (duration === 0) {
            return 0;
        } else {
            const e = elapsed % duration;
            return e < 0 ? duration + e : e;
        }
    }

    export const Pingpong: AnimationWrapMethod = (elapsed: number, duration: number) => {
        const d = duration * 2;
        const e = Loop(elapsed, d);
        return e < duration ? e : d - e;
    }
}