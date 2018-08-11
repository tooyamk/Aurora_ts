namespace MITOIA {
    export class PointLight extends AbstractLight {
        /**
         * if range < 0, infinite.
         */
        public range: number = 1000.0;

        public ready(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            super.ready(defines, uniforms);
            
            defines.setDefine(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_POINT);

            uniforms.setNumber(ShaderPredefined.u_LightAttrib0, this.range);
        }
    }
}