namespace Aurora {
    export class PointLight extends AbstractLight {
        
        protected _attenConstant: number;
        protected _attenLinear: number;
        protected _attenQuadratic: number;

        constructor() {
            super();

            this.setAttenuation(1000.0);
        }

        public ready(defines: ShaderDefines, uniforms: ShaderUniforms): void {
            this._generalReady(defines, uniforms);
            
            defines.setDefine(ShaderPredefined.LIGHT_TYPE0, ShaderPredefined.LIGHT_TYPE_POINT);

            uniforms.setNumberArray(ShaderPredefined.u_LightAttrib0, [this._attenConstant, this._attenLinear, this._attenQuadratic]);
        }

        public setAttenuation(radius: number): void;
        /**
         * luminosity = 1 / (constant + linear * distance + quadratic * distance * distance).
         */
        public setAttenuation(constant: number, linear: number, quadratic: number): void;

        public setAttenuation(...args: any[]): void {
            if (args.length === 1) {
                let radius = <number>args[0];
                this._attenConstant = 1.0;
                this._attenLinear = 4.5 / radius;
                this._attenQuadratic = 75.0 / (radius * radius);
            } else if (args.length === 3) {
                this._attenConstant = args[0];
                this._attenLinear = args[1];
                this._attenQuadratic = args[2];
            } else {
                //error
            }
        }
    }
}