namespace MITOIA {
    export class DirectionLight extends AbstractLight {
        public preRender(renderer: AbstractRenderer): void {
            let defines = renderer.shaderDefines;
            let uniforms = renderer.shaderUniforms;
            defines.setDefine(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_DIRECTION);

            let wm = this.node.readonlyWorldMatrix;

            uniforms.setNumber(ShaderPredefined.u_LightAtrrib0, wm.m20, wm.m21, wm.m22);
        }
    }
}