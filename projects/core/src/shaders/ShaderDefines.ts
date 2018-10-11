namespace Aurora {
    export const enum ShaderDefineType {
        NONE,
        BOOL,
        INT
    }

    export class ShaderDefineValue {
        public type: ShaderDefineType = ShaderDefineType.NONE;
        public value: boolean | int = null;

        public clone(): ShaderDefineValue {
            let dv = new ShaderDefineValue();
            dv.type = this.type;
            dv.value = this.value;
            return dv;
        }
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

        public clone(): ShaderDefines {
            let d = new ShaderDefines();

            if (this._count > 0) {
                for (let name in this._defines) {
                    let dv = this._defines[name];
                    if (dv.type !== ShaderDefineType.NONE) this._defines[name] = dv.clone();
                }
                d._count = this._count;
            }

            return d;
        }

        public clear(): void {
            if (this._count > 0) {
                this._defines = {};
                this._count = 0;
            }
        }

        public hasDefine(name: string): boolean {
            let v = this._defines[name];
            return v ? (v.type === ShaderDefineType.NONE ? false : true) : false;
        }

        public getDefine(name: string): ShaderDefineValue {
            let v = this._defines[name];
            if (v) {
                return v.type === ShaderDefineType.NONE ? null : v;
            } else {
                return null;
            }
        }

        public setDefine(name: string, value: boolean | int): void {
            if (value === null || value === undefined) value = false;
            
            let v = this._defines[name];
            if (v) {
                if (v.type === ShaderDefineType.NONE) ++this._count;
            } else {
                v = new ShaderDefineValue();
                this._defines[name] = v;
                ++this._count;
            }

            if (value === true) {
                if (v.type !== ShaderDefineType.BOOL || v.value !== true) {
                    v.type = ShaderDefineType.BOOL;
                    v.value = true;
                }
            } else if (value === false) {
                if (v.type !== ShaderDefineType.BOOL || v.value !== false) {
                    v.type = ShaderDefineType.BOOL;
                    v.value = false;
                }
            } else {
                if (v.type !== ShaderDefineType.INT || v.value !== value) {
                    v.type = ShaderDefineType.INT;
                    v.value = value;
                }
            }
        }

        public deleteDefine(name: string): void {
            let v = this._defines[name];
            if (v && v.type !== ShaderDefineType.NONE) {
                v.type = ShaderDefineType.NONE;
                --this._count;
            }
        }
    }
}