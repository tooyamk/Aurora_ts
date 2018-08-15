namespace MITOIA {
    export class ShaderSource {
        private static readonly SYS_DEFINES: Set<string> = new Set(["GL_ES", "GL_FRAGMENT_PRECISION_HIGH"]);

        private _source: string;
        private _defines: Set<string> = null;

        constructor(source: string, format: boolean = true) {
            this._source = format ? ShaderSource.deleteUnnecessaryContent(source) : source;
            this._defines = ShaderSource.parseDefineNames(this._source);
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

        public static parseDefineNames(source: string): Set<string> {
            let op = new Set<string>();
            let lines = ("\n" + source + "\n").match(/[\r\n][  ]*#(define|undef|ifdef|ifndef|if|elif)[  ]+[^\r\n\/]*/g);
            if (lines) {
                let searchRegs: RegExp[] = [];
                let replaceRegs: RegExp[] = [];
                let searchIfOrElifReg = /#(if|elif)[  ]*/;
                let splitReg = /==|>|<|!=|>=|<=|&&|\|\|/;
                let replaceReg = /\s*!*defined\s*\(\s*|\s|\)/g;
                let noNumberReg = /\D/;
                let excludeDefines: string[] = [`${BuiltinShader.General.DECLARE_UNIFORM_DEFINE_PREFIX}`,
                `${BuiltinShader.General.DECLARE_VARYING_DEFINE_PREFIX}`,
                `${BuiltinShader.General.DECLARE_TEMP_VAR_PREFIX}`];
                let numExcludeDefines = excludeDefines.length;

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
                        if (name.charAt(0) === '_') {
                            for (let i = 0; i < numExcludeDefines; ++i) {
                                if (name.indexOf(excludeDefines[i]) == 0) {
                                    return;
                                }
                            }
                        }

                        op.add(name);
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