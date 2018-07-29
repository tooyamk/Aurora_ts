namespace MITOIA {
    export class MeshAsset {
        public vertexAsset: number[] = null;
        public indexAsset: number[] = null;

        protected _vertexBuffer: GLVertexBuffer = null;
        protected _indexBuffer: GLIndexBuffer = null;

        public get vertexBuffer(): GLVertexBuffer {
            return this._vertexBuffer;
        }

        public createGLData(gl: GL): void {
            this.dispose(false, true);

            if (this.vertexAsset) {
                this._vertexBuffer = new GLVertexBuffer(gl);
                this._vertexBuffer.upload(this.vertexAsset);
            }

            if (this.indexAsset) {
                this._indexBuffer = new GLIndexBuffer(gl);
                this._indexBuffer.upload(this.indexAsset);
            }

        }

        public dispose(asset: boolean, gl: boolean): void {
            if (asset) {
                this.vertexAsset = null;
                this.indexAsset = null;
            }

            if (gl) {
                if (this._vertexBuffer) {
                    this._vertexBuffer.dispose();
                    this._vertexBuffer = null;
                }

                if (this._indexBuffer) {
                    this._indexBuffer.dispose();
                    this._indexBuffer = null;
                }
            }
        }
    }
}