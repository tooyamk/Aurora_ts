namespace MITOIA {
    export class DirectionLight extends AbstractLight {
        public preRender(renderer: AbstractRenderer): void {
            let defines = renderer.shaderDefines;
            let uniforms = renderer.shaderUniforms;
            defines.setDefine(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_DIRECTION);

            let wm = this.node.readonlyWorldMatrix;

            uniforms.setNumberArray(ShaderPredefined.u_LightAtrrib0, [this.color.r * this.intensity, this.color.g * this.intensity, this.color.b * this.intensity, 0.0, 
                wm.m20, wm.m21, wm.m22, 0]);
        }
    }
}