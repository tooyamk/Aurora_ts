namespace Aurora {
    export class ShaderUniforms {
        public next: ShaderUniforms = null;
        
        public _uniforms: { [key: string]: ShaderUniforms.Value } = {};
        protected _count: uint = 0;

        public get tail(): ShaderUniforms {
            let rst: ShaderUniforms = this;
            while (rst.next) rst = rst.next;
            return rst;
        }

        public clone(): ShaderUniforms {
            const u = new ShaderUniforms();

            if (this._count > 0) {
                for (let name in this._uniforms) {
                    const uv = this._uniforms[name];
                    if (uv.type !== ShaderUniforms.ValueType.NONE) this._uniforms[name] = uv.clone();
                }

                u._count = this._count;
            }

            return u;
        }

        public getValue(name: string): ShaderUniforms.Value {
            let v: ShaderUniforms.Value = null;
            let u: ShaderUniforms = this;
            do {
                v = u._uniforms[name];
                if (v) {
                    break;
                } else {
                    u = u.next;
                }
            } while (u);
            return v;
        }

        public static isEqual(v0: ShaderUniforms, v1: ShaderUniforms, info: GLProgramUniformInfo[] = null): boolean {
            if (v0 === v1) return true;
            if (v0) {
                if (v1) {
                    if (info) {
                        for (let i = 0, n = info.length; i < n; ++i) {
                            const name = info[i].name;
                            if (!ShaderUniforms.Value.isEqual(v0._uniforms[name], v1._uniforms[name])) return false;
                        }
                    } else {
                        if (v0._count === v1._count) {
                            for (let key in v0._uniforms) {
                                if (!ShaderUniforms.Value.isEqual(v0._uniforms[key], v1._uniforms[key])) return false;
                            }
                        } else {
                            return false;
                        }
                    }
                } else {
                    return false;
                }
            }
            return !v1;
        }

        public setNumber(name: string, x: number = 0, y: number = 0, z: number = 0, w: number = 0): void {
            const v = this._getOrCreateUniform(name);
            v.type = ShaderUniforms.ValueType.NUMBER;
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
                const v = this._getOrCreateUniform(name);
                v.type = ShaderUniforms.ValueType.NUMBER;
                v.array = array;
            }
        }

        public setTexture(name: string, tex: AbstractGLTexture): void {
            if (tex) {
                const v = this._getOrCreateUniform(name);
                v.type = ShaderUniforms.ValueType.SAMPLER;
                v.sampler = tex;
            }
        }

        public delete(name: string, clean: boolean = false): void {
            const v = this._uniforms[name];
            if (v) {
                if (clean) {
                    if (v.type !== ShaderUniforms.ValueType.NONE) --this._count;
                    delete this._uniforms[name];
                } else if (v.type !== ShaderUniforms.ValueType.NONE) {
                    v.type = ShaderUniforms.ValueType.NONE;
                    v.array = null;
                    v.sampler = null;
                    --this._count;
                }
            }
        }

        public destroy(): void {
            if (this._uniforms) {
                for (const name in this._uniforms) this._uniforms[name].clear();
                this._uniforms = null;
            }
        }

        private _getOrCreateUniform(name: string): ShaderUniforms.Value {
            let v = this._uniforms[name];
            if (v) {
                v.array = null;
                if (v.type === ShaderUniforms.ValueType.NONE) ++this._count;
            } else {
                v = new ShaderUniforms.Value();
                this._uniforms[name] = v;
                ++this._count;
            }
            return v;
        }
    }

    export namespace ShaderUniforms {
        export const enum ValueType {
            NONE,
            NUMBER,
            SAMPLER
        }

        export class Value {
            public type: ValueType;
            public vec4: number[] = null;
            public array: number[] | Float32Array | Int32Array = null;
            public sampler: AbstractGLTexture = null;

            public clear(): void {
                this.type = ValueType.NONE;
                this.vec4 = null;
                this.array = null;
                this.sampler = null;
            }

            public clone(): Value {
                const uv = new Value();

                uv.type = this.type;
                if (this.type === ValueType.NUMBER) {
                    if (this.array === this.vec4) {
                        if (this.vec4) {
                            uv.vec4 = this.vec4.concat();
                            uv.array = uv.vec4;
                        }
                    } else if (this.array) {
                        if (this.array instanceof Float32Array) {
                            uv.array = this.array.slice(0);
                        } else if (this.array instanceof Int32Array) {
                            uv.array = this.array.slice(0);
                        } else {
                            uv.array = this.array.concat();
                        }
                    }
                } else if (this.type === ValueType.SAMPLER) {
                    uv.sampler = this.sampler;
                }

                return uv;
            }

            public static isEqual(v0: Value, v1: Value): boolean {
                const t0 = v0 ? v0.type : ValueType.NONE;
                const t1 = v1 ? v1.type : ValueType.NONE;
                if (t0 === t1) {
                    switch (t0) {
                        case ValueType.NUMBER: {
                            const n0 = v0.array ? v0.array.length : 0;
                            const n1 = v1.array ? v1.array.length : 0;
                            if (n0 === n1) {
                                for (let i = 0; i < n0; ++i) {
                                    if (v0.array[i] !== v1.array[i]) return false;
                                }
                            } else {
                                return false;
                            }

                            break;
                        }
                        case ValueType.SAMPLER:
                            if (v0.sampler !== v1.sampler) return false;
                            break;
                        default:
                            break;
                    }
                } else {
                    return false;
                }

                return true;
            }
        }
    }
}