namespace MITOIA {
    export abstract class AbstractRenderer {
        public isRendering: boolean = false;

        protected _shaderDefines: ShaderDefines = null;
        protected _shaderUniforms: ShaderUniforms = null;

        protected _lights: AbstractLight[] = null;

        public preRender(shaderDefines: ShaderDefines, shaderUniforms: ShaderUniforms, lights: AbstractLight[]): void {
            this._shaderDefines = shaderDefines;
            this._shaderUniforms = shaderUniforms;
            this._lights = lights;
        }

        public render(renderingObjects: RenderingObject[], start: int, end: int): void {
        }

        public postRender(): void {
            this._shaderDefines = null;
            this._shaderUniforms = null;
            this._lights = null;
        }

        public get shaderDefines(): ShaderDefines {
            return this._shaderDefines;
        }

        public get shaderUniforms(): ShaderUniforms {
            return this._shaderUniforms;
        }

        public onShaderPreUse(): void {
        }
    }
}