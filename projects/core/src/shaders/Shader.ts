///<reference path="ShaderSource.ts"/>

namespace Aurora {
    class RWShaderDefineInfo {
        public index: uint;
        public value: int;

        public set(index: uint, value: int): void {
            this.index = index;
            this.value = value;
        }
    }

    export class ShaderDefineInfo {
        public readonly index: uint;
        public readonly value: int;

        constructor(index: uint, value: int) {
            this.index = index;
            this.value = value;
        }
    }

    export class ShaderProgram extends GLProgram {
        private _usedDefines: ShaderDefineInfo[];
        private _unusedDefines: string[];

        constructor(gl: GL, usedDefines: ShaderDefineInfo[], unusedDefines: string[]) {
            super(gl);

            this._usedDefines = usedDefines;
            this._unusedDefines = unusedDefines;
        }

        public get usedDefines(): ShaderDefineInfo[] {
            return this._usedDefines;
        }

        public get unusedDefines(): string[] {
            return this._unusedDefines;
        }

        public destroy() {
            this._usedDefines = null;
            this._unusedDefines = null;

            super.destroy();
        }
    }

    export class Shader extends Ref {
        private static _idGenerator = 0;

        private _id: int;

        protected _gl: GL;
        protected _vert: ShaderSource;
        protected _frag: ShaderSource;

        protected _defines: string[] = [];

        protected _cachedNoDefineProgram: ShaderProgram = null;
        protected _cachedPrograms = new RefMap<int, ShaderProgram>();
        protected _numCachedPrograms = 0;

        protected _curProgram: ShaderProgram = null;
        protected _attributes: GLProgramAttribInfo[] = null;
        protected _uniforms: GLProgramUniformInfo[] = null;

        protected _usedDefines: RWShaderDefineInfo[];
        protected _numUsedDefines: uint = 0;

        protected _keyMask0: uint;
        protected _keyMask1: uint;
        protected _keyCarry: uint;

        constructor(gl: GL, vert: ShaderSource, frag: ShaderSource) {
            super();

            this._id = ++Shader._idGenerator;

            this._gl = gl;
            this._vert = vert;
            this._frag = frag;

            const defines: { [key: string]: boolean } = {};
            for (const n of vert.defines) defines[n] = true;
            for (const n of frag.defines) defines[n] = true;

            let idx: uint = 0;
            for (const n in defines) this._defines[idx++] = n;
            Sort.Merge.sort(this._defines, (a: string, b: string) => {
                return a < b;
            });
            if (idx > 31) {
                this._keyMask0 = 0x7FFFFFFF;
                this._keyMask1 = 0xFFF;
            } else {
                this._keyMask0 = Math.pow(2, idx) - 1;
                let n = 53 - idx;
                this._keyMask1 = Math.pow(2, n > 31 ? 31 : n) - 1;
            }
            this._keyCarry = this._keyMask0 + 1;
            
            this._usedDefines = [];
            this._usedDefines.length = idx;
            for (let i = 0; i < idx; ++i) this._usedDefines[i] = new RWShaderDefineInfo();
        }

        public get id(): int {
            return this._id;
        }

        public get defines(): string[] {
            return this._defines;
        }

        public isEqual(definesList: ShaderDefinesList): boolean {
            const p = this._curProgram;
            if (p) {
                const usedDefines = p.usedDefines;
                if (definesList) {
                    for (let i = 0, n = usedDefines.length; i < n; ++i) {
                        const d = usedDefines[i];
                        const v = definesList.getValue(this._defines[d.index]);
                        if (v) {
                            if (d.value === null) {
                                if (v.type !== ShaderDefines.VlaueType.BOOL || !v.value) return false;
                            } else {
                                if (v.type !== ShaderDefines.VlaueType.INT || v.value !== d.value) return false;
                            }
                        } else {
                            return false;
                        }
                    }
                } else {
                    if (usedDefines.length > 0) return false;
                }

                const unusedDefines = p.unusedDefines;
                for (let i = 0, n = unusedDefines.length; i < n; ++i) {
                    const v = definesList.getValue(unusedDefines[i]);
                    if (v) {
                        if (v.type == ShaderDefines.VlaueType.BOOL) {
                            if (v.value) return false;
                        } else if (v.type !== ShaderDefines.VlaueType.INT) {
                            return false;
                        }
                    }
                }

                return true;
            } else {
                return false;
            }
        }

        public get gl(): GL {
            return this._gl;
        }

        public get currentProgram(): ShaderProgram {
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

        public precompile(definesList: ShaderDefinesList): boolean {
            return this._getOrCreateProgram(definesList).status === GLProgramStatus.SUCCESSED;
        }

        public ready(definesList: ShaderDefinesList): ShaderProgram {
            const p = this._getOrCreateProgram(definesList);
            this._curProgram = p;

            this._attributes = p.attributes;
            this._uniforms = p.uniforms;

            return p.status === GLProgramStatus.SUCCESSED ? p : null;
        }

        private _getOrCreateProgram(definesList: ShaderDefinesList): ShaderProgram {
            let key = 0;
            this._numUsedDefines = 0;

            if (definesList) {
                const defines = this._defines;
                const usedDefines = this._usedDefines;
                let num = 0;
                let idxFlag = 0;
                let valueFlag = 0;
                for (let i = 0, n = defines.length; i < n; ++i) {
                    const name = defines[i];
                    const v = definesList.getValue(name);
                    if (v) {
                        if (v.type === ShaderDefines.VlaueType.BOOL) {
                            if (v.value) {
                                idxFlag |= 1 << i;
                                usedDefines[num++].set(i, null);
                            }
                        } else if (v.type === ShaderDefines.VlaueType.INT) {
                            const value = <int>v.value;
                            valueFlag ^= i ^ value;
                            usedDefines[num++].set(i, value);
                        }
                    }
                }

                key = (valueFlag & this._keyMask1) * this._keyCarry + (idxFlag & this._keyMask0);

                this._numUsedDefines = num;
            }

            let p = key ? this._cachedPrograms.find(key) : this._cachedNoDefineProgram;
            if (!p) {
                const defines = this._defines;
                const usedDefines: ShaderDefineInfo[] = [];
                const unusedDefines: string[] = [];
                let unusedIdx: uint = 0;
                let definesStr = "";
                for (let i = 0, n = this._numUsedDefines; i < n; ++i) {
                    const info = this._usedDefines[i];
                    const idx = info.index;

                    for (let j = unusedIdx; j < idx; ++j) unusedDefines[unusedDefines.length] = defines[j];
                    unusedIdx = i + 1;

                    definesStr += "#define " + defines[idx];
                    if (info.value !== null) definesStr += " " + info.value;
                    usedDefines[usedDefines.length] = new ShaderDefineInfo(info.index, info.value);
                    definesStr += "\n";
                }
                for (let j = unusedIdx, n = defines.length; j < n; ++j) unusedDefines[unusedDefines.length] = defines[j];

                p = new ShaderProgram(this._gl, usedDefines, unusedDefines);
                p.compileAndLink(definesStr + this._vert.source, definesStr + this._frag.source);
                if (key) {
                    this._cachedPrograms.insert(key, p);
                } else {
                    p.retain();
                    if (this._cachedNoDefineProgram) this._cachedNoDefineProgram.release();
                    this._cachedNoDefineProgram = p;
                }
                ++this._numCachedPrograms;
            }
            return p;
        }

        public use(uniformsList: ShaderUniformsList): ShaderProgram {
            const p = this._curProgram;
            if (p && p.status === GLProgramStatus.SUCCESSED) {
                p.use();

                if (p.uniforms) {
                    const infos = p.uniforms;
                    let numInfos = infos.length;
                    if (numInfos > 0 && uniformsList) {
                        const gl = this._gl.context;
                        let samplerIndex = 0;
                        for (let i = 0; i < numInfos; ++i) {
                            const info = infos[i];
                            const v = uniformsList.getValue(info.name);
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
                                        if (v.sampler.use(samplerIndex, info.location)) ++samplerIndex;
                                    } else {
                                        if (this._gl.activeNullTexture(GLTexType.TEXTURE_2D, samplerIndex)) ++samplerIndex;
                                    }

                                    break;
                                }
                                case GLUniformType.SAMPLER_CUBE: {
                                    if (v && v.sampler.textureType === GLTexType.TEXTURE_CUBE_MAP) {
                                        if (v.sampler.use(samplerIndex, info.location)) ++samplerIndex;
                                    } else {
                                        if (this._gl.activeNullTexture(GLTexType.TEXTURE_CUBE_MAP, samplerIndex)) ++samplerIndex;
                                    }

                                    break;
                                }
                                default:
                                    break;
                            }
                        }
                    }
                }
            }

            return p;
        }

        public destroy(): void {
            if (this._cachedNoDefineProgram) {
                this._cachedNoDefineProgram.release();
                this._cachedNoDefineProgram = null;
            }

            if (this._cachedPrograms) {
                this._cachedPrograms.clear();
                this._cachedPrograms = null;
            }

            this._usedDefines = null;
            this._curProgram = null;
        }

        protected _refDestroy(): void {
            this.destroy();
        }
    }
}