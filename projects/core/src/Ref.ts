namespace Aurora {
    export abstract class Ref {
        protected _refCount: int = 0;
        protected _refDestroyed = false;

        public retain(): void {
            ++this._refCount;
        }

        public release(): void {
            if (--this._refCount <= 0 && !this._refDestroyed) {
                this._refDestroyed = true;
                this._refDestroy();
            }
        }

        protected abstract _refDestroy(): void;
    }
}