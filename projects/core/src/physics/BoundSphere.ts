namespace Aurora {
    export class BoundSphere implements IBoundShape {
        public readonly center: Vector3 = Vector3.Zero;
        protected _radius: number;
        protected _radiusSquared: number;

        constructor(center: Vector3 = Vector3.Zero, radius: number = 1) {
            if (center) this.center.set(center);
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

            const rayOrigin = ray.origin;
            const rayDir = ray.direction;

            const dx = rayOrigin.x - this.center.x;
            const dy = rayOrigin.y - this.center.y;
            const dz = rayOrigin.z - this.center.z;

            const sub = dx * dx + dy * dy + dz * dz - this._radiusSquared;
            if ((cullFace === GLCullFace.BACK && sub < 0) ||
                (cullFace === GLCullFace.FRONT && sub > 0)) {
                rst.distance = -1;
            } else {
                const a = (rayDir.x * dx + rayDir.y * dy + rayDir.z * dz) * 2;
                let b = a * a - 4 * sub;

                if (b < 0) {
                    rst.distance = -1;
                } else {
                    b = Math.sqrt(b);

                    let t0 = b - a;
                    const t1 = -a - b;

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
                    const x = rayOrigin.x + rayDir.x * rst.distance - this.center.x;
                    const y = rayOrigin.y + rayDir.y * rst.distance - this.center.y;
                    const z = rayOrigin.z + rayDir.z * rst.distance - this.center.z;

                    rst.normal.setFromNumbers(x, y, z);
                }
            }

            return rst;
        }
    }
}