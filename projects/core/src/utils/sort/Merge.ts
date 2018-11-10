namespace Aurora.Sort.Merge {
    /**
     * @param compareFn : If return true, a is before to b.
     */
    export const sort = <T>(L: T[], compareFn: (a: T, b: T) => boolean, start: int = 0, end: int = -1) => {
        if (end < 0 || end >= L.length) end = L.length - 1;
        if (start < 0) start = 0;

        if (start < end) {
            let k = 1, len = end - start + 1;
            const TR: T[] = [];
            TR.length = len;

            if (start === 0) {
                while (k < end) {
                    _mergePass<T>(L, TR, k, len, compareFn);
                    k <<= 1;
                    _mergePass<T>(TR, L, k, len, compareFn);
                    k <<= 1;
                }
            } else {
                while (k < end) {
                    _mergePassOffset<T>(L, start, TR, 0, k, len, compareFn);
                    k <<= 1;
                    _mergePassOffset<T>(TR, 0, L, start, k, len, compareFn);
                    k <<= 1;
                }
            }
        }
    }

    const _mergePass = <T>(SR: T[], TR: T[], s: int, n: int, compareFn: (a: T, b: T) => boolean) => {
        let i = 0;
        const s2 = s << 1, s_1 = s - 1;
        const nn = n - s2, s2_1 = s2 - 1;
        while (i <= nn) {
            _merge<T>(SR, TR, i, i + s_1, i + s2_1, compareFn);
            i += s2;
        }
        if (i < n - s + 1) {
            _merge<T>(SR, TR, i, i + s_1, n - 1, compareFn);
        } else {
            for (let j = i; j < n; ++j) TR[j] = SR[j];
        }
    }

    const _mergePassOffset = <T>(SR: T[], SROffset: int, TR: T[], TROffset: int, s: int, n: int, compareFn: (a: T, b: T) => boolean) => {
        let i = 0;
        const s2 = s << 1, s_1 = s - 1;
        const nn = n - s2, s2_1 = s2 - 1;
        while (i <= nn) {
            _merge<T>(SR, TR, i, i + s_1, i + s2_1, compareFn);
            i += s2;
        }
        if (i < n - s + 1) {
            _merge<T>(SR, TR, i, i + s_1, n - 1, compareFn);
        } else {
            for (let j = i; j < n; ++j) TR[j + TROffset] = SR[j + SROffset];
        }
    }

    const _merge = <T>(SR: T[], TR: T[], i: int, m: int, n: int, compareFn: (a: T, b: T) => boolean) => {
        let j: int, k: int;
        for (j = m + 1, k = i; i <= m && j <= n; ++k) {
            //if (SR[i] < SR[j])
            if (compareFn(SR[i], SR[j])) {
                TR[k] = SR[i++];
            } else {
                TR[k] = SR[j++];
            }
        }
        while (i <= m) TR[k++] = SR[i++];
        while (j <= n) TR[k++] = SR[j++];
    }
}