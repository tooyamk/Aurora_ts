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
        public assets: AssetsStore = null;
        public uniforms: ShaderUniforms = null;

        public clear(): void {
            this.assets = null;
            this.uniforms = null;
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