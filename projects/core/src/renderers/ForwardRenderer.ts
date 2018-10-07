///<reference path="../materials/Material.ts" />
///<reference path="../shaders/ShaderPredefined.ts" />
///<reference path="../utils/sort/Merge.ts" />

namespace Aurora {
    export class ForwardRenderer extends AbstractRenderer {
        protected _enalbedLighting = true;
        protected _light: AbstractLight = null;

        protected _localToWorldM33Array: number[] = [];
        protected _localToWorldM44Array: number[] = [];
        protected _localToProjM44Array: number[] = [];
        protected _localToViewM44Array: number[] = [];

        constructor() {
            super();
        }

        public get enabledLighting(): boolean {
            return this._enalbedLighting;
        }

        public set enabledLighting(value: boolean) {
            this._enalbedLighting = value;
        }

        public collectRenderingObjects(renderable: AbstractRenderable, replaceMaterials: Material[]): void {
            //override
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

            this._renderByQueue(renderingObjects, start, end);
        }

        public postRender(): void {
            super.postRender();

            this._light = null;
        }

        private _renderByQueue(renderingObjects: RenderingObject[], start: int, end: int): void {
            for (let i = start; i <= end; ++i) {
                let obj = renderingObjects[i];
                let as = obj.renderable.visit(obj);
                if (as) this.draw(as, obj.material, () => {
                    let shader = obj.material.shader;

                    if (shader.hasUniform(ShaderPredefined.u_M33_L2W)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M33_L2W, obj.localToWorld.toArray33(false, this._localToWorldM33Array));
                    if (shader.hasUniform(ShaderPredefined.u_M44_L2P)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_L2P, obj.localToProj.toArray44(false, this._localToProjM44Array));
                    if (shader.hasUniform(ShaderPredefined.u_M44_L2V)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_L2V, obj.localToView.toArray44(false, this._localToViewM44Array));
                    if (shader.hasUniform(ShaderPredefined.u_M44_L2W)) this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_L2W, obj.localToWorld.toArray44(false, this._localToWorldM44Array));
                });
            }
        }
    }
}