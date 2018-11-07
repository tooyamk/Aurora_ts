namespace Aurora {
    export class RefMap<K, V extends Ref> extends Map<K, V> {
        public set(key: K, value: V): this {
            const old = this.get(key);
            if (old !== value) {
                if (value) value.retain();
                if (old) old.release();
                super.set(key, value);
            }

            return this;
        }

        public delete(key: K): boolean {
            const old = this.get(key);
            if (old) old.release();
            return super.delete(key);
        }

        public clear(): void {
            for (const itr of this) {
                const value = itr[1];
                if (value) value.release();
            }
            super.clear();
        }
    }
}