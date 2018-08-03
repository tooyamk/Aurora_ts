namespace MITOIA {
    export class Material {
        public shader: Shader = null;

        public renderingPriority: int = 0;

        public enabledBlend: boolean = false;
        public blendEquation: GLBlendEquation = null;
        public blendFunc: GLBlendFunc = null;
        public blendColor: Color4 = null;

        public cullFace: GLCullFace = GLCullFace.BACK;
        public depthTest: GLDepthTest = GLDepthTest.LESS;

        public defines: ShaderDefines = new ShaderDefines();
        public uniforms: ShaderUniforms = new ShaderUniforms();

        constructor(shader: Shader = null) {
            this.shader = shader;
        }

        public ready(globalDefines: ShaderDefines): boolean {
            if (this.shader) {
                this.shader.ready(globalDefines, this.defines);
                return true;
            }

            return false;
        }

        public use(globalUniforms: ShaderUniforms): GLProgram {
            let gl = this.shader.gl;
            gl.enableBlend(this.enabledBlend);
            if (this.enabledBlend) {
                if (this.blendEquation) gl.setBlendEquation(this.blendEquation);
                if (this.blendFunc) gl.setBlendFunc(this.blendFunc);
                if (this.blendColor) gl.setBlendColor(this.blendColor);
            }

            gl.setCullFace(this.cullFace);
            gl.setDepthTest(this.depthTest);

            return this.shader.use(globalUniforms, this.uniforms);
        }
    }
}