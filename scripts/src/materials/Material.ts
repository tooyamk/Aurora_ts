namespace MITOIA {
    export class Material {
        public shader: Shader = null;
        public renderingPriority: int = 0;
        public alphaBlend:boolean = false;

        public defines: ShaderDefines = new ShaderDefines();

        constructor(shader: Shader = null) {
            this.shader = shader;
        }

        public use(globalDefines: ShaderDefines): GLProgram {
            if (this.shader) {
                this.shader.switch(globalDefines, this.defines);
                return this.shader.use();
            } else {
                return null;
            }
        }
    }
}