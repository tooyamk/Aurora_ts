namespace MITOIA {
    export interface SortSameVerticesResult {
        indices: uint[];
        vertices: number[];
    }

    export abstract class MeshAssetHelper {
        public static sortSameVertices(vertices: number[], precision: int = -1): SortSameVerticesResult {
            let len = vertices.length;
            let count = (len / 3) | 0;

            let sorted: number[] = [];
            sorted.length = count;

            for (let i = 0; i < count; ++i) sorted[i] = i * 3;

            let vert: number[] = null;
            precision |= 0;
            if (precision === 0) {
                vert = [];
                vert.length = len;
                for (let i = 0; i < len; ++i) {
                    vert[i] = vertices[i] | 0;
                    ++i;
                    vert[i] = vertices[i] | 0;
                    ++i;
                    vert[i] = vertices[i] | 0;
                }
            } else if (precision > 0) {
                vert = [];
                vert.length = len;
                let mul = precision * 10;
                let div = 1 / mul;
                for (let i = 0; i < len; ++i) {
                    vert[i] = ((vertices[i] * mul) | 0) * div;
                    ++i;
                    vert[i] = ((vertices[i] * mul) | 0) * div;
                    ++i;
                    vert[i] = ((vertices[i] * mul) | 0) * div;
                }
            }
            if (!vert) vert = vertices;

            let v0: number, v1: number;
            Sort.Merge.sort(sorted, (a: number, b: number) => {
                v0 = vert[a];
                v1 = vert[b];

                if (v0 < v1) {
                    return true;
                } else if (v0 > v1) {
                    return false;
                } else {
                    v0 = vert[++a];
                    v1 = vert[++b];
                    if (v0 < v1) {
                        return true;
                    } else if (v0 > v1) {
                        return false;
                    } else {
                        v0 = vert[++a];
                        v1 = vert[++b];
                        return v0 < v1;
                    }
                }
            });

            return { indices: sorted, vertices: vert };
        }

        public static createLerpNormals(indices: uint[], vertices: number[], precision: int = -1): VertexSource {
            let vs = MeshAssetHelper.createNormals(indices, vertices);
            let sortResult = MeshAssetHelper.sortSameVertices(vertices, precision);
            let sortIndices = sortResult.indices;

            let len = sortIndices.length;
            if (len > 0) {
                vertices = sortResult.vertices;
                let normals = vs.data;

                let beginIdx = 0;
                let idx = sortIndices[0];
                let x = vertices[idx];
                let y = vertices[++idx];
                let z = vertices[++idx];

                let lerpNormals = (endIdx: int) => {
                    let nx = 0, ny = 0, nz = 0;
                    for (let i = beginIdx; i <= endIdx; ++i) {
                        let idx = sortIndices[i];
                        nx += normals[idx];
                        ny += normals[++idx];
                        nz += normals[++idx];
                    }

                    let sqr = Math.sqrt(nx * nx + ny * ny + nz * nz);
                    if (sqr !== 0) {
                        nx /= sqr;
                        ny /= sqr;
                        nz /= sqr;
                        for (let i = beginIdx; i <= endIdx; ++i) {
                            let idx = sortIndices[i];
                            normals[idx] = nx;
                            normals[++idx] = ny;
                            normals[++idx] = nz;
                        }
                    }
                }

                for (let i = 1; i < len; ++i) {
                    idx = sortIndices[i];
                    let x1 = vertices[idx];
                    let y1 = vertices[++idx];
                    let z1 = vertices[++idx];

                    if (x !== x1 || y !== y1 || z !== z1) {
                        if (beginIdx < i - 1) lerpNormals(i - 1);

                        beginIdx = i;
                        x = x1;
                        y = y1;
                        z = z1;
                    }
                }

                if (beginIdx < len - 1) lerpNormals(len - 1);
            }

            return vs;
        }

        public static createNormals(indices: uint[], vertices: number[]): VertexSource {
            let len = vertices.length;

            let normals: number[] = [];
            normals.length = len;

            let multi: boolean[] = [];
            multi.length = len / 3;

            var map: Object = {};

            for (let i = 0, n = indices.length; i < n; ++i) {
                let idx0 = indices[i];
                let idx1 = indices[++i];
                let idx2 = indices[++i];

                let i0 = idx0 * 3;
                let i1 = idx1 * 3;
                let i2 = idx2 * 3;

                let x0 = vertices[i0];
                let y0 = vertices[i0 + 1];
                let z0 = vertices[i0 + 2];

                let x1 = vertices[i1];
                let y1 = vertices[i1 + 1];
                let z1 = vertices[i1 + 2];

                let x2 = vertices[i2];
                let y2 = vertices[i2 + 1];
                let z2 = vertices[i2 + 2];

                let abX = x1 - x0;
                let abY = y1 - y0;
                let abZ = z1 - z0;
                let acX = x2 - x0;
                let acY = y2 - y0;
                let acZ = z2 - z0;

                let nx = abY * acZ - abZ * acY;
                let ny = abZ * acX - abX * acZ;
                let nz = abX * acY - abY * acX;

                let sqr = Math.sqrt(nx * nx + ny * ny + nz * nz);
                if (sqr !== 0) {
                    nx /= sqr;
                    ny /= sqr;
                    nz /= sqr;
                }

                if (normals[i0] === undefined) {
                    normals[i0] = nx;
                    normals[++i0] = ny;
                    normals[++i0] = nz;
                } else {
                    multi[idx0] = true;
                    normals[i0] += nx;
                    normals[++i0] += ny;
                    normals[++i0] += nz;
                }
                if (normals[i1] === undefined) {
                    normals[i1] = nx;
                    normals[++i1] = ny;
                    normals[++i1] = nz;
                } else {
                    multi[idx1] = true;
                    normals[i1] += nx;
                    normals[++i1] += ny;
                    normals[++i1] += nz;
                }

                if (normals[i2] === undefined) {
                    normals[i2] = nx;
                    normals[++i2] = ny;
                    normals[++i2] = nz;
                } else {
                    multi[idx2] = true;
                    normals[i2] += nx;
                    normals[++i2] += ny;
                    normals[++i2] += nz;
                }
            }

            for (let i = 0, n = multi.length; i < n; ++i) {
                if (multi[i]) {
                    let idx = i * 3;

                    let x = normals[idx];
                    let y = normals[idx + 1];
                    let z = normals[idx + 2];

                    let sqr = Math.sqrt(x * x + y * y + z * z);
                    if (sqr !== 0) {
                        normals[idx] = x / sqr;
                        normals[++idx] = y / sqr;
                        normals[++idx] = z / sqr;
                    }
                }
            }

            return new VertexSource(ShaderPredefined.a_Normal, normals, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT);
        }
    }
}