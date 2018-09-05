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

        public ready(globalDefines: ShaderDefines): boolean {
            if (this.shader) {
                return this.shader.ready(globalDefines, this.defines);
            }

            return false;
        }

        public use(globalUniforms: ShaderUniforms): GLProgram {
            let gl = this.shader.gl;
            gl.setBlend(this.blend);
            gl.setCullFace(this.cullFace);
            gl.setDepthTest(this.depthTest);
            gl.setDepthWrite(this.depthWrite);
            gl.setColorWrite(this.colorWrite);
            gl.setStencil(this.stencilFront, this.stencilBack);

            return this.shader.use(globalUniforms, this.uniforms);
        }
    }
}