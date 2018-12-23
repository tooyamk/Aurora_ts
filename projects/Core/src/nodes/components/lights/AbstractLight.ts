///<reference path="../../Node.ts"/>

namespace Aurora {
    export abstract class AbstractLight extends Node.AbstractComponent {
        public readonly color = Color3.WHITE;
        public intensity: number = 1;

        public abstract ready(defines: ShaderDefines, uniforms: ShaderUniforms): void;

        protected _generalReady(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            const e = this.node.readonlyWorldMatrix.elements;

            uniforms.setNumbers(ShaderPredefined.u_LightColor0, this.color.r * this.intensity, this.color.g * this.intensity, this.color.b * this.intensity);
            uniforms.setNumbers(ShaderPredefined.u_LightDirW0, e[2], e[6], e[10]);
            uniforms.setNumbers(ShaderPredefined.u_LightPosW0, e[3], e[7], e[11]);
        }
    }
}