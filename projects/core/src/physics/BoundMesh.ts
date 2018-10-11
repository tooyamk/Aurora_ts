namespace Aurora {
    export class BoundMesh implements IBoundShape {
        public static readonly CRITICAL = Math.cos(Math.PI * 0.5);

        public assetStore: AssetsStore = null;

        constructor(assetStore: AssetsStore = null) {
            this.assetStore = assetStore;
        }

        public intersectRay(ray: Ray, cullFace: GLCullFace = GLCullFace.BACK, rst: RaycastHit = null): RaycastHit {
            rst = rst || new RaycastHit();

            let rayOrigin = ray.origin;
            let rayDir = ray.direction;

            let min = Number.POSITIVE_INFINITY;

            if (this.assetStore && this.assetStore.vertexSources && this.assetStore.drawIndexSource && this.assetStore.drawIndexSource.data) {
                let vs = this.assetStore.vertexSources.get(ShaderPredefined.a_Position0);
                if (vs) {
                    let vertices = vs.data;
                    if (vertices) {
                        vs = this.assetStore.vertexSources.get(ShaderPredefined.a_Normal0);
                        let normals = vs ? (vs.data ? vs.data : null) : null;
                        let indices = this.assetStore.drawIndexSource.data;

                        let length = indices.length;
                        for (let i = 0; i < length; ++i) {
                            let i0 = indices[i] * 3;
                            let i1 = indices[++i] * 3;
                            let i2 = indices[++i] * 3;

                            let v0x = vertices[i0];
                            let v0y = vertices[i0 + 1];
                            let v0z = vertices[i0 + 2];

                            let v1x = vertices[i1];
                            let v1y = vertices[i1 + 1];
                            let v1z = vertices[i1 + 2];

                            let v2x = vertices[i2];
                            let v2y = vertices[i2 + 1];
                            let v2z = vertices[i2 + 2];

                            let edge1x = v1x - v0x;
                            let edge1y = v1y - v0y;
                            let edge1z = v1z - v0z;

                            let edge2x = v2x - v0x;
                            let edge2y = v2y - v0y;
                            let edge2z = v2z - v0z;

                            let pvecx = rayDir.y * edge2z - rayDir.z * edge2y;
                            let pvecy = rayDir.z * edge2x - rayDir.x * edge2z;
                            let pvecz = rayDir.x * edge2y - rayDir.y * edge2x;

                            let det = edge1x * pvecx + edge1y * pvecy + edge1z * pvecz;

                            let tvecx: number, tvecy: number, tvecz: number;
                            if (det > 0) {
                                tvecx = rayOrigin.x - v0x;
                                tvecy = rayOrigin.y - v0y;
                                tvecz = rayOrigin.z - v0z;
                            } else {
                                tvecx = v0x - rayOrigin.x;
                                tvecy = v0y - rayOrigin.y;
                                tvecz = v0z - rayOrigin.z;

                                det = -det;
                            }

                            let t = NaN;

                            if (det < 0.0001) {
                                continue;
                            } else {
                                let u = tvecx * pvecx + tvecy * pvecy + tvecz * pvecz;
                                u /= det;

                                if (u < 0 || u > 1) {
                                    continue;
                                } else {
                                    let qvecx = tvecy * edge1z - tvecz * edge1y;
                                    let qvecy = tvecz * edge1x - tvecx * edge1z;
                                    let qvecz = tvecx * edge1y - tvecy * edge1x;

                                    let v = rayDir.x * qvecx + rayDir.y * qvecy + rayDir.z * qvecz;
                                    v /= det;

                                    if (v < 0 || u + v > 1) {
                                        continue;
                                    } else {
                                        t = edge2x * qvecx + edge2y * qvecy + edge2z * qvecz;
                                        if (t >= 0) {
                                            t /= det;

                                            if (t < min) {
                                                let nx = edge1y * edge2z - edge1z * edge2y;
                                                let ny = edge1z * edge2x - edge1x * edge2z;
                                                let nz = edge1x * edge2y - edge1y * edge2x;

                                                let lenSqr = nx * nx + ny * ny + nz * nz;
                                                if (lenSqr !== 1) {
                                                    lenSqr = Math.sqrt(lenSqr);
                                                    nx /= lenSqr;
                                                    ny /= lenSqr;
                                                    nz /= lenSqr;
                                                }

                                                if (cullFace !== GLCullFace.NONE) {
                                                    let dot = rayDir.x * nx + rayDir.y * ny + rayDir.z * nz;
                                                    if (cullFace === GLCullFace.BACK) {
                                                        if (dot > BoundMesh.CRITICAL) continue;
                                                    } else if (cullFace === GLCullFace.FRONT) {
                                                        if (dot < BoundMesh.CRITICAL) continue;
                                                    }
                                                }

                                                min = t;
                                                rst.normal.setFromNumbers(nx, ny, nz);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            rst.distance = min === Number.POSITIVE_INFINITY ? -1 : min;

            return rst;
        }
    }
}