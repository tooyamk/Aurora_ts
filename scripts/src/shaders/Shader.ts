namespace MITOIA {
    export class Shader {
        protected _engine: Engine;
        protected _vertexSource: string;
        protected _fragmentSource: string;

        protected _cachedNoDefineProgram: GLProgram = null;
        protected _cachedPrograms: { [key: string]: GLProgram} = {};

        protected _curProgram: GLProgram = null;

        constructor (engine: Engine, vertexSource: string, fragmentSource: string) {
            this._engine = engine;
            this._vertexSource = vertexSource;
            this._fragmentSource = fragmentSource;
        }

        public switch(defines: ShaderDefines): void {
            let key = defines ? defines.toKey() : null;

            this._curProgram = this._getProgramFromCache(key);
            if (!this._curProgram) {
                let appendDefs = "";

                let defMap = defines._internalDefines;
                for (let name in defMap) {
                    let value = defMap[name];
                    if (value === null) {
                        appendDefs += "#define " + value + "\n";
                    } else {
                        appendDefs += "#define " + value + " " + value + "\n";
                    }
                }

                this._curProgram = new GLProgram(this._engine.gl);
                this._curProgram.compileAndLink(appendDefs + this._vertexSource, appendDefs + this._fragmentSource);

                if (key && key.length > 0) {
                    this._cachedPrograms[key] = this._curProgram;
                } else {
                    this._cachedNoDefineProgram = this._curProgram;
                }
            }
        }

        public getAttributeLocations(names: string[], rst: number[] = null): number[] {
            return this._engine.gl.getAttributeLocations(this._curProgram, names, rst);
        }

        public use(): void {
            if (this._curProgram) this._curProgram.use();
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