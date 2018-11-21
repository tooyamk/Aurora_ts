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
        public asset: MeshAsset = null;
        public readonly uniformsList = new ShaderDataList<ShaderUniforms, ShaderUniforms.Value>();

        public clear(): void {
            this.asset = null;
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