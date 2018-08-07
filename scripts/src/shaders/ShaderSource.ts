namespace MITOIA {
    export class ShaderSource {
        private _source: string;
        private _defines: Set<string>;

        constructor(data: string) {
            this._source = data;
            this._defines = ShaderSource._searchDefineNames(data);
        }

        public get defines(): Set<string> {
            return this._defines;
        }

        private static _searchDefineNames(data: string) {
            let op = new Set<string>();
            let lines = ("\n" + data + "\n").match(/[\r\n][  ]*#(define|undef|ifdef|ifndef|if|elif)[  ]+[^\r\n/]*/g);
            if (lines) {
                let searchRegs: RegExp[] = [];
                let replaceRegs: RegExp[] = [];
                let searchIfOrElifReg = /#(if|elif)[  ]*/;
                let splitReg = /==|>|<|!=|>=|<=|&&|\|\|/;
                let replaceReg = /\s*!*defined\s*\(\s*|\s|\)/g;
                let noNumberReg = /\D/;

                let createReg = (name: string) => {
                    searchRegs.push(new RegExp("#" + name + "[  ]+\\S+"));
                    replaceRegs.push(new RegExp("#" + name + "|\\s", "g"));
                }

                createReg("define");
                createReg("undef");
                createReg("ifdef");
                createReg("ifndef");

                let regsLen = searchRegs.length;

                for (let i = 0, n = lines.length; i < n; ++i) {
                    let line = lines[i];
                    let isBreak: boolean = false;
                    for (let j = 0; j < regsLen; ++j) {
                        let find = line.match(searchRegs[j]);
                        if (find) {
                            op.add(find[0].replace(replaceRegs[j], ""));
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
                                if (value.search(noNumberReg) == 0) op.add(value);
                            }
                        }
                    }
                }
            }

            return op;
        }
    }
}