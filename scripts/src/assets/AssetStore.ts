namespace MITOIA {
    export class AssetStore {
        public a_Position: GLVertexBuffer = null;
        public a_Normal: GLVertexBuffer = null;
        public a_TexCoord0: GLVertexBuffer = null;
        public a_Color0: GLVertexBuffer = null;
        public a_Index: GLVertexBuffer = null;

        public indexBuffer: GLIndexBuffer = null;

        public customVertexBuffer: Map<string, GLVertexBuffer> = null;
        public customIndexBuffers: Map<string, GLIndexBuffer> = null;

        public customGetVertexBufferFn: (info: GLProgramAttribInfo) => GLVertexBuffer = null;
        public customGetIndexBufferFn: () => GLIndexBuffer = null;

        public getVertexBuffer(info: GLProgramAttribInfo): GLVertexBuffer {
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