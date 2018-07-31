namespace MITOIA {
    export class AssetStore {
        public vertexBuffers: GLVertexBuffer[] = [];
        public vertexBufferMapping: Map<string, int> = new Map();

        public indexBuffers: GLIndexBuffer[] = [];
        public indexBufferMapping: Map<string, int> = new Map();

        public getVertexBuffer(name: string): GLVertexBuffer {
            let idx = this.vertexBufferMapping.get(name);
            return idx >= 0 ? this.vertexBuffers[idx] : null;
        }

        public getIndexBuffer(name: string): GLIndexBuffer {
            let idx = this.indexBufferMapping.get(name);
            return idx >= 0 ? this.indexBuffers[idx] : null;
        }
    }
}