namespace MITOIA {
    export class ShaderStore {
        private _libs: { [key: string]: string } = {};
        private _verts: { [key: string]: ShaderSource } = {};
        private _frags: { [key: string]: ShaderSource } = {};

        constructor() {

        }

        public addLibrary(name: string, source: string): void {
            if (source && source.length > 0) {
                this._libs[name] = source;
            }
        }

        public getShaderSource(name: string, type: GLShaderType): ShaderSource {
            let map = type == GLShaderType.VERTEX_SHADER ? this._verts : this._frags;
            return map[name];
        }

        public addSource(name: string, data: string, type: GLShaderType, forceUpdate: boolean = false): ShaderSource {
            let map = type == GLShaderType.VERTEX_SHADER ? this._verts : this._frags;
            let ss = map[name];
            if (ss && !forceUpdate) ss;

            ss = new ShaderSource(data);
            map[name] = ss;
            return ss;
        }
    }
}