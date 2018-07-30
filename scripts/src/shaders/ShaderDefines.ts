namespace MITOIA {
    export class ShaderDefines {
        private _defines: { [key: string] : null | int } = {};

        constructor() {
        }

        public clear(): void {
            this._defines = {};
        }

        public get _internalDefines(): { [key: string] : null | int } {
            return this._defines;
        }

        public setDefine(name: string, value: boolean | int): void {
            if (value === true) {
                this._defines[name] = null;
            } else if (value === false) {
                delete this._defines[name];
            } else {
                this._defines[name] = value;
            }
        }

        public toKey(): string {
            let arr: string[] = [];

            for (let name in this._defines) {
                let value = this._defines[name];
                if (value === null) {
                    arr.push(name);
                } else {
                    arr.push(name + " " + value);
                }
            }

            MITOIA.Sort.Merge.sort(arr, (a: string, b: string) => {
                return a < b;
            });

            let key: string = "";
            for (let i = 0, n = arr.length; i < n; ++i) key += arr[i] + ";";

            return key;
        }
    }
}