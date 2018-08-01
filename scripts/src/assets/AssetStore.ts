namespace MITOIA {
    export class AssetStore {
        public a_position: GLVertexBuffer = null;
        public a_normal: GLVertexBuffer = null;
        public a_texCoord0: GLVertexBuffer = null;
        public a_color0: GLVertexBuffer = null;
        public a_index: GLVertexBuffer = null;

        public indexBuffer: GLIndexBuffer = null;

        public customVertexBuffer: Map<string, GLVertexBuffer> = null;
        public customIndexBuffers: Map<string, GLIndexBuffer> = null;

        public customGetVertexBufferFn: (info: GLProgramAttributeInfo) => GLVertexBuffer = null;
        public customGetIndexBufferFn: () => GLIndexBuffer = null;

        public getVertexBuffer(info: GLProgramAttributeInfo): GLVertexBuffer {
            let buffer: GLVertexBuffer = (<any>this)[info.name];
            if (!buffer || !(buffer instanceof GLVertexBuffer)) {
                if (this.customVertexBuffer) buffer = this.customVertexBuffer.get(info.name);
                if (!buffer && this.customGetVertexBufferFn) buffer = this.customGetVertexBufferFn(info);
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