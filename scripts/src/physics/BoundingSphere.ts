namespace MITOIA {
    export class BoundingSphere implements IBoundingShape {
        public readonly center: Vector3 = Vector3.Zero;
        protected _radius: number;

        protected _radiusSquared: number;

        constructor(center: Vector3 = Vector3.Zero, radius: number = 1.0) {
            if (center) this.center.setFromVector3(center);
            this._radius = radius;
            this._radiusSquared = radius * radius;
        }

        public get radius(): number {
            return this._radius;
        }

        public set radius(r: number) {
            if (this._radius !== r) {
                this._radius = r;
                this._radiusSquared = r * r;
            }
        }

        public intersectRay(ray: Ray, cullFace: GLCullFace = GLCullFace.BACK, rst: RaycastHit = null): RaycastHit {
            rst = rst || new RaycastHit();

            let rayOrigin = ray.origin;
            let rayDir = ray.direction;

            let dx = rayOrigin.x - this.center.x;
            let dy = rayOrigin.y - this.center.y;
            let dz = rayOrigin.z - this.center.z;

            let sub = dx * dx + dy * dy + dz * dz - this._radiusSquared;
            if ((cullFace === GLCullFace.BACK && sub < 0) ||
                (cullFace === GLCullFace.FRONT && sub > 0)) {
                rst.distance = -1;
            } else {
                let a = (rayDir.x * dx + rayDir.y * dy + rayDir.z * dz) * 2;
                let b = a * a - 4 * sub;

                if (b < 0) {
                    rst.distance = -1;
                } else {
                    b = Math.sqrt(b);

                    let t0 = b - a;
                    let t1 = -a - b;

                    if (t0 >= 0) {
                        if (t1 >= 0) {
                            if (t1 < t0) t0 = t1;
                            rst.distance = t0 * 0.5;
                        } else {
                            rst.distance = t0 * 0.5;
                        }
                    } else if (t1 >= 0) {
                        rst.distance = t1 * 0.5;
                    } else {
                        rst.distance = -1;
                    }
                }

                if (rst.distance >= 0) {
                    let x = rayOrigin.x + rayDir.x * rst.distance - this.center.x;
                    let y = rayOrigin.y + rayDir.y * rst.distance - this.center.y;
                    let z = rayOrigin.z + rayDir.z * rst.distance - this.center.z;

                    rst.normal.setFromXYZ(x, y, z);
                }
            }

            return rst;
        }
    }
}