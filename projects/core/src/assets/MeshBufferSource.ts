namespace Aurora {
    export class MeshBufferSource<T extends VertexSourceData> {
        public offset: uint = 0;
        public length: int = -1;

        public data: T;

        public getDataOffset(): uint {
            if (this.data) {
                if (this.data instanceof Array) {
                    const len = this.data.length;
                    return this.offset > len ? len : this.offset;
                }
            }
            return 0;
        }

        public getDataLength(): uint {
            if (this.data) {
                const numElements = this.data.length;

                if (this.offset > numElements) {
                    return 0;
                } else {
                    if (this.length < 0) {
                        return numElements - this.offset;
                    } else {
                        return this.offset + this.length > numElements ? numElements - this.offset : this.length;
                    }
                }
            }
            return 0;
        }
    }
}