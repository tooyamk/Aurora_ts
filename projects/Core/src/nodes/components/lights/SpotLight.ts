///<reference path="PointLight.ts"/>

namespace Aurora {
    export class SpotLight extends PointLight {
        public spotAngle: number = Math.PI / 6;

        public smoothEdgeFactor = 1200;

        public ready(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            this._generalReady(defines, uniforms);
            
            defines.set(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_SPOT);

            this._atten[3] = Math.cos(this.spotAngle * 0.5), this.smoothEdgeFactor;

            uniforms.setNumberArray(ShaderPredefined.u_LightAttrib0, this._atten);
        }
    }
}