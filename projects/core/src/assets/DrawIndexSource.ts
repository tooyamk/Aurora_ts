namespace Aurora {
    export class DrawIndexSource {
        public data: uint[];
        public type: GLIndexDataType;
        public usage: GLUsageType;

        constructor(data: uint[] = null, type: GLIndexDataType = GLIndexDataType.AUTO,usage: GLUsageType = GLUsageType.STATIC_DRAW) {
            this.data = data;
            this.type = type;
            this.usage = usage;
        }

        public createBuffer(gl: GL): GLIndexBuffer {
            if (this.data && gl) {
                let buffer = new GLIndexBuffer(gl);
                buffer.upload(this.data, this.type, this.usage);
                return buffer;
            }

            return null;
        }
    }
}