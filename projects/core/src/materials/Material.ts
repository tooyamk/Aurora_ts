namespace Aurora {
    export const enum RenderingSort {
        FOREMOST,
        NEAR_TO_FAR,
        MIDDLE,
        FAR_TO_NEAR,
        FINALLY
    }

    export class Material {
        public shader: Shader = null;

        public renderingPriority: int = 0;
        public renderingSort: RenderingSort = RenderingSort.MIDDLE;

        public drawMode: GLDrawMode = GLDrawMode.TRIANGLES;

        public blend: GLBlend = null;

        public cullFace: GLCullFace = GLCullFace.BACK;

        public depthTest: GLDepthTest = GLDepthTest.LESS;

        public depthWrite: boolean = true;
        public colorWrite: GLColorWrite = null;

        public stencilFront: GLStencil = null;
        public stencilBack: GLStencil = null;

        public defines: ShaderDefines = new ShaderDefines();
        public uniforms: ShaderUniforms = new ShaderUniforms();

        constructor(shader: Shader = null) {
            this.shader = shader;
        }

        public static canCombine(m0: Material, m1: Material): boolean {
            if (m0 === m1) return true;
            if (m0) {
                if (m1) {
                    if (m0.shader !== m1.shader ||
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

        public clone(): Material {
            const m = new Material(this.shader);

            m.renderingPriority = this.renderingPriority;
            m.renderingSort = this.renderingSort;
            m.drawMode = this.drawMode;
            m.cullFace = this.cullFace;
            m.depthTest = this.depthTest;
            m.depthWrite = this.depthWrite;

            if (this.blend) m.blend = this.blend.clone();
            if (this.colorWrite) m.colorWrite = this.colorWrite.clone();
            if (this.stencilFront) m.stencilFront = this.stencilFront.clone();
            if (this.stencilBack) m.stencilBack = this.stencilBack.clone();
            if (this.defines) m.defines = this.defines.clone();
            if (this.uniforms) m.uniforms = this.uniforms.clone();

            return m;
        }

        public ready(definesStack: ShaderDefinesStack): GLProgram {
            return this.shader ? this.shader.ready(definesStack) : null;
        }

        public use(uniformsStack: ShaderUniformsStack): GLProgram {
            const gl = this.shader.gl;
            
            gl.setBlend(this.blend);
            gl.setCullFace(this.cullFace);
            gl.setDepthTest(this.depthTest);
            gl.setDepthWrite(this.depthWrite);
            gl.setColorWrite(this.colorWrite);
            gl.setStencil(this.stencilFront, this.stencilBack);

            return this.shader.use(uniformsStack);
        }

        public destroy(destroyShader: boolean): void {
            if (destroyShader && this.shader) this.shader.destroy();

            this.shader = null;
            this.blend = null;
            this.colorWrite = null;
            this.stencilFront = null;
            this.stencilBack = null;
            this.defines = null;
            this.uniforms = null;
        }
    }
}