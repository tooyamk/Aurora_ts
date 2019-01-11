///<reference path="AbstractRenderable.ts"/>

namespace Aurora {
    export class Mesh extends AbstractRenderable {
        protected _asset: MeshAsset = null;
        protected _renderFn: (renderingData: RenderingData) => void;

        constructor() {
            super();

            this._renderFn = this._renderHandler.bind(this);
        }

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

        public collect(material: Material, alternativeMaterials: Material, appendFn: AppendRenderingObjectFn): void {
            appendFn(this, material, alternativeMaterials ? alternativeMaterials.uniforms : null, this._getRenderingPriorityLv2(material), this._renderFn);
        }

        protected _getRenderingPriorityLv2(material: Material): number {
            const low = this._asset ? this._asset.id : 0;
            let high = 0;
            if (material) {
                const s = material.shader;
                if (s) high = s.id;
            }
            return high * 4294967296 + low;
        }

        public checkRenderable(): boolean {
            return !!this._asset;
        }

        protected _renderHandler(renderingData: RenderingData): void {
            renderingData.out.asset = this._asset;
        }

        public postRender(): void {
        }

        public destroy(): void {
            this.asset = null;
            this._renderFn = null;
            
            super.destroy();
        }
    }
}