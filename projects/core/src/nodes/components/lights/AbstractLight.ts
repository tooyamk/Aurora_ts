///<reference path="../AbstractNodeComponent.ts" />
///<reference path="../../../shaders/ShaderDefines.ts" />
///<reference path="../../../shaders/ShaderUniforms.ts" />

namespace Aurora {
    export abstract class AbstractLight extends AbstractNodeComponent {
        public readonly color: Color3 = Color3.WHITE;
        public intensity: number = 1.0;

        public ready(defines: ShaderDefines, uniforms: ShaderUniforms): void {
        }

        protected _generalReady(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            let wm = this.node.readonlyWorldMatrix;

            uniforms.setNumber(ShaderPredefined.u_LightColor0, this.color.r * this.intensity, this.color.g * this.intensity, this.color.b * this.intensity);
            uniforms.setNumber(ShaderPredefined.u_LightDirW0, wm.m20, wm.m21, wm.m22);
            uniforms.setNumber(ShaderPredefined.u_LightPosW0, wm.m30, wm.m31, wm.m32);
        }
    }
}