namespace Aurora {
    export class RenderingDataIn {
        public camera: Camera = null;
        public renderingObject: RenderingObject = null;

        public clear(): void {
            this.camera = null;
            this.renderingObject = null;
        }
    }

    export class RenderingDataOut {
        private _asset: MeshAsset = null;
        public readonly definesList = new ShaderDataList<ShaderDefines, ShaderDefines.Value>();
        public readonly uniformsList = new ShaderDataList<ShaderUniforms, ShaderUniforms.Value>();

        public get asset(): MeshAsset {
            return this._asset;
        }

        public set asset(value: MeshAsset) {
            if (this._asset !== value) {
                if (value) value.retain();
                if (this._asset) this._asset.release();
                this._asset = value;
            }
        }

        public clear(): void {
            if (this._asset) {
                this._asset.release();
                this._asset = null;
            }

            this.definesList.clear();
            this.uniformsList.clear();
        }
    }

    export class RenderingData {
        public readonly in = new RenderingDataIn();
        public readonly out = new RenderingDataOut();

        public clear(): void {
            this.in.clear();
            this.out.clear();
        }
    }
}