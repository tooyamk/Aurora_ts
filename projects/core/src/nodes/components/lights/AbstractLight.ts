///<reference path="../../Node.ts" />

namespace Aurora {
    export abstract class AbstractLight extends Node.AbstractComponent {
        public readonly color: Color3 = Color3.WHITE;
        public intensity: number = 1;

        public ready(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            //override
        }

        protected _generalReady(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            const wm = this.node.readonlyWorldMatrix;

            uniforms.setNumbers(ShaderPredefined.u_LightColor0, this.color.r * this.intensity, this.color.g * this.intensity, this.color.b * this.intensity);
            uniforms.setNumbers(ShaderPredefined.u_LightDirW0, wm.m20, wm.m21, wm.m22);
            uniforms.setNumbers(ShaderPredefined.u_LightPosW0, wm.m30, wm.m31, wm.m32);
        }
    }
}