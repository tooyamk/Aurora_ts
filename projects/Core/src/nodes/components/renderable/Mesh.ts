///<reference path="AbstractRenderable.ts"/>

namespace Aurora {
    export class Mesh extends AbstractRenderable {
        protected _asset: MeshAsset = null;

        public get asset(): MeshAsset {
            return this._asset;
        }

        public set asset(value: MeshAsset) {
            if (this._asset !== value) {
                if (value) value.retain();
                if (this._asset) this._asset.release();
                this._asset = value;

                this._changedAsset();
            }
        }

        protected _changedAsset(): void {}

        public checkRenderable(): boolean {
            return !!this._asset;
        }

        public render(renderingData: RenderingData): void {
            renderingData.out.asset = this._asset;
        }

        public destroy(): void {
            this.asset = null;
            
            super.destroy();
        }
    }
}