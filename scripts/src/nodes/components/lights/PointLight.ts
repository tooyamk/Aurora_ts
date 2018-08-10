namespace MITOIA {
    export class PointLight extends AbstractLight {
        /**
         * if range < 0, infinite.
         */
        public range: number = 1000.0;

        public readyRender(renderer: AbstractRenderer): void {
            super.readyRender(renderer);
            
            let defines = renderer.shaderDefines;
            defines.setDefine(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_POINT);

            let uniforms = renderer.shaderUniforms;
            uniforms.setNumber(ShaderPredefined.u_LightAttrib0, this.range);
        }
    }
}