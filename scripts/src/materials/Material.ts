namespace MITOIA {
    export class Material {
        public shader: Shader = null;

        public renderingPriority: int = 0;

        public enabledBlend: boolean = false;
        public blendEquation: GLBlendEquation = null;
        public blendFunc: GLBlendFunc = null;

        public defines: ShaderDefines = new ShaderDefines();
        public uniforms: ShaderUniforms = new ShaderUniforms();

        constructor(shader: Shader = null) {
            this.shader = shader;
        }

        public use(globalDefines: ShaderDefines): GLProgram {
            if (this.shader) {
                this.shader.switch(globalDefines, this.defines);
                this.uniforms.use(this.shader);

                let gl = this.shader.gl;
                gl.enableBlend(this.enabledBlend);
                if (this.enabledBlend) {
                    if (this.blendEquation) gl.setBlendEquation(this.blendEquation);
                    if (this.blendFunc) gl.setBlendFunc(this.blendFunc);
                }
    
                return this.shader.use();
            } else {
                return null;
            }
        }
    }
}