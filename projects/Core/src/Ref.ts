namespace Aurora {
    export interface IRef {
        getRefCount(): int;
        isDestroyed(): boolean;
        retain(): void;
        release(): void;
    }

    export abstract class Ref implements IRef {
        protected _refCount: int = 0;
        protected _refDestroyed = false;

        public getRefCount(): int {
            return this._refCount;
        }

        public isDestroyed(): boolean {
            return this._refDestroyed;
        }

        public retain(): void {
            ++this._refCount;
        }

        public release(): void {
            if (this._refCount > 0) --this._refCount;
            if (this._refCount <= 0 && !this._refDestroyed) {
                this._refDestroyed = true;
                this._refDestroy();
            }
        }

        protected abstract _refDestroy(): void;
    }

    export class RefPtr<T extends IRef> {
        protected _value: T = null;

        public get value(): T {
            return this._value;
        }

        public set value(v: T) {
            if (this._value !== v) {
                if (v) v.retain();
                if (this._value) this._value.release();
                this._value = v;
            }
        }
    }
}