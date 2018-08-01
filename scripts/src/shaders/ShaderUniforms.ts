namespace MITOIA {
    export enum ShaderUniformType {
        FLOAT,
        FLOAT_ARRAY,
        INT,
        INT_ARRAY,
        FLOAT2,
        FLOAT2_ARRAY,
        INT2,
        INT2_ARRAY,
        FLOAT3,
        FLOAT3_ARRAY,
        INT3,
        INT3_ARRAY,
        FLOAT4,
        FLOAT4_ARRAY,
        INT4,
        INT4_ARRAY,
        MAT2,
        MAT3,
        MAT4
    }

    export class ShaderUniformValue {
        public type: ShaderUniformType;
        public x: number;
        public y: number;
        public z: number;
        public w: number;
        public array: ArrayLike<number> | Float32Array | Int32Array;
    }

    export class ShaderUniforms {
        private _uniforms: { [key: string]: ShaderUniformValue } = {};

        public use(shader: Shader): void {
            if (shader && shader.uniforms) {
                let uniforms = shader.uniforms;
                let gl = shader.gl.internalGL;
                for (let i = 0, n = uniforms.length; i < n; ++i) {
                    let info = uniforms[i];

                    let v = this._uniforms[info.name];
                    if (v) {
                        switch (v.type) {
                            case ShaderUniformType.FLOAT:
                                gl.uniform1f(info.location, v.x);
                                break;
                            case ShaderUniformType.FLOAT_ARRAY:
                                gl.uniform1fv(info.location, v.array);
                                break;
                            case ShaderUniformType.INT:
                                gl.uniform1i(info.location, v.x);
                                break;
                            case ShaderUniformType.INT_ARRAY:
                                gl.uniform1iv(info.location, v.array);
                                break;

                            case ShaderUniformType.FLOAT2:
                                gl.uniform2f(info.location, v.x, v.y);
                                break;
                            case ShaderUniformType.FLOAT2_ARRAY:
                                gl.uniform2fv(info.location, v.array);
                                break;
                            case ShaderUniformType.INT2:
                                gl.uniform2i(info.location, v.x, v.y);
                                break;
                            case ShaderUniformType.INT2_ARRAY:
                                gl.uniform2iv(info.location, v.array);
                                break;

                            case ShaderUniformType.FLOAT3:
                                gl.uniform3f(info.location, v.x, v.y, v.z);
                                break;
                            case ShaderUniformType.FLOAT3_ARRAY:
                                gl.uniform3fv(info.location, v.array);
                                break;
                            case ShaderUniformType.INT3:
                                gl.uniform3i(info.location, v.x, v.y, v.z);
                                break;
                            case ShaderUniformType.INT3_ARRAY:
                                gl.uniform3iv(info.location, v.array);
                                break;

                            case ShaderUniformType.FLOAT4:
                                gl.uniform4f(info.location, v.x, v.y, v.z, v.w);
                                break;
                            case ShaderUniformType.FLOAT4_ARRAY:
                                gl.uniform4fv(info.location, v.array);
                                break;
                            case ShaderUniformType.INT4:
                                gl.uniform4i(info.location, v.x, v.y, v.z, v.w);
                                break;
                            case ShaderUniformType.INT4_ARRAY:
                                gl.uniform4iv(info.location, v.array);
                                break;

                            case ShaderUniformType.MAT2:
                                gl.uniformMatrix2fv(info.location, false, v.array);
                                break;
                            case ShaderUniformType.MAT3:
                                gl.uniformMatrix3fv(info.location, false, v.array);
                                break;
                            case ShaderUniformType.MAT4:
                                gl.uniformMatrix4fv(info.location, false, v.array);
                                break;

                            default:
                                break;
                        }
                    }
                }
            }
        }

        public delate(name: string): void {
            delete this._uniforms[name];
        }

        public setFloat(name: string, x: number): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.FLOAT;
            v.x = x;
        }

        public setFloatArray(name: string, array: ArrayLike<number> | Float32Array): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.FLOAT_ARRAY;
            v.array = array;
        }

        public setInt(name: string, x: int): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.INT;
            v.x = x;
        }

        public setIntArray(name: string, array: ArrayLike<int> | Int32Array): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.INT_ARRAY;
            v.array = array;
        }

        public setFloat2(name: string, x: number, y: number): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.FLOAT2;
            v.x = x;
            v.y = y;
        }

        public setFloat2Array(name: string, array: ArrayLike<number> | Float32Array): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.FLOAT2_ARRAY;
            v.array = array;
        }

        public setInt2(name: string, x: int, y: int): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.INT2;
            v.x = x;
            v.y = y;
        }

        public setInt2Array(name: string, array: ArrayLike<int> | Int32Array): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.INT2_ARRAY;
            v.array = array;
        }

        public setFloat3(name: string, x: number, y: number, z: number): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.FLOAT3;
            v.x = x;
            v.y = y;
            v.z = z;
        }

        public setFloat3Array(name: string, array: ArrayLike<number> | Float32Array): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.FLOAT3_ARRAY;
            v.array = array;
        }

        public setInt3(name: string, x: int, y: int, z: number): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.INT3;
            v.x = x;
            v.y = y;
            v.z = z;
        }

        public setInt3Array(name: string, array: ArrayLike<int> | Int32Array): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.INT3_ARRAY;
            v.array = array;
        }

        public setFloat4(name: string, x: number, y: number, z: number, w: number): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.FLOAT4;
            v.x = x;
            v.y = y;
            v.z = z;
            v.w = w;
        }

        public setFloat4Array(name: string, array: ArrayLike<number> | Float32Array): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.FLOAT4_ARRAY;
            v.array = array;
        }

        public setInt4(name: string, x: int, y: int, z: number, w: number): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.INT4;
            v.x = x;
            v.y = y;
            v.z = z;
            v.w = w;
        }

        public setInt4Array(name: string, array: ArrayLike<int> | Int32Array): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.INT4_ARRAY;
            v.array = array;
        }

        public setMatrix22(name: string, array: ArrayLike<number> | Float32Array): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.MAT2;
            v.array = array;
        }

        public setMatrix33(name: string, array: ArrayLike<number> | Float32Array): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.MAT3;
            v.array = array;
        }

        public setMatrix44(name: string, array: ArrayLike<number> | Float32Array): void {
            let v = this._getOrCreateUnifomr(name);
            v.type = ShaderUniformType.MAT4;
            v.array = array;
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