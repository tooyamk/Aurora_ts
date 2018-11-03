namespace Aurora {
    export class ShaderSource {
        private static SYS_DEFINES: Set<string> = null;
        private static EXCLUDE_DEFINE: RegExp = null;
        private static EXTRACT_LINES: RegExp = null;
        private static SEARCH_IF_OR_ELIF_DEFINE: RegExp = null;
        private static SEARCH_DEFINEDS: RegExp = null;
        private static SEARCH_DEFINE_VALUE: RegExp = null;
        private static SEARCH_DEFINE_OPERATORS: RegExp = null;
        private static SEARCH_DEFINES: RegExp[] = null;
        private static REPLACE_DEFINES: RegExp[] = null;

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
                ShaderSource.EXCLUDE_DEFINE = new RegExp(`^(${BuiltinShader.General.DECLARE_UNIFORM_DEFINE_PREFIX}|${BuiltinShader.General.DECLARE_UNIFORM_ARRAY_DEFINE_PREFIX}|${BuiltinShader.General.DECLARE_VARYING_DEFINE_PREFIX}|${BuiltinShader.General.DECLARE_TEMP_VAR_PREFIX})`);
                ShaderSource.EXTRACT_LINES = /[\r\n][  ]*#(define|undef|ifdef|ifndef|if|elif)[  ]+[^\r\n\/]*/g;
                ShaderSource.SEARCH_IF_OR_ELIF_DEFINE = /#(if|elif)[  ]*/;
                ShaderSource.SEARCH_DEFINEDS = /\s*!*defined\s*\(\s*|\s|\)/g;
                ShaderSource.SEARCH_DEFINE_OPERATORS = /==|>|<|!=|>=|<=|&&|\|\|/;
                ShaderSource.SEARCH_DEFINE_VALUE = /\D/;
                
                ShaderSource.SEARCH_DEFINES = [];
                ShaderSource.REPLACE_DEFINES = [];
                ShaderSource._createSearchAndReplaceDefine("define");
                ShaderSource._createSearchAndReplaceDefine("undef");
                ShaderSource._createSearchAndReplaceDefine("ifdef");
                ShaderSource._createSearchAndReplaceDefine("ifndef");
            }
        }

        private static _createSearchAndReplaceDefine(name: string): void {
            ShaderSource.SEARCH_DEFINES.push(new RegExp("#" + name + "[  ]+\\S+"));
            ShaderSource.REPLACE_DEFINES.push(new RegExp("#" + name + "|\\s", "g"));
        }

        public static parseDefineNames(source: string, excludeDefines: string[]): Set<string> {
            ShaderSource._init();

            const op = new Set<string>();
            const lines = ("\n" + source + "\n").match(ShaderSource.EXTRACT_LINES);
            if (lines) {
                let ext1: Set<string> = null;
                let ext2: RegExp = null;
                if (excludeDefines) {
                    let ext2Str: string = null;
                    for (let i = 0, n = excludeDefines.length; i < n; ++i) {
                        const n = excludeDefines[i];
                        if (n) {
                            if (n.charAt(n.length - 1) === "*") {
                                ext2Str ? ext2Str += "|" + n : ext2Str = "^(" + n;
                            } else {
                                if (!ext1) ext1 = new Set();
                                ext1.add(n);
                            }
                        }
                    }

                    if (ext2Str) ext2 = new RegExp(ext2Str);
                }

                const addDefine = (name: string) => {
                    if (!ShaderSource.SYS_DEFINES.has(name)) {
                        if (ext1 && ext1.has(name)) return;
                        if (name.search(ShaderSource.EXCLUDE_DEFINE) < 0) {
                            if (ext2 && name.search(ext2) >= 0) return; 
                            op.add(name);
                        }
                    }
                }

                const regsLen = ShaderSource.SEARCH_DEFINES.length;

                for (let i = 0, n = lines.length; i < n; ++i) {
                    let line = lines[i];
                    let isBreak = false;
                    for (let j = 0; j < regsLen; ++j) {
                        const find = line.match(ShaderSource.SEARCH_DEFINES[j]);
                        if (find) {
                            addDefine(find[0].replace(ShaderSource.REPLACE_DEFINES[j], ""));
                            isBreak = true;
                            break;
                        }
                    }

                    if (!isBreak) {
                        const idx = line.search(ShaderSource.SEARCH_IF_OR_ELIF_DEFINE);
                        if (idx >= 0) {
                            line = line.replace(ShaderSource.SEARCH_IF_OR_ELIF_DEFINE, "");
                            const params = line.split(ShaderSource.SEARCH_DEFINE_OPERATORS);
                            for (let j = 0, n = params.length; j < n; ++j) {
                                const value = params[j].replace(ShaderSource.SEARCH_DEFINEDS, "");
                                if (value.search(ShaderSource.SEARCH_DEFINE_VALUE) === 0) addDefine(value);
                            }
                        }
                    }
                }
            }

            return op;
        }
    }
}