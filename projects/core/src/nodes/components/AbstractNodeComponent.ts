namespace Aurora {
    export abstract class AbstractNodeComponent {
        protected _node: Node3D = null;
        protected _enabled: boolean = true;

        public get node(): Node3D {
            return this._node;
        }

        public _setNode(node: Node3D): void {
            let old = this._node;
            this._node = node;

            this._nodeChanged(old);
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

        protected _nodeChanged(old: Node3D): void {
            //todo
        }

        protected _enabledChanged(): void {
            //todo
        }
    }
}