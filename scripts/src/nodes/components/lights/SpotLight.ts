namespace MITOIA {
    export class SpotLight extends PointLight {
        public spotAngle: number = Math.PI / 6.0;

        public smoothEdgeFactor = 1200.0;

        public ready(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            this._generalReady(defines, uniforms);
            
            defines.setDefine(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_SPOT);

            uniforms.setNumberArray(ShaderPredefined.u_LightAttrib0, [this._attenConstant, this._attenLinear, this._attenQuadratic, Math.cos(this.spotAngle * 0.5), this.smoothEdgeFactor]);
        }
    }
}