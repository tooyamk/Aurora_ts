namespace MITOIA.Sort {
    export abstract class Merge {
        /**
         * @param compareFn : If return true, a is before to b.
         */
        public static sort<T>(L: T[], compareFn: (a: T, b: T) => boolean, start: number = 0, end: number = -1) {
            if (end < 0 || end >= L.length) end = L.length - 1;
            if (start < 0) start = 0;

            if (start < end) {
                let TR: T[] = [];
                let k = start + 1;
                while (k < end) {
                    Merge.mergePass<T>(L, TR, k, L.length, compareFn);
                    k = 2 * k;
                    Merge.mergePass<T>(TR, L, k, L.length, compareFn);
                    k = 2 * k;
                }
            }
        }

        private static mergePass<T>(SR: T[], TR: T[], s: number, n: number, compareFn: (a: T, b: T) => boolean) {
            let i = 0, j, s2 = s << 1, s_1 = s - 1;
            let nn = n - s2, s2_1 = s2 - 1;
            while (i <= nn) {
                Merge.merge<T>(SR, TR, i, i + s_1, i + s2_1, compareFn);
                i += s2;
            }
            if (i < n - s + 1) {
                Merge.merge<T>(SR, TR, i, i + s_1, n - 1, compareFn);
            }
            else {
                for (j = i; j < n; ++j)
                    TR[j] = SR[j];
            }
        }

        private static merge<T>(SR: T[], TR: T[], i: number, m: number, n: number, compareFn: (a: T, b: T) => boolean) {
            let j, k;
            for (j = m + 1, k = i; i <= m && j <= n; ++k) {
                //if (SR[i] < SR[j])
                if (compareFn(SR[i], SR[j]))
                    TR[k] = SR[i++];
                else
                    TR[k] = SR[j++];
            }
            while (i <= m) {
                TR[k++] = SR[i++];
            }
            while (j <= n) {
                TR[k++] = SR[j++];
            }
        }
    }
}