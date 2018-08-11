namespace MITOIA {
    export class ForwardRenderer extends AbstractRenderer {
        public enalbedBlendDepthSort: boolean = true;

        protected _light: AbstractLight = null;
        protected _renderingObject: RenderingObject = null;

        public preRender(shaderDefines: ShaderDefines, shaderUniforms: ShaderUniforms, lights: AbstractLight[]): void {
            super.preRender(shaderDefines, shaderUniforms, lights);

            if (lights) {
                for (let i = 0, n = lights.length; i < n; ++i) {
                    let l = lights[i];
                    if (l && l.enabled) {
                        this._light = l;
                        break;
                    }
                }
            }
        }

        public render(renderingObjects: RenderingObject[], start: int, end: int): void {
            if (this._light) {
                this._shaderDefines.setDefine(ShaderPredefined.LIGHTING, true);
                this._light.ready(this._shaderDefines, this._shaderUniforms);
            } else {
                this._shaderDefines.setDefine(ShaderPredefined.LIGHTING, false);
            }

            if (this.enalbedBlendDepthSort) this._sortByBlend(renderingObjects, start, end);
            this._renderByQueue(renderingObjects, start, end);
        }

        public postRender(): void {
            super.postRender();

            this._light = null;
        }

        private _sortByBlend(renderingObjects: RenderingObject[], start: uint, end: uint): void {
            let renderingPriority: number = null;
            let alphaBlendStart: number = null;
            for (let i = start; i <= end; ++i) {
                let obj = renderingObjects[i];
                if (obj.material.blend) {
                    if (alphaBlendStart === null) {
                        alphaBlendStart = i;
                        renderingPriority = obj.material.renderingPriority;
                    } else if (renderingPriority !== obj.material.renderingPriority) {
                        this._sortByDepth(renderingObjects, alphaBlendStart, i - 1);
                        alphaBlendStart = i;
                        renderingPriority = obj.material.renderingPriority;
                    }
                } else if (alphaBlendStart !== null) {
                    this._sortByDepth(renderingObjects, alphaBlendStart, i - 1);
                    alphaBlendStart = null;
                }
            }

            if (alphaBlendStart !== null) this._sortByDepth(renderingObjects, alphaBlendStart, end);
        }

        private _sortByDepth(renderingObjects: RenderingObject[], start: uint, end: uint): void {
            Sort.Merge.sort(renderingObjects, (a: RenderingObject, b: RenderingObject) => {
                return a.localToView.m32 > b.localToView.m32;
            }, start, end);
        }

        private _renderByQueue(renderingObjects: RenderingObject[], start: int, end: int): void {
            for (let i = start; i <= end; ++i) {
                let obj = renderingObjects[i];
                this._renderingObject = obj;
                obj.renderable.draw(this, obj.material);
            }

            this._renderingObject = null;
        }

        public onShaderPreUse(): void {
            let shader = this._renderingObject.material.shader;

            if (shader.hasUniform(ShaderPredefined.u_M33_L2W)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M33_L2W, this._renderingObject.localToWorld.toArray33());
            if (shader.hasUniform(ShaderPredefined.u_M44_L2P)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_L2P, this._renderingObject.localToProj.toArray44());
            if (shader.hasUniform(ShaderPredefined.u_M44_L2V)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_L2V, this._renderingObject.localToView.toArray44());
            if (shader.hasUniform(ShaderPredefined.u_M44_L2W)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_L2W, this._renderingObject.localToWorld.toArray44());
        }
    }
}