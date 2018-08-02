namespace MITOIA {
    export abstract class AbstractRenderPipeline {
        protected _viewToProjMatrix: Matrix44 = new Matrix44();
        protected _worldToViewMatrix: Matrix44 = new Matrix44();
        protected _worldToProjMatrix: Matrix44 = new Matrix44();

        protected _shaderDefines: ShaderDefines = new ShaderDefines();
        protected _shaderUniform: ShaderUniforms = new ShaderUniforms();

        public get shaderDefines(): ShaderDefines {
            return this._shaderDefines;
        }

        public get shaderUniform(): ShaderUniforms {
            return this._shaderUniform;
        }

        public get wroldToViewMatrix(): Matrix44 {
            return this._worldToViewMatrix;
        }

        public get wroldToProjMatrix(): Matrix44 {
            return this._worldToViewMatrix;
        }

        public get viewToProjMatrix(): Matrix44 {
            return this._worldToViewMatrix;
        }

        public render(engine: Engine, camera: Camera, node: Node): void {
            camera.owner.getWorldMatrix(this._worldToViewMatrix);
            this._worldToViewMatrix.invert();

            camera.getProjectionMatrix(this._viewToProjMatrix);

            this._worldToViewMatrix.append44(this._viewToProjMatrix, this._worldToProjMatrix);

            this._shaderUniform.setNumberArray(Shader.u_mV2P, this._viewToProjMatrix.toArray44());
            this._shaderUniform.setNumberArray(Shader.u_mW2P, this._worldToProjMatrix.toArray44());
            this._shaderUniform.setNumberArray(Shader.u_mW2V, this._worldToViewMatrix.toArray44());
        }

        public onShaderPreUse(): void {

        }
    }
}