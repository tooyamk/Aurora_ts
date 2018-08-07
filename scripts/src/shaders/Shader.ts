namespace MITOIA {
    export class Shader {
        public static readonly a_Position: string = "a_Position";
        public static readonly a_Normal: string = "a_Normal";
        public static readonly a_TexCoord: string = "a_TexCoord";
        public static readonly a_Color: string = "a_Color";
        public static readonly a_Index: string = "a_Index";

        public static readonly u_MatW2V: string = "u_MatW2V";
        public static readonly u_MatW2P: string = "u_MatW2P";
        public static readonly u_MatV2P: string = "u_MatV2P";
        
        public static readonly u_MatL2V: string = "u_MatL2V";
        public static readonly u_MatL2W: string = "u_MatL2W";
        public static readonly u_MatL2P: string = "u_MatL2P";

        public static readonly s_Sampler: string = "s_Sampler";

        protected _gl: GL;
        protected _vert: ShaderSource;
        protected _frag: ShaderSource;

        protected _defines: string[] = [];

        protected _cachedNoDefineProgram: GLProgram = null;
        protected _cachedPrograms: { [key: string]: GLProgram} = {};

        protected _curProgram: GLProgram = null;
        protected _attributes: GLProgramAttribInfo[] = null;
        protected _uniforms: GLProgramUniformInfo[] = null;

        constructor(gl: GL, vert: ShaderSource, frag: ShaderSource) {
            this._gl = gl;
            this._vert = vert;
            this._frag = frag;

            let defines: { [key: string]: boolean } = {};
            for (let n of vert.defines) defines[n] = true;
            for (let n of frag.defines) defines[n] = true;

            for (let n in defines) this._defines.push(n);
            Sort.Merge.sort(this._defines, (a: string, b: string) => {
                return a < b;
            });
        }

        public get gl(): GL {
            return this._gl;
        }

        public get attributes(): GLProgramAttribInfo[] {
            return this._attributes;
        }

        public get uniforms(): GLProgramUniformInfo[] {
            return this._uniforms;
        }

        public hasUniform(name: string): boolean {
            if (this._curProgram) {
                return this._curProgram.hasUniform(name);
            }

            return false;
        }

        public ready(globalDefines: ShaderDefines, localDefines: ShaderDefines): boolean {
            let appendDefines = "";
            for (let i = 0, n = this._defines.length; i < n; ++i) {
                let name = this._defines[i];

                let v: string = undefined;
                if (localDefines) v = localDefines.getDefine(name);
                if (v === undefined && globalDefines) v = globalDefines.getDefine(name);

                if (v == null) {
                    appendDefines += "#define " + name + "\n";
                } else if (v !== undefined) {
                    appendDefines += "#define " + name + " " + v + "\n";
                }
            }

            this._curProgram = this._getProgramFromCache(appendDefines);
            if (!this._curProgram) {
                this._curProgram = new GLProgram(this._gl);
                this._curProgram.compileAndLink(appendDefines + this._vert.source, appendDefines + this._frag.source);

                if (appendDefines.length > 0) {
                    this._cachedPrograms[appendDefines] = this._curProgram;
                } else {
                    this._cachedNoDefineProgram = this._curProgram;
                }
            }

            this._attributes = this._curProgram.attributes;
            this._uniforms = this._curProgram.uniforms;

            return this._curProgram.status === GLProgramStatus.SUCCESSED;
        }

        public use(globalUniforms: ShaderUniforms, localUniforms: ShaderUniforms): GLProgram {
            if (this._curProgram) this._curProgram.use();

            if (this._curProgram) {
                this._curProgram.use();

                if (this._curProgram.uniforms) {
                    let uniforms = this._curProgram.uniforms;
                    let gl = this._gl.context;
                    let samplerIndex = 0;
                    for (let i = 0, n = uniforms.length; i < n; ++i) {
                        let info = uniforms[i];
                        let v = localUniforms ? localUniforms._uniforms[info.name] : null;
                        if (!v) v = globalUniforms ? globalUniforms._uniforms[info.name] : null;
                        if (v) {
                            switch (info.type) {
                                case GLUniformType.FLOAT:
                                    {
                                        if (v.type === ShaderUniformType.NUMBER) {
                                            if (info.isArray) {
                                                gl.uniform1fv(info.location, v.array);
                                            } else {
                                                gl.uniform1f(info.location, v.array[0]);
                                            }
                                        }

                                        break;
                                    }
                                case GLUniformType.FLOAT_VEC2:
                                    {
                                        if (v.type === ShaderUniformType.NUMBER) {
                                            if (info.isArray) {
                                                gl.uniform2fv(info.location, v.array);
                                            } else {
                                                gl.uniform2f(info.location, v.array[0], v.array[1]);
                                            }
                                        }

                                        break;
                                    }
                                case GLUniformType.FLOAT_VEC3:
                                    {
                                        if (v.type === ShaderUniformType.NUMBER) {
                                            if (info.isArray) {
                                                gl.uniform3fv(info.location, v.array);
                                            } else {
                                                gl.uniform3f(info.location, v.array[0], v.array[1], v.array[2]);
                                            }
                                        }

                                        break;
                                    }
                                case GLUniformType.FLOAT_VEC4:
                                    {
                                        if (v.type === ShaderUniformType.NUMBER) {
                                            if (info.isArray) {
                                                gl.uniform4fv(info.location, v.array);
                                            } else {
                                                gl.uniform4f(info.location, v.array[0], v.array[1], v.array[2], v.array[3]);
                                            }
                                        }

                                        break;
                                    }
                                case GLUniformType.INT:
                                    {
                                        if (v.type === ShaderUniformType.NUMBER) {
                                            if (info.isArray) {
                                                gl.uniform1iv(info.location, v.array);
                                            } else {
                                                gl.uniform1i(info.location, v.array[0]);
                                            }
                                        }

                                        break;
                                    }
                                case GLUniformType.INT_VEC2:
                                    {
                                        if (v.type === ShaderUniformType.NUMBER) {
                                            if (info.isArray) {
                                                gl.uniform2iv(info.location, v.array);
                                            } else {
                                                gl.uniform2i(info.location, v.array[0], v.array[1]);
                                            }
                                        }

                                        break;
                                    }
                                case GLUniformType.INT_VEC3:
                                    {
                                        if (v.type === ShaderUniformType.NUMBER) {
                                            if (info.isArray) {
                                                gl.uniform3iv(info.location, v.array);
                                            } else {
                                                gl.uniform3i(info.location, v.array[0], v.array[1], v.array[2]);
                                            }
                                        }

                                        break;
                                    }
                                case GLUniformType.INT_VEC4:
                                    {
                                        if (v.type === ShaderUniformType.NUMBER) {
                                            if (info.isArray) {
                                                gl.uniform4iv(info.location, v.array);
                                            } else {
                                                gl.uniform4i(info.location, v.array[0], v.array[1], v.array[2], v.array[3]);
                                            }
                                        }

                                        break;
                                    }
                                case GLUniformType.BOOL:
                                    {
                                        if (v.type === ShaderUniformType.NUMBER) {
                                            if (info.isArray) {
                                                gl.uniform1fv(info.location, v.array);
                                            } else {
                                                gl.uniform1f(info.location, v.array[0]);
                                            }
                                        }

                                        break;
                                    }
                                case GLUniformType.BOOL_VEC2:
                                    {
                                        if (v.type === ShaderUniformType.NUMBER) {
                                            if (info.isArray) {
                                                gl.uniform2fv(info.location, v.array);
                                            } else {
                                                gl.uniform2f(info.location, v.array[0], v.array[1]);
                                            }
                                        }

                                        break;
                                    }
                                case GLUniformType.BOOL_VEC3:
                                    {
                                        if (v.type === ShaderUniformType.NUMBER) {
                                            if (info.isArray) {
                                                gl.uniform3fv(info.location, v.array);
                                            } else {
                                                gl.uniform3f(info.location, v.array[0], v.array[1], v.array[2]);
                                            }
                                        }

                                        break;
                                    }
                                case GLUniformType.BOOL_VEC4:
                                    {
                                        if (v.type === ShaderUniformType.NUMBER) {
                                            if (info.isArray) {
                                                gl.uniform4fv(info.location, v.array);
                                            } else {
                                                gl.uniform4f(info.location, v.array[0], v.array[1], v.array[2], v.array[3]);
                                            }
                                        }

                                        break;
                                    }
                                case GLUniformType.FLOAT_MAT2:
                                    if (v.type === ShaderUniformType.NUMBER) gl.uniformMatrix2fv(info.location, false, v.array);
                                    break;
                                case GLUniformType.FLOAT_MAT3:
                                    if (v.type === ShaderUniformType.NUMBER) gl.uniformMatrix3fv(info.location, false, v.array);
                                    break;
                                case GLUniformType.FLOAT_MAT4:
                                    if (v.type === ShaderUniformType.NUMBER) gl.uniformMatrix4fv(info.location, false, v.array);
                                    break;
                                case GLUniformType.SAMPLER_2D:
                                    if (v.sampler2D.use(samplerIndex, info.location)) ++samplerIndex;
                                    break;
                                case GLUniformType.SAMPLER_CUBE:
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
            }

            return this._curProgram;
        }

        public dispose(): void {
            if (this._cachedNoDefineProgram) {
                this._cachedNoDefineProgram.dispose();
                this._cachedNoDefineProgram = null;
            }

            for (let key in this._cachedPrograms) this._cachedPrograms[key].dispose();
            this._cachedPrograms = {};

            this._curProgram = null;
        }

        protected _getProgramFromCache(key: string): GLProgram {
            return key && key.length > 0 ? this._cachedPrograms[key] : this._cachedNoDefineProgram;
        }
    }
}