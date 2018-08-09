namespace MITOIA {
    export class DrawIndexSource {
        public data: uint[] = null;

        public createBuffer(gl: GL): GLIndexBuffer {
            if (this.data && gl) {
                let buffer = new GLIndexBuffer(gl);
                buffer.upload(this.data, GLUsageType.STATIC_DRAW);
                return buffer;
            }

            return null;
        }
    }
}