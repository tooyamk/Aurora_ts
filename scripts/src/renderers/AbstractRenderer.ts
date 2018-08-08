namespace MITOIA {
    export abstract class AbstractRenderer {
        protected _shaderDefines: ShaderDefines = new ShaderDefines();
        protected _shaderUniform: ShaderUniforms = new ShaderUniforms();

        public get shaderDefines(): ShaderDefines {
            return this._shaderDefines;
        }

        public get shaderUniform(): ShaderUniforms {
            return this._shaderUniform;
        }

        public onShaderPreUse(): void {
        }

        public begin(gl: GL, pass: IRenderPass): void {
            if (pass.frameBuffer) {
                pass.frameBuffer.bind();
                gl.setViewport(0, 0, pass.frameBuffer.width, pass.frameBuffer.height);
            } else {
                gl.restoreBackBuffer();
                gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            }

            gl.clear(pass.clear);
        }
    }
}