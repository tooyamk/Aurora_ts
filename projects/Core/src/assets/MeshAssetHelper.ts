///<reference path="VertexSource.ts"/>
///<reference path="../math/MathUtils.ts"/>

namespace Aurora {
    export abstract class MeshAssetHelper {
        /**
         * @returns [0] = indices, [1] = vertices.
         */
        public static sortSameVertices(vertices: number[], precision: int = -1): [uint[], number[]] {
            const len = vertices.length;
            const count = (len / 3) | 0;

            const sorted: number[] = [];
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
                const mul = precision * 10;
                const div = 1 / mul;
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

            return [sorted, vert];
        }

        public static createLerpNormals(indices: uint[], vertices: number[], precision: int = -1): VertexSource {
            const vs = MeshAssetHelper.createNormals(indices, vertices);
            const sortResult = MeshAssetHelper.sortSameVertices(vertices, precision);
            const sortIndices = sortResult[0];

            const len = sortIndices.length;
            if (len > 0) {
                vertices = sortResult[1];
                const normals = vs.data;

                let beginIdx = 0;
                let idx = sortIndices[0];
                let x = vertices[idx];
                let y = vertices[++idx];
                let z = vertices[++idx];

                const lerpNormals = (endIdx: int) => {
                    let nx = 0, ny = 0, nz = 0;
                    for (let i = beginIdx; i <= endIdx; ++i) {
                        let idx = sortIndices[i];
                        nx += normals[idx];
                        ny += normals[++idx];
                        nz += normals[++idx];
                    }

                    const sqr = Math.sqrt(nx * nx + ny * ny + nz * nz);
                    if (sqr > MathUtils.ZERO_TOLERANCE) {
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
                    const x1 = vertices[idx];
                    const y1 = vertices[++idx];
                    const z1 = vertices[++idx];

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
            const len = vertices.length;

            const normals: number[] = [];
            normals.length = len;

            const multi: boolean[] = [];
            multi.length = len / 3;

            for (let i = 0, n = indices.length; i < n; ++i) {
                const idx0 = indices[i];
                const idx1 = indices[++i];
                const idx2 = indices[++i];

                let i0 = idx0 * 3;
                let i1 = idx1 * 3;
                let i2 = idx2 * 3;

                const x0 = vertices[i0];
                const y0 = vertices[i0 + 1];
                const z0 = vertices[i0 + 2];

                const x1 = vertices[i1];
                const y1 = vertices[i1 + 1];
                const z1 = vertices[i1 + 2];

                const x2 = vertices[i2];
                const y2 = vertices[i2 + 1];
                const z2 = vertices[i2 + 2];

                const abX = x1 - x0;
                const abY = y1 - y0;
                const abZ = z1 - z0;
                const acX = x2 - x0;
                const acY = y2 - y0;
                const acZ = z2 - z0;

                let nx = abY * acZ - abZ * acY;
                let ny = abZ * acX - abX * acZ;
                let nz = abX * acY - abY * acX;

                const sqr = Math.sqrt(nx * nx + ny * ny + nz * nz);
                if (sqr > MathUtils.ZERO_TOLERANCE) {
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

                    const x = normals[idx];
                    const y = normals[idx + 1];
                    const z = normals[idx + 2];

                    const sqr = Math.sqrt(x * x + y * y + z * z);
                    if (sqr > MathUtils.ZERO_TOLERANCE) {
                        normals[idx] = x / sqr;
                        normals[++idx] = y / sqr;
                        normals[++idx] = z / sqr;
                    }
                }
            }

            return new VertexSource(ShaderPredefined.a_Normal0, normals, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT);
        }

        public static transformVertices(m: Matrix44, src: number[], srcOffset: uint, srcLength: int, dst: number[], dstOffset: uint): void {
            srcLength = srcLength < 0 ? src.length : Math.min(srcOffset + srcLength, src.length);
            const p = new Vector3();
            let dstIdx = dstOffset;
            for (let i = srcOffset; i < srcLength; i += 3) {
                m.transform44XYZ(src[i], src[i + 1], src[i + 2], p);
                dst[dstIdx++] = p.x;
                dst[dstIdx++] = p.y;
                dst[dstIdx++] = p.z;
            }
        }
    }
}