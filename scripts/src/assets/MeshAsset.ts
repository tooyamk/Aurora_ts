namespace MITOIA {
    export class MeshAsset {
        public vertices: number[] = null;
        public indexes: number[] = null;

        protected _vertexBuffer: GLVertexBuffer = null;
        protected _indexBuffer: GLIndexBuffer = null;

        public get vertexBuffer(): GLVertexBuffer {
            return this._vertexBuffer;
        }

        public createGLData(gl: GL): void {
            this.dispose(false, true);

            if (this.vertices) {
                this._vertexBuffer = new GLVertexBuffer(gl);
                this._vertexBuffer.upload(this.vertices);
            }

            if (this.indexes) {
                this._indexBuffer = new GLIndexBuffer(gl);
                this._indexBuffer.upload(this.indexes);
            }

        }

        public dispose(asset: boolean, gl: boolean): void {
            if (asset) {
                this.vertices = null;
                this.indexes = null;
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