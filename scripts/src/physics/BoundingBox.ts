namespace MITOIA {
    export class BoundingBox implements IBoundingShape {
        public readonly center: Vector3 = Vector3.Zero;
        public readonly size: Vector3 = Vector3.One;

        constructor(center: Vector3 = Vector3.Zero, size: Vector3 = Vector3.One) {
            if (center) this.center.setFromVector3(center);
            if (size) this.size.setFromVector3(size);
        }

        public intersectRay(ray: Ray, cullFace: GLCullFace = GLCullFace.BACK, rst: RaycastHit = null): RaycastHit {
            rst = rst || new RaycastHit();

            let rayOrigin = ray.origin;
            let rayDir = ray.direction;

            let halfX = this.size.x * 0.5;
            let halfY = this.size.x * 0.5;
            let halfZ = this.size.x * 0.5;

            let minX = this.center.x - halfX;
            let maxX = this.center.x + halfX;
            let minY = this.center.y - halfY;
            let maxY = this.center.y + halfY;
            let minZ = this.center.z - halfZ;
            let maxZ = this.center.z + halfZ;

            //if (rayOrigin.x >= minX && rayOrigin.x <= maxX && rayOrigin.y >= minY && rayOrigin.y <= maxY && rayOrigin.z >= minZ && rayOrigin.z <= maxZ) return 0;

            let t: number;
            let min: number = Number.POSITIVE_INFINITY;
            let ix: number, iy: number, iz: number;

            if (cullFace === GLCullFace.NONE || cullFace === GLCullFace.BACK) {
                if (rayOrigin.x <= minX && rayDir.x > 0) {
                    t = (minX - rayOrigin.x) / rayDir.x;
                    if (t >= 0 && t < min) {
                        iy = rayOrigin.y + rayDir.y * t;
                        if (iy >= minY && iy <= maxY) {
                            iz = rayOrigin.z + rayDir.z * t;
                            if (iz >= minZ && iz <= maxZ) {
                                min = t;
                                rst.normal.setFromXYZ(-1);
                            }
                        }
                    }
                }

                if (rayOrigin.x >= maxX && rayDir.x < 0) {
                    t = (maxX - rayOrigin.x) / rayDir.x;
                    if (t >= 0 && t < min) {
                        iy = rayOrigin.y + rayDir.y * t;
                        if (iy >= minY && iy <= maxY) {
                            iz = rayOrigin.z + rayDir.z * t;
                            if (iz >= minZ && iz <= maxZ) {
                                min = t;
                                rst.normal.setFromXYZ(1);
                            }
                        }
                    }
                }

                if (rayOrigin.y <= minY && rayDir.y > 0) {
                    t = (minY - rayOrigin.y) / rayDir.y;
                    if (t >= 0 && t < min) {
                        ix = rayOrigin.x + rayDir.x * t;
                        if (ix >= minX && ix <= maxX) {
                            iz = rayOrigin.z + rayDir.z * t;
                            if (iz >= minZ && iz <= maxZ) {
                                min = t;
                                rst.normal.setFromXYZ(0, -1);
                            }
                        }
                    }
                }

                if (rayOrigin.y >= maxY && rayDir.y < 0) {
                    t = (maxY - rayOrigin.y) / rayDir.y;
                    if (t >= 0 && t < min) {
                        ix = rayOrigin.x + rayDir.x * t;
                        if (ix >= minX && ix <= maxX) {
                            iz = rayOrigin.z + rayDir.z * t;
                            if (iz >= minZ && iz <= maxZ) {
                                min = t;
                                rst.normal.setFromXYZ(0, 1);
                            }
                        }
                    }
                }

                if (rayOrigin.z <= minZ && rayDir.z > 0) {
                    t = (minZ - rayOrigin.z) / rayDir.z;
                    if (t >= 0 && t < min) {
                        ix = rayOrigin.x + rayDir.x * t;
                        if (ix >= minX && ix <= maxX) {
                            iy = rayOrigin.y + rayDir.y * t;
                            if (iy >= minY && iy <= maxY) {
                                min = t;
                                rst.normal.setFromXYZ(0, 0, -1);
                            }
                        }
                    }
                }

                if (rayOrigin.z >= maxZ && rayDir.z < 0) {
                    t = (maxZ - rayOrigin.z) / rayDir.z;
                    if (t >= 0 && t < min) {
                        ix = rayOrigin.x + rayDir.x * t;
                        if (ix >= minX && ix <= maxX) {
                            iy = rayOrigin.y + rayDir.y * t;
                            if (iy >= minY && iy <= maxY) {
                                min = t;
                                rst.normal.setFromXYZ(0, 0, 1);
                            }
                        }
                    }
                }

                rst.distance = min === Number.POSITIVE_INFINITY ? -1 : min;
            }

            if (rst.distance < 0 && (cullFace === GLCullFace.NONE || cullFace === GLCullFace.FRONT)) {
                if (rayOrigin.x >= minX && rayDir.x < 0) {
                    t = (minX - rayOrigin.x) / rayDir.x;
                    if (t >= 0 && t < min) {
                        iy = rayOrigin.y + rayDir.y * t;
                        if (iy >= minY && iy <= maxY) {
                            iz = rayOrigin.z + rayDir.z * t;
                            if (iz >= minZ && iz <= maxZ) {
                                min = t;
                                rst.normal.setFromXYZ(-1);
                            }
                        }
                    }
                }

                if (rayOrigin.x <= maxX && rayDir.x > 0) {
                    t = (maxX - rayOrigin.x) / rayDir.x;
                    if (t >= 0 && t < min) {
                        iy = rayOrigin.y + rayDir.y * t;
                        if (iy >= minY && iy <= maxY) {
                            iz = rayOrigin.z + rayDir.z * t;
                            if (iz >= minZ && iz <= maxZ) {
                                min = t;
                                rst.normal.setFromXYZ(1);
                            }
                        }
                    }
                }

                if (rayOrigin.y >= minY && rayDir.y < 0) {
                    t = (minY - rayOrigin.y) / rayDir.y;
                    if (t >= 0 && t < min) {
                        ix = rayOrigin.x + rayDir.x * t;
                        if (ix >= minX && ix <= maxX) {
                            iz = rayOrigin.z + rayDir.z * t;
                            if (iz >= minZ && iz <= maxZ) {
                                min = t;
                                rst.normal.setFromXYZ(0, -1);
                            }
                        }
                    }
                }

                if (rayOrigin.y <= maxY && rayDir.y > 0) {
                    t = (maxY - rayOrigin.y) / rayDir.y;
                    if (t >= 0 && t < min) {
                        ix = rayOrigin.x + rayDir.x * t;
                        if (ix >= minX && ix <= maxX) {
                            iz = rayOrigin.z + rayDir.z * t;
                            if (iz >= minZ && iz <= maxZ) {
                                min = t;
                                rst.normal.setFromXYZ(0, 1);
                            }
                        }
                    }
                }

                if (rayOrigin.z >= minZ && rayDir.z < 0) {
                    t = (minZ - rayOrigin.z) / rayDir.z;
                    if (t >= 0 && t < min) {
                        ix = rayOrigin.x + rayDir.x * t;
                        if (ix >= minX && ix <= maxX) {
                            iy = rayOrigin.y + rayDir.y * t;
                            if (iy >= minY && iy <= maxY) {
                                min = t;
                                rst.normal.setFromXYZ(0, 0, -1);
                            }
                        }
                    }
                }

                if (rayOrigin.z <= maxZ && rayDir.z > 0) {
                    t = (maxZ - rayOrigin.z) / rayDir.z;
                    if (t >= 0 && t < min) {
                        ix = rayOrigin.x + rayDir.x * t;
                        if (ix >= minX && ix <= maxX) {
                            iy = rayOrigin.y + rayDir.y * t;
                            if (iy >= minY && iy <= maxY) {
                                min = t;
                                rst.normal.setFromXYZ(0, 0, 1);
                            }
                        }
                    }
                }

                rst.distance = min === Number.POSITIVE_INFINITY ? -1 : min;
            }

            return rst;
        }
    }
}