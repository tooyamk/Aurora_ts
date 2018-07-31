namespace MITOIA {
    export class Shader {
        protected _engine: Engine;
        protected _vertexSource: string;
        protected _fragmentSource: string;

        protected _cachedNoDefineProgram: GLProgram = null;
        protected _cachedPrograms: { [key: string]: GLProgram} = {};

        protected _curProgram: GLProgram = null;
        protected _attributes: GLProgramAttributeInfo[] = null;
        protected _uniforms: GLProgramUniformInfo[] = null;

        constructor (engine: Engine, vertexSource: string, fragmentSource: string) {
            this._engine = engine;
            this._vertexSource = vertexSource;
            this._fragmentSource = fragmentSource;
        }

        public get attributes(): GLProgramAttributeInfo[] {
            return this._attributes;
        }

        public get uniforms(): GLProgramUniformInfo[] {
            return this._uniforms;
        }

        public switch(globalDefines: ShaderDefines, localDefines: ShaderDefines): void {
            let key = (globalDefines ? globalDefines.getKey() : "") + (localDefines ? localDefines.getKey() : "");

            this._curProgram = this._getProgramFromCache(key);
            if (!this._curProgram) {
                let appendDefs = (globalDefines ? globalDefines.getDefineString() : "") + (localDefines ? localDefines.getDefineString() : "");

                this._curProgram = new GLProgram(this._engine.gl);
                this._curProgram.compileAndLink(appendDefs + this._vertexSource, appendDefs + this._fragmentSource);

                if (key && key.length > 0) {
                    this._cachedPrograms[key] = this._curProgram;
                } else {
                    this._cachedNoDefineProgram = this._curProgram;
                }
            }

            this._attributes = this._curProgram.attributes;
            this._uniforms = this._curProgram.uniforms;
        }

        public use(): GLProgram {
            if (this._curProgram) this._curProgram.use();
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