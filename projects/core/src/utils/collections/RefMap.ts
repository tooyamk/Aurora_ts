namespace Aurora {
    export class RefMap<K, V extends IRef> extends Ref {
        private _raw = new Map<K, V>();

        public get raw(): Map<K, V> {
            return this._raw;
        }

        public get size(): uint {
            return this._raw.size;
        }

        public has(key: K): boolean {
            return this._raw.has(key);
        }

        public find(key: K): V {
            return this._raw.get(key);
        }

        public insert(key: K, value: V): void {
            const old = this._raw.get(key);
            if (old !== value) {
                if (value) value.retain();
                if (old) old.release();
                this._raw.set(key, value);
            }
        }

        public erase(key: K): boolean {
            const old = this._raw.get(key);
            if (old) old.release();
            return this._raw.delete(key);
        }

        public clone(): RefMap<K, V> {
            let map = new RefMap<K, V>();
            const raw = map._raw;
            for (let itr of this._raw) {
                const v = itr[1];
                if (v) v.retain();
                raw.set(itr[0], v);
            }
            return map;
        }

        public clear(): void {
            for (const itr of this._raw) {
                const value = itr[1];
                if (value) value.release();
            }
            this._raw.clear();
        }

        protected _refDestroy() {
            this.clear();
            this._raw = null;
        }
    }
}