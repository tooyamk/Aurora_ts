namespace Aurora {
    export class MeshBufferSource<T> {
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
                if (this.data instanceof Array) {
                    const len = this.data.length;
                    if (this.offset > len) {
                        return 0;
                    } else {
                        if (this.length < 0) {
                            return len - this.offset;
                        } else {
                            return this.offset + this.length > len ? len - this.offset : this.length;
                        }
                    }
                }
            }
            return 0;
        }
    }
}