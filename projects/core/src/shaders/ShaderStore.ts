///<reference path="Shader.ts" />
///<reference path="builtin/libs/Lighting.ts" />
///<reference path="builtin/libs/Reflection.ts" />
///<reference path="builtin/DefaultMesh.ts" />
///<reference path="builtin/DefaultSkyBox.ts" />
///<reference path="../GL.ts" />

namespace Aurora {
    export interface ShaderLib {
        name: string;
        source: string;
    }

    export class ShaderStore {
        private _libs: { [key: string]: string } = {};
        private _verts: { [key: string]: ShaderSource } = {};
        private _frags: { [key: string]: ShaderSource } = {};

        public addLibrary(name: string, source: string): void;
        public addLibrary(lib: ShaderLib): void;
        public addLibrary(libs: ShaderLib[]): void;
        public addLibrary(name: string, lib: ShaderLib): void;

        public addLibrary(...args: any[]): void {
            if (args.length === 2) {
                let a: number;
                if (typeof args[1] === "string") {
                    this._addLibrary(args[0], args[1]);
                } else {
                    this._addLibrary(args[0], (<ShaderLib>args[1]).source);
                }
            } else if (args.length === 1) {
                if (args[0] instanceof Array) {
                    let libs = <ShaderLib[]>args[0];
                    for (let i = 0, n = libs.length; i < n; ++i) {
                        let lib = libs[i];
                        this._addLibrary(lib.name, lib.source);
                    }
                } else {
                    let lib = <ShaderLib>args[0];
                    this._addLibrary(lib.name, lib.source);
                }
            }
        }

        public addBuiltinLibraries(): void {
            this.addLibrary(BuiltinShader.General.SOURCES);
            this.addLibrary(BuiltinShader.Lib.AlphaTest.SOURCES);
            this.addLibrary(BuiltinShader.Lib.Lighting.SOURCES);
            this.addLibrary(BuiltinShader.Lib.Reflection.SOURCES);
        }

        public addBuiltinShaderSources(): void {
            this.addSource(BuiltinShader.DefaultMesh.NAME, BuiltinShader.DefaultMesh.VERTEX, GLShaderType.VERTEX_SHADER);
            this.addSource(BuiltinShader.DefaultMesh.NAME, BuiltinShader.DefaultMesh.FRAGMENT, GLShaderType.FRAGMENT_SHADER);

            this.addSource(BuiltinShader.DefaultSprite.NAME, BuiltinShader.DefaultSprite.VERTEX, GLShaderType.VERTEX_SHADER);
            this.addSource(BuiltinShader.DefaultSprite.NAME, BuiltinShader.DefaultSprite.FRAGMENT, GLShaderType.FRAGMENT_SHADER);

            this.addSource(BuiltinShader.DefaultSkyBox.NAME, BuiltinShader.DefaultSkyBox.VERTEX, GLShaderType.VERTEX_SHADER);
            this.addSource(BuiltinShader.DefaultSkyBox.NAME, BuiltinShader.DefaultSkyBox.FRAGMENT, GLShaderType.FRAGMENT_SHADER);
        }

        private _addLibrary(name: string, source: string): void {
            if (name && name.length > 0 && source && source.length > 0) {
                this._libs[name] = this.doInclude(ShaderSource.deleteUnnecessaryContent(source));
            }
        }

        public getShaderSource(name: string, type: GLShaderType): ShaderSource {
            let map = type === GLShaderType.VERTEX_SHADER ? this._verts : this._frags;
            return map[name];
        }

        public createShaderSource(source: string, excludeDefines: string[] = null): ShaderSource {
            return new ShaderSource(this.doInclude(ShaderSource.deleteUnnecessaryContent(source)), excludeDefines, false);
        }

        public createShader(gl: GL, name: string): Shader;
        public createShader(gl: GL, vertName: string, fragName: string): Shader;

        public createShader(gl: GL, name1: string, ...args: any[]): Shader {
            let fragName: string = args.length === 0 ? name1 : args[0];
            let vertSrc = this.getShaderSource(name1, GLShaderType.VERTEX_SHADER);
            let fragSrc = this.getShaderSource(fragName, GLShaderType.FRAGMENT_SHADER);
            return vertSrc && fragSrc ? new Shader(gl, vertSrc, fragSrc) : null;
        }

        public addSource(name: string, source: string, type: GLShaderType, excludeDefines: string[] = null, forceUpdate: boolean = false): ShaderSource {
            let map = type === GLShaderType.VERTEX_SHADER ? this._verts : this._frags;
            let ss = map[name];
            if (ss && !forceUpdate) return ss;

            ss = this.createShaderSource(source, excludeDefines);
            map[name] = ss;
            return ss;
        }

        public doInclude(source: string): string {
            return source.replace(/^[  ]*#include[  ]*<[  ]*\S+[  ]*>[^\r\n]*/gm, (substring: string, ...args: any[]) => {
                let params: string[] = null;
                let parenthesisEnd = substring.lastIndexOf(")");
                if (parenthesisEnd > 0) {
                    let parenthesisStart = substring.lastIndexOf("(");
                    if (parenthesisStart > 0 && parenthesisStart < parenthesisEnd) {
                        let paramsContent = substring.substring(parenthesisStart + 1, parenthesisEnd).replace(/[  ]/g, "");
                        if (paramsContent.length > 0) params = paramsContent.split(",");
                    }
                }
                let name = substring.replace(/[  ]*#include[  ]*<[  ]*|[  ]*>/g, "");
                let parenthesisStart = name.indexOf("(");
                if (parenthesisStart > 0) name = name.substr(0, parenthesisStart);
                let lib = this._libs[name];
                if (lib) {
                    if (params) {
                        for (let i = 0, n = params.length; i < n; ++i) lib = lib.replace(new RegExp("\\$\\{" + i + "\\}", "g"), params[i]);
                    }

                    return lib;
                } else {
                    console.log("Shader include not found lib : ", name);
                }

                return "";
            })
        }
    }
}