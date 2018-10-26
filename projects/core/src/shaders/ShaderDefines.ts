namespace Aurora {
    export class ShaderDefines {
        public next: ShaderDefines = null;

        private _defines: { [key: string]: ShaderDefines.Value } = {};
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
            const d = new ShaderDefines();

            if (this._count > 0) {
                for (const name in this._defines) {
                    const dv = this._defines[name];
                    if (dv.type !== ShaderDefines.VlaueType.NONE) this._defines[name] = dv.clone();
                }
                d._count = this._count;
            }

            return d;
        }

        public getValue(name: string): ShaderDefines.Value {
            let v: ShaderDefines.Value = null;
            let u: ShaderDefines = this;
            do {
                v = u._defines[name];
                if (v) {
                    break;
                } else {
                    u = u.next;
                }
            } while (u);
            return v;
        }

        public clear(): void {
            if (this._count > 0) {
                this._defines = {};
                this._count = 0;
            }
        }

        public hasDefine(name: string): boolean {
            const v = this._defines[name];
            return v ? (v.type === ShaderDefines.VlaueType.NONE ? false : true) : false;
        }

        public getDefine(name: string): ShaderDefines.Value {
            const v = this._defines[name];
            if (v) {
                return v.type === ShaderDefines.VlaueType.NONE ? null : v;
            } else {
                return null;
            }
        }

        public setDefine(name: string, value: boolean | int): void {
            if (value === null || value === undefined) value = false;
            
            let v = this._defines[name];
            if (v) {
                if (v.type === ShaderDefines.VlaueType.NONE) ++this._count;
            } else {
                v = new ShaderDefines.Value();
                this._defines[name] = v;
                ++this._count;
            }

            if (value === true) {
                if (v.type !== ShaderDefines.VlaueType.BOOL || v.value !== true) {
                    v.type = ShaderDefines.VlaueType.BOOL;
                    v.value = true;
                }
            } else if (value === false) {
                if (v.type !== ShaderDefines.VlaueType.BOOL || v.value !== false) {
                    v.type = ShaderDefines.VlaueType.BOOL;
                    v.value = false;
                }
            } else {
                if (v.type !== ShaderDefines.VlaueType.INT || v.value !== value) {
                    v.type = ShaderDefines.VlaueType.INT;
                    v.value = value;
                }
            }
        }

        public deleteDefine(name: string): void {
            const v = this._defines[name];
            if (v && v.type !== ShaderDefines.VlaueType.NONE) {
                v.type = ShaderDefines.VlaueType.NONE;
                --this._count;
            }
        }
    }

    export namespace ShaderDefines {
        export const enum VlaueType {
            NONE,
            BOOL,
            INT
        }

        export class Value {
            public type: VlaueType = VlaueType.NONE;
            public value: boolean | int = null;

            public clone(): Value {
                const dv = new Value();
                dv.type = this.type;
                dv.value = this.value;
                return dv;
            }
        }
    }
}