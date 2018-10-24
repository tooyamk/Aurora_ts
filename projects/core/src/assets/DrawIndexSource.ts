namespace Aurora {
    export class DrawIndexSource {
        public data: uint[];
        public type: GLIndexDataType;
        public usage: GLUsageType;

        constructor(data: uint[] = null, type: GLIndexDataType = GLIndexDataType.AUTO, usage: GLUsageType = GLUsageType.STATIC_DRAW) {
            this.data = data;
            this.type = type;
            this.usage = usage;
        }

        public triangulate(polygons: uint[]): void {
            if (this.data && polygons) {
                let src = this.data;
                let newData: uint[] = [];
                let srcIdx = 0, newIdx = 0;
                for (let i = 0, n = polygons.length; i < n; ++i) {
                    let n = polygons[i] | 0;
                    switch (n) {
                        case 0:
                            break;
                        case 1: {
                            newData[newIdx++] = src[srcIdx];
                            newData[newIdx++] = src[srcIdx];
                            newData[newIdx++] = src[srcIdx++];

                            break;
                        }
                        case 2: {
                            newData[newIdx++] = src[srcIdx++];
                            newData[newIdx++] = src[srcIdx];
                            newData[newIdx++] = src[srcIdx++];

                            break;
                        }
                        case 3: {
                            newData[newIdx++] = src[srcIdx++];
                            newData[newIdx++] = src[srcIdx++];
                            newData[newIdx++] = src[srcIdx++];
                            
                            break;
                        }
                        default: {
                            if (n > 3) {
                                let idx = srcIdx;
                                newData[newIdx++] = src[idx];
                                newData[newIdx++] = src[idx + 1];
                                newData[newIdx++] = src[idx + 2];

                                for (let j = 1, nn = n - 2; j < nn; ++j) {
                                    newData[newIdx++] = src[idx];
                                    newData[newIdx++] = src[idx + j + 1];
                                    newData[newIdx++] = src[idx + j + 2];
                                }

                                srcIdx += n;
                            }

                            break;
                        }
                    }
                }
                this.data = newData;
            }
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