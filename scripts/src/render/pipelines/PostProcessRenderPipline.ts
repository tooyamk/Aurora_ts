namespace MITOIA {
    export class PostProcess {
        public readonly clear: GLClear = new GLClear();
        public frameBuffer: GLFrameBuffer = null;
        public assetStore: AssetStore = null;
        public material: Material = null;
    }

    export class PostProcessRenderPipline extends AbstractRenderPipeline {
        private _defaultVertexBuffer: GLVertexBuffer = null;
        private _defaultTexCoordBuffer: GLVertexBuffer = null;
        private _defaultIndexBuffer: GLIndexBuffer = null;
        private _defaultShader: Shader = null;

        public render(gl: GL, postProcesses:PostProcess[]): void {
            if (postProcesses) {
                this._createDefaultAssets(gl);

                for (let i = 0, n = postProcesses.length; i < n; ++i) {
                    let pp = postProcesses[i];
                    if (pp && pp.material) {
                        let useDefaultShader = pp.material.shader == null;
                        if (useDefaultShader) pp.material.shader = this._defaultShader;

                        if (pp.material.ready(this.shaderDefines)) {
                            if (pp.frameBuffer) {
                                pp.frameBuffer.bind();
                                gl.setViewport(0, 0, pp.frameBuffer.width, pp.frameBuffer.height);
                            } else {
                                gl.restoreBackBuffer();
                                gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                            }

                            gl.clear(pp.clear);

                            let p = pp.material.use(this.shaderUniform);

                            let atts = p.attributes;
                            for (let i = 0, n = atts.length; i < n; ++i) {
                                let att = atts[i];
                                let buffer = pp.assetStore ? pp.assetStore.getVertexBuffer(att) : null;
                                if (!buffer) {
                                    if (att.name == Shader.a_Position) {
                                        buffer = this._defaultVertexBuffer;
                                    } else if (att.name == Shader.a_TexCoord) {
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
                this._defaultVertexBuffer.upload([-1, -1, -1, 1, 1, 1, 1, -1], GLVertexBufferSize.TWO, GLVertexDataType.FLOAT, false, GLUsageType.STATIC_DRAW);

                this._defaultTexCoordBuffer = new GLVertexBuffer(gl);
                this._defaultTexCoordBuffer.upload([0, 0, 0, 1, 1, 1, 1, 0], GLVertexBufferSize.TWO, GLVertexDataType.FLOAT, false, GLUsageType.STATIC_DRAW);

                this._defaultIndexBuffer = new GLIndexBuffer(gl);
                this._defaultIndexBuffer.upload([0, 1, 2, 0, 2, 3], GLUsageType.STATIC_DRAW);

                /*
                this._defaultShader = new Shader(gl,
                `
                attribute vec2 a_Position;
                attribute vec2 a_TexCoord;
                varying vec2 v_uv;
                void main(void){
                    v_uv = a_TexCoord;
                    gl_Position = vec4(a_Position.x, a_Position.y, 0, 1);
                }
                `, 
                `
                uniform sampler2D s_Sampler;
                varying vec2 v_uv;
                void main(void){
                    gl_FragColor = texture2D(s_Sampler, v_uv);
                }
                `);
                */
            }
        }
    }
}