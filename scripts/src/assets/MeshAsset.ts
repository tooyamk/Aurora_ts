namespace MITOIA {
    export class MeshAsset {
        public vertexAssets: { [key: string] : number[]} = {};
        public vertexBuffers: { [key: string]: GLVertexBuffer } = {};

        public indexAsset: number[] = null;

        protected _indexBuffer: GLIndexBuffer = null;

        public setVertexAsset(name: string, value: number[]): void {
            if (name && name.length > 0) {
                if (value) {
                    this.vertexAssets[name] = value;
                } else {
                    delete this.vertexAssets[name];
                }
            }
        }

        public createVertexBuffer(gl: GL, name: string, value: number[]): void {
            let buffer = this.vertexBuffers[name];
            if (!buffer) {
                buffer = new GLVertexBuffer(gl);
                this.vertexBuffers[name] = buffer;
            }
            buffer.upload(value);
        }

        public createGLBuffers(gl: GL): void {
            for (let name in this.vertexAssets) {
                this.createVertexBuffer(gl, name, this.vertexAssets[name]);
            }
        }

        public createGLData(gl: GL): void {
            this.dispose(false, true);

            this.createGLBuffers(gl);

            if (this.indexAsset) {
                this._indexBuffer = new GLIndexBuffer(gl);
                this._indexBuffer.upload(this.indexAsset);
            }

        }

        public disposeVertexBuffe(name: string): void {
            let buffer = this.vertexBuffers[name];
            if (buffer) {
                buffer.dispose();
                delete this.vertexBuffers[name];
            }
        }

        public dispose(asset: boolean, gl: boolean): void {
            if (asset) {
                this.vertexAssets = {};
                this.indexAsset = null;
            }

            if (gl) {
                for (let name in this.vertexBuffers) this.vertexBuffers[name].dispose();
                this.vertexBuffers = {};

                if (this._indexBuffer) {
                    this._indexBuffer.dispose();
                    this._indexBuffer = null;
                }
            }
        }
    }
}