namespace MITOIA {
    export class PostProcess implements IRenderPass {
        public clear: GLClear = new GLClear();
        public frameBuffer: GLFrameBuffer = null;

        public assetStore: AssetStore = null;
        public material: Material = null;
        public enabled: boolean = true;
    }

    export class PostProcessRenderer extends AbstractRenderer {
        private _defaultVertexBuffer: GLVertexBuffer = null;
        private _defaultTexCoordBuffer: GLVertexBuffer = null;
        private _defaultIndexBuffer: GLIndexBuffer = null;
        private _defaultShader: Shader = null;

        public render(gl: GL, postProcesses:PostProcess[]): void {
            if (postProcesses) {
                this._createDefaultAssets(gl);

                for (let i = 0, n = postProcesses.length; i < n; ++i) {
                    let pp = postProcesses[i];
                    if (pp && pp.enabled && pp.material) {
                        let useDefaultShader = pp.material.shader == null;
                        if (useDefaultShader) pp.material.shader = this._defaultShader;

                        if (pp.material.ready(this.shaderDefines)) {
                            this.begin(gl, pp);

                            let p = pp.material.use(this.shaderUniform);

                            let atts = p.attributes;
                            for (let i = 0, n = atts.length; i < n; ++i) {
                                let att = atts[i];
                                let buffer = pp.assetStore ? pp.assetStore.getVertexBuffer(att) : null;
                                if (!buffer) {
                                    if (att.name == ShaderPredefined.a_Position) {
                                        buffer = this._defaultVertexBuffer;
                                    } else if (att.name == ShaderPredefined.a_TexCoord) {
                                        buffer = this._defaultTexCoordBuffer;
                                    }
                                }
                                if (buffer) buffer.use(att.location);
                            }

                            let buffer = pp.assetStore ? pp.assetStore.getIndexBuffer() : this._defaultIndexBuffer;
                            if (!buffer) buffer = this._defaultIndexBuffer;
                            if (buffer) buffer.draw(GLDrawMode.TRIANGLES);
                        }

                        if (useDefaultShader) pp.material.shader = null;
                    }
                }
            }
        }

        public dispose(): void {
            if (this._defaultVertexBuffer) {
                this._defaultVertexBuffer.dispose();
                this._defaultVertexBuffer = null;

                this._defaultTexCoordBuffer.dispose();
                this._defaultTexCoordBuffer = null;

                this._defaultIndexBuffer.dispose();
                this._defaultIndexBuffer = null;

                this._defaultShader.dispose();
                this._defaultShader = null;
            }
        }

        private _createDefaultAssets(gl: GL): void {
            if (!this._defaultVertexBuffer) {
                this._defaultVertexBuffer = new GLVertexBuffer(gl);
                this._defaultVertexBuffer.upload([-1, -1, -1, 1, 1, 1, 1, -1], GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW);

                this._defaultTexCoordBuffer = new GLVertexBuffer(gl);
                this._defaultTexCoordBuffer.upload([0, 0, 0, 1, 1, 1, 1, 0], GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW);

                this._defaultIndexBuffer = new GLIndexBuffer(gl);
                this._defaultIndexBuffer.upload([0, 1, 2, 0, 2, 3], GLUsageType.STATIC_DRAW);

                this._defaultShader = new Shader(gl, new ShaderSource(BuiltinShader.PostProcess.Default.VERTEX), new ShaderSource(BuiltinShader.PostProcess.Default.FRAGMENT));
            }
        }
    }
}