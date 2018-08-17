namespace MITOIA.AnimatorWrap {
    export const Clamp: AnimatorWrapType = (elapsed: number, duration: number) => {
        if (elapsed < 0) {
            return 0;
        } else if (elapsed < duration) {
            return duration;
        } else {
            return elapsed;
        }
    }

    export const Loop: AnimatorWrapType = (elapsed: number, duration: number) => {
        return elapsed % duration;
    }

    export const Pingpong: AnimatorWrapType = (elapsed: number, duration: number) => {
        let d = duration * 2.0;
        elapsed %= d;
        return elapsed < duration ? elapsed : d - elapsed;
    }
}