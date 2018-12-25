///<reference path="MeshBufferSource.ts"/>

namespace Aurora {
    export class DrawIndexSource extends MeshBufferSource<IndexSourceData> {
        public type: GLIndexDataType;
        public usage: GLUsageType;

        constructor(data: IndexSourceData = null, type: GLIndexDataType = GLIndexDataType.AUTO, usage: GLUsageType = GLUsageType.STATIC_DRAW) {
            super();
            
            this.data = data;
            this.type = type;
            this.usage = usage;
        }

        public triangulate(polygons: IndexSourceData): void {
            if (this.data && polygons) {
                const src = this.data;
                const newData: uint[] = [];
                let srcIdx = 0, newIdx = 0;
                for (let i = 0, n = polygons.length; i < n; ++i) {
                    const n = polygons[i] | 0;
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

                if (this.data instanceof Array) {
                    this.data = newData;
                } else {
                    let maxVertices = 0;
                    for (let i = 0, n = src.length; i < n; ++i) {
                        const idx = src[i];
                        if (maxVertices < idx) maxVertices = idx;
                    }
                    const info = MeshAssetHelper.createBinaryDrawIndexSourceData(newData.length, maxVertices === 0 ? 0 : maxVertices + 1);
                    this.data = info[0];
                    this.type = info[1];
                }
            }
        }

        public invert(): void {
            if (this.data) {
                const src = this.data;
                for (let i = 1, n = src.length; i < n; i += 3) {
                    const idx = src[i];
                    src[i] = src[i + 1];
                    src[i + 1] = idx;
                }
            }
        }

        public createBuffer(gl: GL): GLIndexBuffer {
            if (this.data && gl) {
                const buffer = new GLIndexBuffer(gl);
                buffer.upload(this.data, this.offset, this.length, this.type, this.usage);
                return buffer;
            }

            return null;
        }
    }
}