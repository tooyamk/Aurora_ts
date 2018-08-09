namespace MITOIA {
    export class VertexSource {
        public name: string = null;

        public data: number[] = null;
        public size: GLVertexBufferSize;
        public type: GLVertexBufferDataType;
        public normalized: boolean = false;

        constructor(name: string = null, vertices: number[] = null, size: GLVertexBufferSize = GLVertexBufferSize.THREE, type: GLVertexBufferDataType = GLVertexBufferDataType.FLOAT, normalized: boolean = false) {
            this.name = name;
            this.data = vertices;
            this.size = size;
            this.type = type;
            this.normalized = normalized;
        }

        public createBuffer(gl: GL): GLVertexBuffer {
            if (this.data && gl) {
                let buffer = new GLVertexBuffer(gl);
                buffer.upload(this.data, this.size, this.type, this.normalized, GLUsageType.STATIC_DRAW);
                return buffer;
            }

            return null;
        }
    }
}