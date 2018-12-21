///<reference path="AbstractLight.ts"/>

namespace Aurora {
    export class PointLight extends AbstractLight {
        protected _atten = new Float32Array(4);//0=constant, 1=linear, 2=quadratic, 3=use for spot light

        constructor() {
            super();

            this.setAttenuation(1000);
        }

        public ready(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            this._generalReady(defines, uniforms);
            
            defines.set(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_POINT);

            uniforms.setNumberArray(ShaderPredefined.u_LightAttrib0, this._atten);
        }

        public setAttenuation(radius: number): void;

        /**
         * luminosity = 1 / (constant + linear * distance + quadratic * distance * distance).
         */
        public setAttenuation(constant: number, linear: number, quadratic: number): void;

        public setAttenuation(...args: any[]): void {
            if (args.length === 1) {
                const radius = <number>args[0];
                this._atten[0] = 1;
                this._atten[1] = 4.5 / radius;
                this._atten[2] = 75 / (radius * radius);
            } else if (args.length === 3) {
                this._atten[0] = args[0];
                this._atten[1] = args[1];
                this._atten[2] = args[2];
            } else {
                console.error("PointLight setAttenuation params error");
            }
        }
    }
}