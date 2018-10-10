namespace Aurora {
    export class ShaderDefineValue {
        public static readonly UNKNOW: int = 0;
        public static readonly BOOL: int = 1;
        public static readonly INT: int = 2;
        public type: int = ShaderDefineValue.UNKNOW;
        public value: boolean | int = null;
    }

    export class ShaderDefines {
        public next: ShaderDefines = null;

        private _defines: { [key: string] : ShaderDefineValue } = {};
        private _count: uint = 0;

        public get count(): uint {
            return this._count;
        }

        public get tail(): ShaderDefines {
            let rst: ShaderDefines = this;
            while (rst.next) rst = rst.next;
            return rst;
        }

        public clear(): void {
            if (this._count > 0) {
                this._defines = {};
                this._count = 0;
            }
        }

        public hasDefine(name: string): boolean {
            return this._defines[name] !== undefined;
        }

        public getDefine(name: string): ShaderDefineValue {
            return this._defines[name];
        }

        public setDefine(name: string, value: boolean | int): void {
            if (value === null || value === undefined) value = false;
            
            let v = this._defines[name];
            if (!v) {
                v = new ShaderDefineValue();
                this._defines[name] = v;
            }

            if (value === true) {
                if (v.type !== ShaderDefineValue.BOOL || v.value !== true) {
                    v.type = ShaderDefineValue.BOOL;
                    v.value = true;
                    //this._dirty = true;
                    ++this._count;
                }
            } else if (value === false) {
                if (v.type !== ShaderDefineValue.BOOL || v.value !== true) {
                    v.type = ShaderDefineValue.BOOL;
                    v.value = false;
                    //this._dirty = true;
                    ++this._count;
                }
            } else {
                if (v.type !== ShaderDefineValue.INT || v.value !== value) {
                    v.type = ShaderDefineValue.INT;
                    v.value = value;
                    //this._dirty = true;
                    ++this._count;
                }
            }

            //if (this._dirty) this._defStrDirty = true;
        }
    }
}