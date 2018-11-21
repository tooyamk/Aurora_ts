///<reference path="AbstractLight.ts" />

namespace Aurora {
    export class DirectionLight extends AbstractLight {
        public ready(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            this._generalReady(defines, uniforms);

            defines.setDefine(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_DIRECTION);
        }
    }
}