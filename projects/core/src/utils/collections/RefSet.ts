namespace Aurora {
    export class RefSet<I extends IRef> extends Ref {
        private _raw = new Set<I>();

        public get raw(): Set<I> {
            return this._raw;
        }

        public get size(): uint {
            return this._raw.size;
        }

        public has(key: I): boolean {
            return this._raw.has(key);
        }

        public insert(value: I): void {
            if (!this._raw.has(value)) {
                if (value) value.retain();
                this._raw.add(value);
            }
        }

        public erase(value: I): boolean {
            const rst = this._raw.delete(value);
            if (rst && value) value.release(); 
            return rst;
        }

        public clone(): RefSet<I> {
            let set = new RefSet<I>();
            const raw = set._raw;
            for (let i of this._raw) {
                if (i) i.retain();
                raw.add(i);
            }
            return set;
        }

        public clear(): void {
            for (const i of this._raw) {
                if (i) i.release();
            }
            this._raw.clear();
        }

        protected _refDestroy(): void {
            this.clear();
            this._raw = null;
        }
    }
}