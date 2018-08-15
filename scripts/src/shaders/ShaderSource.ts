namespace MITOIA {
    export class ShaderSource {
        private static SYS_DEFINES: Set<string> = null;
        private static EXCLUDE_DEFINES: RegExp = null;

        private _source: string;
        private _defines: Set<string> = null;

        constructor(source: string, excludeDefines: string[] = null, format: boolean = true) {
            this._source = format ? ShaderSource.deleteUnnecessaryContent(source) : source;
            this._defines = ShaderSource.parseDefineNames(this._source, excludeDefines);
        }

        public get source(): string {
            return this._source;
        }

        public get defines(): Set<string> {
            return this._defines;
        }

        public static deleteUnnecessaryContent(source: string): string {
            return source.replace(/\/\/.*|\/\*[\s\S]*?\*\/|/g, "").replace(/^\s*?[\r\n]|^[  ]+/gm, "").replace(/\$\{[  ]*\d+[  ]*\}/g, (substring: string, ...args: any[]) => {
                return substring.replace(/[  ]/g, "");
            });
        }

        private static _init(): void {
            if (!ShaderSource.SYS_DEFINES) {
                ShaderSource.SYS_DEFINES = new Set(["GL_ES", "GL_FRAGMENT_PRECISION_HIGH"]);
                ShaderSource.EXCLUDE_DEFINES = new RegExp(`^(${BuiltinShader.General.DECLARE_UNIFORM_DEFINE_PREFIX}|${BuiltinShader.General.DECLARE_UNIFORM_ARRAY_DEFINE_PREFIX}|${BuiltinShader.General.DECLARE_VARYING_DEFINE_PREFIX}|${BuiltinShader.General.DECLARE_TEMP_VAR_PREFIX})`);
            }
        }

        public static parseDefineNames(source: string, excludeDefines: string[]): Set<string> {
            ShaderSource._init();
            let op = new Set<string>();
            let lines = ("\n" + source + "\n").match(/[\r\n][  ]*#(define|undef|ifdef|ifndef|if|elif)[  ]+[^\r\n\/]*/g);
            if (lines) {
                let searchRegs: RegExp[] = [];
                let replaceRegs: RegExp[] = [];
                let searchIfOrElifReg = /#(if|elif)[  ]*/;
                let splitReg = /==|>|<|!=|>=|<=|&&|\|\|/;
                let replaceReg = /\s*!*defined\s*\(\s*|\s|\)/g;
                let noNumberReg = /\D/;

                let ext1: Set<string> = null;
                let ext2: RegExp = null;
                if (excludeDefines) {
                    let ext2Str: string = null;
                    for (let i = 0, n = excludeDefines.length; i < n; ++i) {
                        let n = excludeDefines[i];
                        if (n && n.length > 0) {
                            if (n.charAt(n.length - 1) === "*") {
                                if (ext2Str) {
                                    ext2Str += "|" + n;
                                } else {
                                    ext2Str = "^(" + n;
                                }
                            } else {
                                if (!ext1) ext1 = new Set();
                                ext1.add(n);
                            }
                        }
                    }

                    if (ext2Str) ext2 = new RegExp(ext2Str);
                }

                let createReg = (name: string) => {
                    searchRegs.push(new RegExp("#" + name + "[  ]+\\S+"));
                    replaceRegs.push(new RegExp("#" + name + "|\\s", "g"));
                }

                createReg("define");
                createReg("undef");
                createReg("ifdef");
                createReg("ifndef");

                let addDefine = (name: string) => {
                    if (!ShaderSource.SYS_DEFINES.has(name)) {
                        if (ext1 && ext1.has(name)) return;
                        if (name.search(ShaderSource.EXCLUDE_DEFINES) < 0) {
                            if (ext2 && name.search(ext2) >= 0) return; 
                            op.add(name);
                        }
                    }
                }

                let regsLen = searchRegs.length;

                for (let i = 0, n = lines.length; i < n; ++i) {
                    let line = lines[i];
                    let isBreak: boolean = false;
                    for (let j = 0; j < regsLen; ++j) {
                        let find = line.match(searchRegs[j]);
                        if (find) {
                            addDefine(find[0].replace(replaceRegs[j], ""));
                            isBreak = true;
                            break;
                        }
                    }

                    if (!isBreak) {
                        let idx = line.search(searchIfOrElifReg);
                        if (idx >= 0) {
                            line = line.replace(searchIfOrElifReg, "");
                            let params = line.split(splitReg);
                            for (let j = 0, n = params.length; j < n; ++j) {
                                let value = params[j].replace(replaceReg, "");
                                if (value.search(noNumberReg) == 0) addDefine(value);
                            }
                        }
                    }
                }
            }

            return op;
        }
    }
}