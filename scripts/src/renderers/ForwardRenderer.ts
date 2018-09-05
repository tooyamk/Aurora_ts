namespace Aurora {
    export class ForwardRenderer extends AbstractRenderer {
        public enalbedRenderingSort: boolean = true;

        protected _enalbedLighting = true;
        protected _light: AbstractLight = null;
        protected _renderingObject: RenderingObject = null;

        protected _localToWorldM33Array: number[] = [];
        protected _localToWorldM44Array: number[] = [];
        protected _localToProjM44Array: number[] = [];
        protected _localToViewM44Array: number[] = [];

        public get enabledLighting(): boolean {
            return this._enalbedLighting;
        }

        public set enabledLighting(value: boolean) {
            this._enalbedLighting = value;
        }

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
            if (this._enalbedLighting && this._light) {
                this._shaderDefines.setDefine(ShaderPredefined.LIGHTING, true);
                this._light.ready(this._shaderDefines, this._shaderUniforms);
            } else {
                this._shaderDefines.setDefine(ShaderPredefined.LIGHTING, false);
            }

            if (this.enalbedRenderingSort) this._sort(renderingObjects, start, end);
            this._renderByQueue(renderingObjects, start, end);
        }

        public postRender(): void {
            super.postRender();

            this._light = null;
        }

        private _sort(renderingObjects: RenderingObject[], start: uint, end: uint): void {
            let obj = renderingObjects[start];
            let renderingPriority: number = obj.material.renderingPriority;
            let sortStart: number = start;

            for (let i = start + 1; i <= end; ++i) {
                obj = renderingObjects[i];
                let mat = obj.material;

                if (renderingPriority !== mat.renderingPriority) {
                    this._doSort(renderingObjects, sortStart, i - 1);
                    sortStart = i;
                    renderingPriority = mat.renderingPriority;
                }
            }

            this._doSort(renderingObjects, sortStart, end);
        }

        private _doSort(renderingObjects: RenderingObject[], start: uint, end: uint): void {
            Sort.Merge.sort(renderingObjects, (a: RenderingObject, b: RenderingObject) => {
                let value = a.material.renderingSort - b.material.renderingSort;
                if (value === 0) {
                    switch (a.material.renderingSort) {
                        case RenderingSort.FAR_TO_NEAR: {
                            return a.localToView.m32 >= b.localToView.m32;
                            break;
                        }
                        case RenderingSort.NEAR_TO_FAR: {
                            return a.localToView.m32 <= b.localToView.m32;
                            break;
                        }
                        default:
                            return true;
                            break;
                    }
                } else {
                    return value < 0;
                }
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

            if (shader.hasUniform(ShaderPredefined.u_M33_L2W)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M33_L2W, this._renderingObject.localToWorld.toArray33(false, this._localToWorldM33Array));
            if (shader.hasUniform(ShaderPredefined.u_M44_L2P)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_L2P, this._renderingObject.localToProj.toArray44(false, this._localToProjM44Array));
            if (shader.hasUniform(ShaderPredefined.u_M44_L2V)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_L2V, this._renderingObject.localToView.toArray44(false, this._localToViewM44Array));
            if (shader.hasUniform(ShaderPredefined.u_M44_L2W)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_L2W, this._renderingObject.localToWorld.toArray44(false, this._localToWorldM44Array));
        }
    }
}