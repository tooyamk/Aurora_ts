///<reference path="ShaderSource.ts" />

namespace Aurora {
    export class Shader {
        protected _gl: GL;
        protected _vert: ShaderSource;
        protected _frag: ShaderSource;

        protected _defines: string[] = [];

        protected _cachedNoDefineProgram: GLProgram = null;
        protected _cachedPrograms: { [key: string]: GLProgram } = {};
        protected _numCachedPrograms = 0;

        protected _curProgram: GLProgram = null;
        protected _attributes: GLProgramAttribInfo[] = null;
        protected _uniforms: GLProgramUniformInfo[] = null;

        constructor(gl: GL, vert: ShaderSource, frag: ShaderSource) {
            this._gl = gl;
            this._vert = vert;
            this._frag = frag;

            const defines: { [key: string]: boolean } = {};
            for (const n of vert.defines) defines[n] = true;
            for (const n of frag.defines) defines[n] = true;

            for (const n in defines) this._defines.push(n);
            Sort.Merge.sort(this._defines, (a: string, b: string) => {
                return a < b;
            });
        }

        public get gl(): GL {
            return this._gl;
        }

        public get currentProgram(): GLProgram {
            return this._curProgram;
        }

        public get attributes(): GLProgramAttribInfo[] {
            return this._attributes;
        }

        public get uniforms(): GLProgramUniformInfo[] {
            return this._uniforms;
        }

        public get numCachedPrograms(): uint {
            return this._numCachedPrograms;
        }

        public hasUniform(name: string): boolean {
            if (this._curProgram) return this._curProgram.hasUniform(name);
            return false;
        }

        public precompile(defines: ShaderDefines): boolean {
            const appendDefines = this._collectDefines(defines);
            const p = this._getProgramFromCache(appendDefines);
            return p ? true : this._createProgram(appendDefines).status === GLProgramStatus.SUCCESSED;
        }

        public ready(defines: ShaderDefines): GLProgram {
            const appendDefines = this._collectDefines(defines);
            this._curProgram = this._getProgramFromCache(appendDefines);
            if (!this._curProgram) this._curProgram = this._createProgram(appendDefines);

            this._attributes = this._curProgram.attributes;
            this._uniforms = this._curProgram.uniforms;

            return this._curProgram.status === GLProgramStatus.SUCCESSED ? this._curProgram : null;
        }

        private _collectDefines(defines: ShaderDefines): string {
            let appendDefines = "";

            if (defines) {
                for (let i = 0, n = this._defines.length; i < n; ++i) {
                    const name = this._defines[i];
                    const v = defines.getValue(name);
                    if (v) {
                        if (v.type === ShaderDefines.VlaueType.BOOL) {
                            if (v.value) appendDefines += "\n" + name;
                        } else if (v.type === ShaderDefines.VlaueType.INT) {
                            appendDefines += "\n" + name + " " + v.value;
                        }
                    }
                }
            }

            return appendDefines;
        }

        private _createProgram(appendDefines: string): GLProgram {
            const finalAppendDefines = appendDefines.length > 0 ? appendDefines.replace(/\n/g, "\n#define ") + "\n" : "";
            const p = new GLProgram(this._gl);
            p.compileAndLink(finalAppendDefines + this._vert.source, finalAppendDefines + this._frag.source);
            if (appendDefines.length > 0) {
                this._cachedPrograms[appendDefines] = p;
            } else {
                this._cachedNoDefineProgram = p;
            }
            ++this._numCachedPrograms;

            return p;
        }

        public use(uniforms: ShaderUniforms): GLProgram {
            if (this._curProgram && this._curProgram.status === GLProgramStatus.SUCCESSED) {
                this._curProgram.use();

                if (this._curProgram.uniforms && uniforms) {
                    const curUniforms = this._curProgram.uniforms;
                    const gl = this._gl.context;
                    let samplerIndex = 0;
                    for (let i = 0, n = curUniforms.length; i < n; ++i) {
                        const info = curUniforms[i];
                        const v = uniforms.getValue(info.name);
                        switch (info.type) {
                            case GLUniformType.FLOAT: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) {
                                    if (info.isArray) {
                                        gl.uniform1fv(info.location, <any>v.array);
                                    } else {
                                        gl.uniform1f(info.location, v.array[0]);
                                    }
                                }

                                break;
                            }
                            case GLUniformType.FLOAT_VEC2: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) {
                                    if (info.isArray) {
                                        gl.uniform2fv(info.location, <any>v.array);
                                    } else {
                                        gl.uniform2f(info.location, v.array[0], v.array[1]);
                                    }
                                }

                                break;
                            }
                            case GLUniformType.FLOAT_VEC3: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) {
                                    if (info.isArray) {
                                        gl.uniform3fv(info.location, <any>v.array);
                                    } else {
                                        gl.uniform3f(info.location, v.array[0], v.array[1], v.array[2]);
                                    }
                                }

                                break;
                            }
                            case GLUniformType.FLOAT_VEC4: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) {
                                    if (info.isArray) {
                                        gl.uniform4fv(info.location, <any>v.array);
                                    } else {
                                        gl.uniform4f(info.location, v.array[0], v.array[1], v.array[2], v.array[3]);
                                    }
                                }

                                break;
                            }
                            case GLUniformType.INT: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) {
                                    if (info.isArray) {
                                        gl.uniform1iv(info.location, <any>v.array);
                                    } else {
                                        gl.uniform1i(info.location, v.array[0]);
                                    }
                                }

                                break;
                            }
                            case GLUniformType.INT_VEC2: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) {
                                    if (info.isArray) {
                                        gl.uniform2iv(info.location, <any>v.array);
                                    } else {
                                        gl.uniform2i(info.location, v.array[0], v.array[1]);
                                    }
                                }

                                break;
                            }
                            case GLUniformType.INT_VEC3: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) {
                                    if (info.isArray) {
                                        gl.uniform3iv(info.location, <any>v.array);
                                    } else {
                                        gl.uniform3i(info.location, v.array[0], v.array[1], v.array[2]);
                                    }
                                }

                                break;
                            }
                            case GLUniformType.INT_VEC4: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) {
                                    if (info.isArray) {
                                        gl.uniform4iv(info.location, <any>v.array);
                                    } else {
                                        gl.uniform4i(info.location, v.array[0], v.array[1], v.array[2], v.array[3]);
                                    }
                                }

                                break;
                            }
                            case GLUniformType.BOOL: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) {
                                    if (info.isArray) {
                                        gl.uniform1fv(info.location, <any>v.array);
                                    } else {
                                        gl.uniform1f(info.location, v.array[0]);
                                    }
                                }

                                break;
                            }
                            case GLUniformType.BOOL_VEC2: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) {
                                    if (info.isArray) {
                                        gl.uniform2fv(info.location, <any>v.array);
                                    } else {
                                        gl.uniform2f(info.location, v.array[0], v.array[1]);
                                    }
                                }

                                break;
                            }
                            case GLUniformType.BOOL_VEC3: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) {
                                    if (info.isArray) {
                                        gl.uniform3fv(info.location, <any>v.array);
                                    } else {
                                        gl.uniform3f(info.location, v.array[0], v.array[1], v.array[2]);
                                    }
                                }

                                break;
                            }
                            case GLUniformType.BOOL_VEC4: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) {
                                    if (info.isArray) {
                                        gl.uniform4fv(info.location, <any>v.array);
                                    } else {
                                        gl.uniform4f(info.location, v.array[0], v.array[1], v.array[2], v.array[3]);
                                    }
                                }

                                break;
                            }
                            case GLUniformType.FLOAT_MAT2: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) gl.uniformMatrix2fv(info.location, false, <any>v.array);

                                break;
                            }
                            case GLUniformType.FLOAT_MAT3: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) gl.uniformMatrix3fv(info.location, false, <any>v.array);

                                break;
                            }
                            case GLUniformType.FLOAT_MAT4: {
                                if (v && v.type === ShaderUniforms.ValueType.NUMBER) gl.uniformMatrix4fv(info.location, false, <any>v.array);

                                break;
                            }
                            case GLUniformType.SAMPLER_2D: {
                                if (v && v.sampler.textureType === GLTexType.TEXTURE_2D) {
                                    if (v.sampler.use(samplerIndex, info.location))++samplerIndex;
                                } else {
                                    if (this._gl.activeNullTexture(GLTexType.TEXTURE_2D, samplerIndex))++samplerIndex;
                                }

                                break;
                            }
                            case GLUniformType.SAMPLER_CUBE: {
                                if (v && v.sampler.textureType === GLTexType.TEXTURE_CUBE_MAP) {
                                    if (v.sampler.use(samplerIndex, info.location))++samplerIndex;
                                } else {
                                    if (this._gl.activeNullTexture(GLTexType.TEXTURE_CUBE_MAP, samplerIndex))++samplerIndex;
                                }

                                break;
                            }
                            default:
                                break;
                        }
                    }
                }
            }

            return this._curProgram;
        }

        public destroy(): void {
            if (this._cachedNoDefineProgram) {
                this._cachedNoDefineProgram.destroy();
                this._cachedNoDefineProgram = null;
            }

            for (const key in this._cachedPrograms) this._cachedPrograms[key].destroy();
            this._cachedPrograms = {};

            this._curProgram = null;
        }

        protected _getProgramFromCache(key: string): GLProgram {
            return key && key.length > 0 ? this._cachedPrograms[key] : this._cachedNoDefineProgram;
        }
    }
}