namespace MITOIA {
    export const enum ShaderUniformType {
        NUMBER,
        SAMPLER
    }

    export class ShaderUniformValue {
        public type: ShaderUniformType;
        public vec4: number[] = null;
        public array: ArrayLike<number> | Float32Array | Int32Array = null;
        public sampler: AbstractGLTexture = null;
    }

    export class ShaderUniforms {
        public _uniforms: { [key: string]: ShaderUniformValue } = {};

        public delate(name: string): void {
            delete this._uniforms[name];
        }

        public setNumber(name: string, x: number = 0, y: number = 0, z: number = 0, w: number = 0): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.NUMBER;
            if (v.vec4) {
                v.vec4[0] = x;
                v.vec4[1] = y;
                v.vec4[2] = z;
                v.vec4[3] = w;
            } else {
                v.vec4 = [x, y, z, w];
            }
            v.array = v.vec4;
        }

        public setNumberArray(name: string, array: ArrayLike<number> | Float32Array | Int32Array): void {
            if (array) {
                let v = this._getOrCreateUnifomr(name);
                v.type = ShaderUniformType.NUMBER;
                v.array = array;
            }
        }

        public setTexture(name: string, tex: AbstractGLTexture): void {
            if (tex) {
                let v = this._getOrCreateUnifomr(name);
                v.type = ShaderUniformType.SAMPLER;
                v.sampler = tex;
            }
        }

        private _getOrCreateUnifomr(name: string): ShaderUniformValue {
            let v = this._uniforms[name];
            if (v) {
                v.array = null;
            } else {
                v = new ShaderUniformValue();
                this._uniforms[name] = v;
            }
            return v;
        }
    }
}