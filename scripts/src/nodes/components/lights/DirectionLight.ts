namespace MITOIA {
    export class DirectionLight extends AbstractLight {
        public readyRender(renderer: AbstractRenderer): void {
            super.readyRender(renderer);

            let defines = renderer.shaderDefines;
            defines.setDefine(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_DIRECTION);
        }
    }
}