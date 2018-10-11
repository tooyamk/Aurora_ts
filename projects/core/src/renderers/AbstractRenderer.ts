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

        public render(renderingData: RenderingData, renderingObjects: RenderingObject[], start: int, end: int): void {
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

        public collectRenderingObjects(renderable: AbstractRenderable, replaceMaterials: Material[], createFn: (renderable: AbstractRenderable, material: Material, alternativeUniforms: ShaderUniforms) => void): void {
            //override
        }

        public useShader(material: Material, alternativeUniforms: ShaderUniforms, onShaderPreUse: () => void = null): GLProgram {
            if (material.ready(this._shaderDefines)) {
                if (onShaderPreUse) onShaderPreUse();

                let su: ShaderUniforms;
                let tail: ShaderUniforms = null;
                if (alternativeUniforms) {
                    su = alternativeUniforms;
                    tail = su.tail;
                    tail.next = this._shaderUniforms;
                } else {
                    su = this._shaderUniforms;
                }
                let p = material.use(su);
                if (tail) tail.next = null;
                return p;
            }
            return null;
        }

        public draw(assets: AssetsStore, material: Material, count: uint = null, offset: uint = 0): void {
            this._draw(assets, material, material.shader.currentProgram, count, offset);
        }

        public useAndDraw(assets: AssetsStore, material: Material, alternativeUniforms: ShaderUniforms, onShaderPreUse: () => void = null, count: uint = null, offset: uint = 0): void {
            let p = this.useShader(material, alternativeUniforms, onShaderPreUse);
            if (p) {
                this._draw(assets, material, p, count, offset);
            }
        }

        protected _draw(assets: AssetsStore, material: Material, program: GLProgram, count: uint = null, offset: uint = 0): void {
            let gl = program.gl;
            let ib = assets.getDrawIndexBuffer(gl);
            if (ib) {
                let valid = true;
                let atts = program.attributes;
                for (let i = 0, n = atts.length; i < n; ++i) {
                    let att = atts[i];
                    let vb = assets.getVertexBuffer(gl, att);
                    if (vb) {
                        vb.use(att.location);
                    } else {
                        valid = false;
                        console.log("draw not found attribute : " + att.name);
                        //p.gl.deactiveVertexAttrib(att.location);
                    }
                }

                if (valid) ib.draw(material.drawMode, count, offset);
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