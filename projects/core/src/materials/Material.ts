namespace Aurora {
    export const enum RenderingSortLv1 {
        FOREMOST,
        NEAR_TO_FAR,
        MIDDLE,
        FAR_TO_NEAR,
        FINALLY
    }

    export class Material extends Ref {
        public renderingPriorityLv0: int = 0;
        public renderingPriorityLv1 = RenderingSortLv1.MIDDLE;

        public drawMode = GLDrawMode.TRIANGLES;

        public blend: GLBlend = null;

        public cullFace = GLCullFace.BACK;

        public depthTest = GLDepthTest.LESS;

        public depthWrite = true;
        public colorWrite: GLColorWrite = null;

        public stencilFront: GLStencil = null;
        public stencilBack: GLStencil = null;

        protected _shader: Shader = null;

        protected _defines: ShaderDefines = null;
        protected _uniforms: ShaderUniforms = null;

        constructor(shader: Shader = null) {
            super();

            this.shader = shader;

            this._defines = new ShaderDefines();
            this._defines.retain();

            this._uniforms = new ShaderUniforms();
            this._uniforms.retain();
        }

        //canCombine
        public static isEqual(m0: Material, m1: Material): boolean {
            if (m0 === m1) return true;
            if (m0) {
                if (m1) {
                    if (m0._shader !== m1._shader ||
                        m0.drawMode !== m1.drawMode ||
                        m0.cullFace !== m1.cullFace ||
                        m0.depthTest !== m1.depthTest ||
                        m0.depthWrite !== m1.depthWrite) return false;
                    if (!GLBlend.isEqual(m0.blend, m1.blend)) return false;
                    if (!GLColorWrite.isEqual(m0.colorWrite, m1.colorWrite)) return false;
                    if (!GLStencil.isEqual(m0.stencilFront, m1.stencilBack)) return false;
                    if (!GLStencil.isEqual(m0.stencilBack, m1.stencilBack)) return false;
                    //if (!ShaderUniforms.isEqual(m0.uniforms, m1.uniforms, info)) return false;
                } else {
                    return false;
                }
            }
            return !m1;
        }

        public static canCombine(target: Material, compare: Material, compareDefinesList: ShaderDefinesList): boolean {
            if (Material.isEqual(target, compare)) {
                const s = target.shader;
                if (s) {
                    const p = s.currentProgram;
                    if (p) {
                        
                    }
                }
            }
            return false;
        }

        public clone(): Material {
            const m = new Material(this._shader);

            m.renderingPriorityLv0 = this.renderingPriorityLv0;
            m.renderingPriorityLv1 = this.renderingPriorityLv1;
            m.drawMode = this.drawMode;
            m.cullFace = this.cullFace;
            m.depthTest = this.depthTest;
            m.depthWrite = this.depthWrite;

            if (this.blend) m.blend = this.blend.clone();
            if (this.colorWrite) m.colorWrite = this.colorWrite.clone();
            if (this.stencilFront) m.stencilFront = this.stencilFront.clone();
            if (this.stencilBack) m.stencilBack = this.stencilBack.clone();
            if (this._defines) m.defines = this._defines.clone();
            if (this._uniforms) m.uniforms = this._uniforms.clone();

            return m;
        }

        public get shader(): Shader {
            return this._shader;
        }

        public set shader(s: Shader) {
            if (this._shader !== s) {
                if (s) s.retain();
                if (this._shader) this._shader.release();
                this._shader = s;
            }
        }

        public get defines(): ShaderDefines {
            return this._defines;
        }

        public set defines(d: ShaderDefines) {
            if (this._defines !== d) {
                if (d) d.retain();
                if (this._defines) this._defines.release();
                this._defines = d;
            }
        }

        public get uniforms(): ShaderUniforms {
            return this._uniforms;
        }

        public set uniforms(u: ShaderUniforms) {
            if (this._uniforms !== u) {
                if (u) u.retain();
                if (this._uniforms) this._uniforms.release();
                this._uniforms = u;
            }
        }

        public ready(definesList: ShaderDefinesList): GLProgram {
            return this._shader ? this._shader.ready(definesList) : null;
        }

        public use(uniformsList: ShaderUniformsList): GLProgram {
            const gl = this._shader.gl;
            
            gl.setBlend(this.blend);
            gl.setCullFace(this.cullFace);
            gl.setDepthTest(this.depthTest);
            gl.setDepthWrite(this.depthWrite);
            gl.setColorWrite(this.colorWrite);
            gl.setStencil(this.stencilFront, this.stencilBack);

            return this._shader.use(uniformsList);
        }

        public destroy(): void {
            this.shader = null;
            this.blend = null;
            this.colorWrite = null;
            this.stencilFront = null;
            this.stencilBack = null;
            this.defines = null;
            this.uniforms = null;
        }

        protected _refDestroy(): void {
            this.destroy();
        }
    }
}