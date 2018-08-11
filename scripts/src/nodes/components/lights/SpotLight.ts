namespace MITOIA {
    export class SpotLight extends AbstractLight {
        /**
         * if range < 0, infinite.
         */
        public range: number = 1000.0;

        public spotAngle: number = Math.PI / 6.0;

        public ready(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            super.ready(defines, uniforms);
            
            defines.setDefine(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_SPOT);

            uniforms.setNumber(ShaderPredefined.u_LightAttrib0, this.range, Math.cos(this.spotAngle * 0.5));
        }
    }
}