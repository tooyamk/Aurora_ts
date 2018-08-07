namespace MITOIA {
    export class AssetStore {
        public indexBuffer: GLIndexBuffer = null;

        public vertexBuffers: Map<string, GLVertexBuffer> = null;
        public customIndexBuffers: Map<string, GLIndexBuffer> = null;

        public customGetVertexBufferFn: (info: GLProgramAttribInfo) => GLVertexBuffer = null;
        public customGetIndexBufferFn: () => GLIndexBuffer = null;

        constructor(vertexBuffers: Map<string, GLVertexBuffer> = null) {
            this.vertexBuffers = vertexBuffers || new Map();
        }

        public getVertexBuffer(info: GLProgramAttribInfo): GLVertexBuffer {
            let buffer = this.vertexBuffers ? this.vertexBuffers.get(info.name) : null;
            if (!buffer) {
                if (this.customGetVertexBufferFn) buffer = this.customGetVertexBufferFn(info);
            }
            return buffer;
        }

        public getIndexBuffer(): GLIndexBuffer {
            let buffer = this.indexBuffer;
            if (!buffer && this.customGetIndexBufferFn) buffer = this.customGetIndexBufferFn();
            return buffer;
        }
    }
}