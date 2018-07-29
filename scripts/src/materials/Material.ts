namespace MITOIA {
    export class Material {
        public shader: Shader = null;

        public readonly defines: ShaderDefines = new ShaderDefines();

        constructor(shader: Shader = null) {
            this.shader = shader;
        }
    }
}