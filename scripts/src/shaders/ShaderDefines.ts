namespace MITOIA {
    export class ShaderDefines {
        private _defines: { [key: string] : null | string } = {};
        private _count: uint = 0;

        private _key:string = "";
        private _dirty:boolean = false;

        private _defStr: string = "";
        private _defStrDirty:boolean = false;

        public get count(): uint {
            return this._count;
        }

        public clear(): void {
            if (this._count > 0) {
                this._defines = {};
                this._count = 0;
            }
        }

        public get _internalDefines(): { [key: string] : null | string } {
            return this._defines;
        }

        public getDefine(name: string,): null | boolean | string {
            let v = this._defines[name];
            if (v === undefined) {
                return null;
            } else if (v === null) {
                return true;
            } else {
                return v;
            }
        }

        public setDefine(name: string, value: boolean | string): void {
            if (value !== null && value !== undefined) {
                let v = this._defines[name];

                if (value === true) {
                    if (v === undefined) {
                        this._defines[name] = null;
                        this._dirty = true;
                        ++this._count;
                    } else if (v !== null) {
                        this._defines[name] = null;
                        this._dirty = true;
                    }
                } else if (value === false) {
                    if (this._defines[name] !== undefined) {
                        delete this._defines[name];
                        this._dirty = true;
                        --this._count;
                    }
                } else {
                    if (v != value) {
                        this._defines[name] = value;
                        this._dirty = true;
                    }
                }

                if (this._dirty) this._defStrDirty = true;
            }
        }

        public getDefineString(): string {
            if (this._defStrDirty) {
                this._defStrDirty = false;

                this._defStr = "";
                for (let name in this._defines) {
                    let value = this._defines[name];
                    if (value === null) {
                        this._defStr += "#define " + value + "\n";
                    } else {
                        this._defStr += "#define " + value + " " + value + "\n";
                    }
                }
            }

            return this._defStr;
        }

        public getKey(): string {
            if (this._dirty) {
                this._dirty = false;

                let arr: string[] = [];

                let i = 0;
                for (let name in this._defines) {
                    let value = this._defines[name];
                    if (value === null) {
                        arr[i++] = name;
                    } else {
                        arr[i++] = name + " " + value;
                    }
                }

                MITOIA.Sort.Merge.sort(arr, (a: string, b: string) => {
                    return a < b;
                });

                this._key = "";
                for (let i = 0, n = arr.length; i < n; ++i) this._key += arr[i] + ";";
            }

            return this._key;
        }
    }
}