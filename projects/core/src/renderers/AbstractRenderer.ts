///<reference path="RenderingObject.ts" />
///<reference path="../nodes/components/lights/AbstractLight.ts" />
///<reference path="../shaders/ShaderDefines.ts" />
///<reference path="../shaders/ShaderUniforms.ts" />

namespace Aurora {
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
            //override
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

        public collectRenderingObjects(renderable: AbstractRenderable, replaceMaterials: Material[]): void {
            //override
        }

        public draw(assetStore: AssetStore, material: Material, onShaderPreUse: () => void = null): void {
            if (material.ready(this._shaderDefines)) {
                if (onShaderPreUse) onShaderPreUse();

                let p = material.use(this._shaderUniforms);

                let db = assetStore.getDrawIndexBuffer(p.gl);
                if (db) {
                    let valid = true;
                    let atts = p.attributes;
                    for (let i = 0, n = atts.length; i < n; ++i) {
                        let att = atts[i];
                        let vb = assetStore.getVertexBuffer(p.gl, att);
                        if (vb) {
                            vb.use(att.location);
                        } else {
                            valid = false;
                            //p.gl.deactiveVertexAttrib(att.location);
                        }
                    }

                    if (valid) db.draw(material.drawMode);
                }
            }
        }

        public flush(): void {
            //override
        }

        public destroy(): void {
            //override
        }
    }
}