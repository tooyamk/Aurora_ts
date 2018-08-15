namespace MITOIA {
    export class SpotLight extends AbstractLight {
        public spotAngle: number = Math.PI / 6.0;

        /**
         * final attenuation = 1 / (attenuationConstantFactor + attenuationLinearFactor * distance + attenuationExpFactor * distance * distance).
         */
        public attenuationConstantFactor = 1.0;
        public attenuationLinearFactor = 0.01;
        public attenuationExpFactor = 0.0;

        public smoothEdgeFactor = 1200.0;

        public ready(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            super.ready(defines, uniforms);
            
            defines.setDefine(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_SPOT);

            uniforms.setNumberArray(ShaderPredefined.u_LightAttrib0, [this.attenuationConstantFactor, this.attenuationLinearFactor, this.attenuationExpFactor, Math.cos(this.spotAngle * 0.5), this.smoothEdgeFactor]);
        }
    }
}