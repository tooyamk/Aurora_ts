namespace Aurora {
    export class RefVector<I extends IRef> extends Ref {
        private _arr: I[] = [];

        constructor();
        constructor(...items: I[]);
        constructor(array: I[]);

        constructor(...args: any[]) {
            super();

            if (args.length > 0) {
                const arg0 = args[0];
                if (arg0 instanceof Array) {
                    for (let i = 0, n = arg0.length; i < n; ++i) {
                        const v = arg0[i];
                        if (v) v.retain();
                        this._arr[i] = v;
                    }
                } else {
                    for (let i = 0, n = args.length; i < n; ++i) {
                        const v = args[i];
                        if (v) v.retain();
                        this._arr[i] = v;
                    }
                }
            }
        }

        public get raw(): I[] {
            return this._arr;
        }

        public get size(): uint {
            return this._arr.length;
        }

        public pushBack(...items: I[]): void {
            for (let i = 0, n = items.length; i < n; ++i) {
                const v = items[i];
                if (v) v.retain();
            }
            this._arr.push(...items);
        }

        public popBack(): I {
            let len = this._arr.length;
            if (len > 0) {
                const v = this._arr[--len];
                if (v) v.release();
                return v;
            } else {
                return null;
            }
        } 

        public at(idx: uint): I {
            return this._arr[idx];
        }

        public set(idx: uint, value: I): void {
            const old = this._arr[idx];
            if (old !== value) {
                if (value) value.retain();
                if (old) old.release();
                this._arr[idx] = value;
            }
        }

        public insert(idx: uint, ...items: any[]): void {
            for (let i = 0, n = items.length; i < n; ++i) {
                const v = items[i];
                if (v) v.retain();
            }
            this._arr.splice(idx, 0, ...items);
        }

        public erase(idx: uint, length: int = 1): void {
            const len = this._arr.length;
            if (idx < len) {
                if (length !== 1) {
                    const end = length < 0 ? len : idx + length;

                    if (end >= len) {
                        for (let i = idx; i < len; ++i) {
                            const v = this._arr[i];
                            if (v) v.release();
                        }
                        this._arr.length = idx;
                    } else {
                        for (let i = idx; i < end; ++i) {
                            const v = this._arr[i];
                            if (v) v.release();
                        }
                        this._arr.splice(idx, end - idx);
                    }
                } else {
                    const v = this._arr[idx];
                    if (v) v.release();

                    if (idx + 1 === len) {
                        this._arr.length = idx;
                    } else {
                        this._arr.splice(idx, 1);
                    }
                }
            }
        }

        public clear(): void {
            const len = this._arr.length;
            if (len > 0) {
                for (let i = 0; i < len; ++i) {
                    const v = this._arr[i];
                    if (v) v.release();
                }
                this._arr.length = 0;
            }
        }

        protected _refDestroy() {
            this.clear();
            this._arr = null;
        }
    }
}