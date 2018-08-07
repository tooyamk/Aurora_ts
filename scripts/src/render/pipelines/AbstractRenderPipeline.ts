namespace MITOIA {
    export abstract class AbstractRenderPipeline {
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
    }
}