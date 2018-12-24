///<reference path="MeshBufferSource.ts"/>

namespace Aurora {
    export class VertexSource extends MeshBufferSource<VertexSourceData> {
        public name: string;

        public size: GLVertexBufferSize;
        public type: GLVertexBufferDataType;
        public normalized: boolean;
        public usage: GLUsageType;

        constructor(name: string = null, data: VertexSourceData = null, size: GLVertexBufferSize = GLVertexBufferSize.THREE, type: GLVertexBufferDataType = GLVertexBufferDataType.FLOAT, normalized: boolean = false, usage: GLUsageType = GLUsageType.STATIC_DRAW) {
            super();
            
            this.name = name;
            this.data = data;
            this.size = size;
            this.type = type;
            this.normalized = normalized;
            this.usage = usage;
        }

        public createBuffer(gl: GL): GLVertexBuffer {
            if (this.data && gl) {
                const buffer = new GLVertexBuffer(gl);
                buffer.upload(this.data, this.offset, this.length, this.size, this.type, this.normalized, this.usage);
                return buffer;
            }

            return null;
        }
    }
}