namespace Aurora {
    export const enum ShaderUniformType {
        NONE,
        NUMBER,
        SAMPLER
    }

    export class ShaderUniformValue {
        public type: ShaderUniformType;
        public vec4: number[] = null;
        public array: number[] | Float32Array | Int32Array = null;
        public sampler: AbstractGLTexture = null;

        public static isEqual(v0: ShaderUniformValue, v1: ShaderUniformValue): boolean {
            let t0 = v0 ? v0.type : ShaderUniformType.NONE;
            let t1 = v1 ? v1.type : ShaderUniformType.NONE;
            if (t0 === t1) {
                switch (t0) {
                    case ShaderUniformType.NUMBER:
                    {
                        let n0 = v0.array ? v0.array.length : 0;
                        let n1 = v1.array ? v1.array.length : 0;
                        if (n0 === n1) {
                            for (let i = 0; i < n0; ++i) {
                                if (v0.array[i] !== v1.array[i]) return false;
                            }
                        } else {
                            return false;
                        }

                        break;
                    }
                    case ShaderUniformType.SAMPLER:
                    {
                        if (v0.sampler !== v1.sampler) return false;

                        break;
                    }
                    default:
                        break;
                }
            } else {
                return false;
            }

            return true;
        }
    }

    export class ShaderUniforms {
        public next: ShaderUniforms = null;
        
        public _uniforms: { [key: string]: ShaderUniformValue } = {};
        protected _numUniforms: uint = 0;

        public static isEqual(value0: ShaderUniforms, value1: ShaderUniforms, info: GLProgramUniformInfo[] = null): boolean {
            if (value0 === value1) return true;
            if (value0) {
                if (value1) {
                    if (info) {
                        for (let i = 0, n = info.length; i < n; ++i) {
                            let name = info[i].name;
                            if (!ShaderUniformValue.isEqual(value0._uniforms[name], value1._uniforms[name])) return false;
                        }
                    } else {
                        if (value0._numUniforms === value1._numUniforms) {
                            for (let key in value0._uniforms) {
                                if (!ShaderUniformValue.isEqual(value0._uniforms[key], value1._uniforms[key])) return false;
                            }
                        } else {
                            return false;
                        }
                    }
                } else {
                    return false;
                }
            } else if (value1) {
                return false;
            }
            return true;
        }

        public setNumber(name: string, x: number = 0, y: number = 0, z: number = 0, w: number = 0): void {
            let v = this._getOrCreateUniform(name);
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

        public setNumberArray(name: string, array: number[] | Float32Array | Int32Array): void {
            if (array) {
                let v = this._getOrCreateUniform(name);
                v.type = ShaderUniformType.NUMBER;
                v.array = array;
            }
        }

        public setTexture(name: string, tex: AbstractGLTexture): void {
            if (tex) {
                let v = this._getOrCreateUniform(name);
                v.type = ShaderUniformType.SAMPLER;
                v.sampler = tex;
            }
        }

        public delete(name: string, clean: boolean = false): void {
            let v = this._uniforms[name];
            if (v) {
                if (clean) {
                    if (v.type !== ShaderUniformType.NONE) --this._numUniforms;
                    delete this._uniforms[name];
                } else if (v.type !== ShaderUniformType.NONE) {
                    v.type = ShaderUniformType.NONE;
                    v.array = null;
                    v.sampler = null;
                    --this._numUniforms;
                }
            }
        }

        private _getOrCreateUniform(name: string): ShaderUniformValue {
            let v = this._uniforms[name];
            if (v) {
                v.array = null;
                if (v.type === ShaderUniformType.NONE) {
                    ++this._numUniforms;
                }
            } else {
                v = new ShaderUniformValue();
                this._uniforms[name] = v;
                ++this._numUniforms;
            }
            return v;
        }
    }
}