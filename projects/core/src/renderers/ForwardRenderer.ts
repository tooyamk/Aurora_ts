///<reference path="../materials/Material.ts"/>
///<reference path="../shaders/ShaderPredefined.ts"/>
///<reference path="../utils/sort/Merge.ts"/>

namespace Aurora {
    export class ForwardRenderer extends AbstractRenderer {
        protected _enalbedLighting = true;
        protected _light: AbstractLight = null;

        //protected _l2wM44Array: number[] = [];
        //protected _l2pM44Array: number[] = [];
        //protected _l2vM44Array: number[] = [];

        protected _l2wM44Array = new Float32Array(16);
        protected _l2pM44Array = new Float32Array(16);
        protected _l2vM44Array = new Float32Array(16);

        protected _shaderDefines: ShaderDefines = null;
        protected _shaderUniforms: ShaderUniforms = null;

        protected _definesList = new ShaderDataList<ShaderDefines, ShaderDefines.Value>();
        protected _uniformsList = new ShaderDataList<ShaderUniforms, ShaderUniforms.Value>();

        constructor() {
            super();

            this._shaderDefines = new ShaderDefines();
            this._shaderDefines.retain();

            this._shaderUniforms = new ShaderUniforms();
            this._shaderUniforms.retain();
        }

        public get enabledLighting(): boolean {
            return this._enalbedLighting;
        }

        public set enabledLighting(value: boolean) {
            this._enalbedLighting = value;
        }

        public collect(renderable: AbstractRenderable, replaceMaterials: Material[], appendFn: AppendRenderingObjectFn): void {
            const mats = renderable.getMaterials();
            if (mats) {
                const rawMats = mats.raw;
                const len = rawMats.length;
                if (len > 0) {
                    if (replaceMaterials) {
                        const len1 = replaceMaterials.length;
                        if (len >= len1) {
                            for (let i = 0; i < len1; ++i) {
                                const m = rawMats[i];
                                const m2 = replaceMaterials[i];
                                appendFn(renderable, m2, m ? m.uniforms : null, renderable.getSortWeight(m2));
                            }
                        } else if (len === 1) {
                            const m = rawMats[0];
                            const u = m ? m.uniforms : null;
                            for (let i = 0; i < len1; ++i) {
                                const m2 = replaceMaterials[i];
                                appendFn(renderable, m2, u, renderable.getSortWeight(m2));
                            }
                        } else {
                            for (let i = 0; i < len; ++i) {
                                const m = rawMats[i];
                                const m2 = replaceMaterials[i];
                                appendFn(renderable, m2, m ? m.uniforms : null, renderable.getSortWeight(m2));
                            }
                        }
                    } else {
                        for (let i = 0; i < len; ++i) {
                            const m = rawMats[i];
                            appendFn(renderable, m, null, renderable.getSortWeight(m));
                        }
                    }
                }
            }
        }

        public preRender(renderingMgr: RenderingManager, lights: AbstractLight[]): void {
            super.preRender(renderingMgr, lights);

            if (lights) {
                for (let i = 0, n = lights.length; i < n; ++i) {
                    const l = lights[i];
                    if (l && l.enabled) {
                        this._light = l;
                        break;
                    }
                }
            }
        }

        public render(renderingData: RenderingData, renderingObjects: RenderingObject[], start: int, end: int): void {
            if (this._enalbedLighting && this._light) {
                this._shaderDefines.set(ShaderPredefined.LIGHTING, true);
                this._light.ready(this._shaderDefines, this._shaderUniforms);
            } else {
                this._shaderDefines.set(ShaderPredefined.LIGHTING, false);
            }

            this._renderByQueue(renderingData, renderingObjects, start, end);
        }

        public flush(): void {
        }

        public postRender(): void {
            this._light = null;

            super.postRender();
        }

        private _renderByQueue(renderingData: RenderingData, renderingObjects: RenderingObject[], start: int, end: int): void {
            for (let i = start; i <= end; ++i) {
                const obj = renderingObjects[i];
                renderingData.in.renderingObject = obj;
                obj.renderable.render(renderingData);
                const out = renderingData.out;
                const as = out.asset;
                if (as) {
                    const su = this._shaderUniforms;
                    const mat = obj.material;
                    this._definesList.pushBackByList(out.definesList).pushBack(mat.defines).pushBack(this._shaderDefines);
                    this._uniformsList.pushBackByList(out.uniformsList).pushBack(mat.uniforms).pushBack(obj.alternativeUniforms).pushBack(su);
                    
                    const shader = mat.shader;
                    if (shader.hasUniform(ShaderPredefined.u_M44_L2P)) su.setNumberArray(ShaderPredefined.u_M44_L2P, obj.l2p.toArray44(false, this._l2pM44Array));
                    if (shader.hasUniform(ShaderPredefined.u_M44_L2V)) su.setNumberArray(ShaderPredefined.u_M44_L2V, obj.l2v.toArray44(false, this._l2vM44Array));
                    if (shader.hasUniform(ShaderPredefined.u_M44_L2W)) su.setNumberArray(ShaderPredefined.u_M44_L2W, obj.l2w.toArray44(false, this._l2wM44Array));
                    
                    this._renderingMgr.useAndDraw(as, mat, this._definesList, this._uniformsList);
                    this._definesList.clear();
                    this._uniformsList.clear();
                }
                obj.renderable.postRender();
                renderingData.out.clear();
            }
        }

        public destroy() {
            if (this._shaderDefines) {
                this._shaderDefines.release();
                this._shaderDefines = null;
            }

            if (this._shaderUniforms) {
                this._shaderUniforms.release();
                this._shaderUniforms = null;
            }

            super.destroy();
        }
    }
}