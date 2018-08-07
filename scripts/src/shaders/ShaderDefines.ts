namespace MITOIA {
    export class ShaderDefines {
        private _defines: { [key: string] : null | string } = {};
        private _count: uint = 0;

        public get count(): uint {
            return this._count;
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

        public getDefine(name: string): null | undefined | string {
            return this._defines[name];
        }

        public setDefine(name: string, value: boolean | string): void {
            if (value === null || value === undefined || value === "") value = false;
            
            let v = this._defines[name];

            if (value === true) {
                if (v === undefined) {
                    this._defines[name] = null;
                    //this._dirty = true;
                    ++this._count;
                } else if (v !== null) {
                    this._defines[name] = null;
                    //this._dirty = true;
                }
            } else if (value === false) {
                if (this._defines[name] !== undefined) {
                    delete this._defines[name];
                    //this._dirty = true;
                    --this._count;
                }
            } else {
                if (v != value) {
                    this._defines[name] = value;
                    //this._dirty = true;
                }
            }

            //if (this._dirty) this._defStrDirty = true;
        }
    }
}