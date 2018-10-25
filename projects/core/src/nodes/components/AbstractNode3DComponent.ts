namespace Aurora {
    export abstract class AbstractNode3DComponent {
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

        public destroy(): void {
            if (this._node) {
                this._node.removeComponent(this);
            }
        }

        protected _nodeChanged(old: Node3D): void {
            //override
        }

        protected _enabledChanged(): void {
            //override
        }
    }
}