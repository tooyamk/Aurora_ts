namespace MITOIA {
    export abstract class AbstractComponent {
        protected _owner: Node = null;
        protected _enabled: boolean = true;

        constructor() {
        }

        public get owner(): Node {
            return this._owner;
        }

        public _setOwner(owner: Node): void {
            let old = this._owner;
            this._owner = owner;

            this._ownerChanged(old);
        }

        public get enabled(): boolean {
            return this._enabled;
        }
        
        public set enabled(b: boolean) {
            if (this._enabled !== b) {
                this._enabled = b;

                this._enabledChanged();
            }
        }

        protected _ownerChanged(old: Node): void {
            //todo
        }

        protected _enabledChanged(): void {
            //todo
        }
    }
}