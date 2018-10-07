namespace Aurora {
    export class VertexSource {
        public name: string;

        public data: number[];
        public size: GLVertexBufferSize;
        public type: GLVertexBufferDataType;
        public normalized: boolean;
        public usage: GLUsageType;

        constructor(name: string = null, vertices: number[] = null, size: GLVertexBufferSize = GLVertexBufferSize.THREE, type: GLVertexBufferDataType = GLVertexBufferDataType.FLOAT, normalized: boolean = false, usage: GLUsageType = GLUsageType.STATIC_DRAW) {
            this.name = name;
            this.data = vertices;
            this.size = size;
            this.type = type;
            this.normalized = normalized;
            this.usage = usage;
        }

        public createBuffer(gl: GL): GLVertexBuffer {
            if (this.data && gl) {
                let buffer = new GLVertexBuffer(gl);
                buffer.upload(this.data, this.size, this.type, this.normalized, this.usage);
                return buffer;
            }

            return null;
        }
    }
}