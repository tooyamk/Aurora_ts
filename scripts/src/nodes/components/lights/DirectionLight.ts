namespace MITOIA {
    export class DirectionLight extends AbstractLight {
        public ready(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            super.ready(defines, uniforms);

            defines.setDefine(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_DIRECTION);
        }
    }
}