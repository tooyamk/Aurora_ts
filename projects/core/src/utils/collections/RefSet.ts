namespace Aurora {
    export class RefSet<I extends IRef> extends Ref {
        private _set = new Set<I>();

        public get raw(): Set<I> {
            return this._set;
        }

        public get size(): uint {
            return this._set.size;
        }

        public insert(value: I): void {
            if (!this._set.has(value)) {
                if (value) value.retain();
                this._set.add(value);
            }
        }

        public erase(value: I): boolean {
            const rst = this._set.delete(value);
            if (rst && value) value.release(); 
            return rst;
        }

        public clear(): void {
            for (const i of this._set) {
                if (i) i.release();
            }
            this._set.clear();
        }

        protected _refDestroy(): void {
            this.clear();
            this._set = null;
        }
    }
}