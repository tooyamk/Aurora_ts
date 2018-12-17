namespace Aurora {
    export class RefVector<I extends IRef> extends Ref {
        private _raw: I[] = [];

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
                        this._raw[i] = v;
                    }
                } else {
                    for (let i = 0, n = args.length; i < n; ++i) {
                        const v = args[i];
                        if (v) v.retain();
                        this._raw[i] = v;
                    }
                }
            }
        }

        public get raw(): I[] {
            return this._raw;
        }

        public get size(): uint {
            return this._raw.length;
        }

        public pushBackOne(item: I): void {
            if (item) item.retain();
            this._raw[this._raw.length] = item;
        }

        public pushBack(...items: I[]): void {
            for (let i = 0, n = items.length; i < n; ++i) {
                const v = items[i];
                if (v) v.retain();
            }
            this._raw.push(...items);
        }

        public popBack(): I {
            let len = this._raw.length;
            if (len > 0) {
                const v = this._raw[--len];
                if (v) v.release();
                return v;
            } else {
                return null;
            }
        } 

        public at(idx: uint): I {
            return this._raw[idx];
        }

        public set(idx: uint, value: I): void {
            const old = this._raw[idx];
            if (old !== value) {
                if (value) value.retain();
                if (old) old.release();
                this._raw[idx] = value;
            }
        }

        public insert(idx: uint, ...items: any[]): void {
            for (let i = 0, n = items.length; i < n; ++i) {
                const v = items[i];
                if (v) v.retain();
            }
            this._raw.splice(idx, 0, ...items);
        }

        public erase(idx: uint, length: int = 1): void {
            const len = this._raw.length;
            if (idx < len) {
                if (length !== 1) {
                    const end = length < 0 ? len : idx + length;

                    if (end >= len) {
                        for (let i = idx; i < len; ++i) {
                            const v = this._raw[i];
                            if (v) v.release();
                        }
                        this._raw.length = idx;
                    } else {
                        for (let i = idx; i < end; ++i) {
                            const v = this._raw[i];
                            if (v) v.release();
                        }
                        this._raw.splice(idx, end - idx);
                    }
                } else {
                    const v = this._raw[idx];
                    if (v) v.release();

                    if (idx + 1 === len) {
                        this._raw.length = idx;
                    } else {
                        this._raw.splice(idx, 1);
                    }
                }
            }
        }

        public clone(): RefVector<I> {
            const src = this._raw;
            const len = src.length;

            let vec = new RefVector<I>();
            const raw = vec._raw;
            raw.length = len;
            for (let i = 0, n = src.length; i < n; ++i) {
                const v = src[i];
                if (v) v.retain();
                raw[i] = v;
            }
            
            return vec;
        }

        public clear(): void {
            const len = this._raw.length;
            if (len > 0) {
                for (let i = 0; i < len; ++i) {
                    const v = this._raw[i];
                    if (v) v.release();
                }
                this._raw.length = 0;
            }
        }

        protected _refDestroy() {
            this.clear();
            this._raw = null;
        }
    }
}