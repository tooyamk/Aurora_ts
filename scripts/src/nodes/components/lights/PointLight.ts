namespace MITOIA {
    export class PointLight extends AbstractLight {
        /**
         * final attenuation = 1 / (attenuationConstantFactor + attenuationLinearFactor * distance + attenuationExpFactor * distance * distance).
         */
        public attenuationConstantFactor = 1.0;
        public attenuationLinearFactor = 0.01;
        public attenuationExpFactor = 0.0;

        public ready(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            super.ready(defines, uniforms);
            
            defines.setDefine(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_POINT);

            uniforms.setNumberArray(ShaderPredefined.u_LightAttrib0, [this.attenuationConstantFactor, this.attenuationLinearFactor, this.attenuationExpFactor]);
        }
    }
}