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
        public readonly uniformsStack = new ShaderDataStack<ShaderUniforms, ShaderUniforms.Value>();

        public clear(): void {
            this.asset = null;
            this.uniformsStack.clear();
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