namespace Aurora {
    export class RefMap<K, V extends IRef> extends Ref {
        private _map = new Map<K, V>();

        public get raw(): Map<K, V> {
            return this._map;
        }

        public get size(): uint {
            return this._map.size;
        }

        public find(key: K): V {
            return this._map.get(key);
        }

        public insert(key: K, value: V): void {
            const old = this._map.get(key);
            if (old !== value) {
                if (value) value.retain();
                if (old) old.release();
                this._map.set(key, value);
            }
        }

        public erase(key: K): boolean {
            const old = this._map.get(key);
            if (old) old.release();
            return this._map.delete(key);
        }

        public clear(): void {
            for (const itr of this._map) {
                const value = itr[1];
                if (value) value.release();
            }
            this._map.clear();
        }

        protected _refDestroy() {
            this.clear();
            this._map = null;
        }
    }
}