///<reference path="BoundMesh.ts" />
///<reference path="RaycastHit.ts" />
///<reference path="../nodes/components/Collider.ts" />

namespace Aurora {
    export class Ray {
        public readonly origin: Vector3 = Vector3.Zero;
        public readonly direction: Vector3 = Vector3.Front;

        constructor(origin: Vector3 = Vector3.Zero, direction: Vector3 = Vector3.Front) {
            if (origin) this.origin.set(origin);
            if (direction) this.direction.set(direction);
        }

        public clone(): Ray {
            return new Ray(this.origin.clone(), this.direction.clone());
        }

        public transform34(m: Matrix44, rst: Ray = null): Ray {
            rst = rst || this;

            m.transform34Vector3(this.origin, rst.origin);
            m.transform33Vector3(this.direction, rst.direction);

            return rst;
        }

        /**
         * @param normal normalized
         */
        public castPlane(planePoint: Vector3, planeNormal: Vector3, cullFace: GLCullFace = GLCullFace.BACK, rst: RaycastHit = null): RaycastHit {
            if (rst) {
                rst.clear();
            } else {
                rst = new RaycastHit();
            }

            let dot = Vector3.dot(this.direction, planeNormal);
            if (cullFace !== GLCullFace.NONE) {
                if (cullFace === GLCullFace.BACK) {
                    if (dot > BoundMesh.CRITICAL) return rst;
                } else if (cullFace === GLCullFace.FRONT) {
                    if (dot < BoundMesh.CRITICAL) return rst;
                }
            }

            let t = (Vector3.dot(planePoint, planeNormal) - Vector3.dot(this.origin, planeNormal)) / dot;
            if (t >= 0) {
                rst.distance = t;
                rst.distanceSquared = t * t;
                rst.normal.set(planeNormal);
            }

            return rst;
        }

        public cast(root: Node3D, layerMask: uint = 0x7FFFFFFF, cullFace: GLCullFace = GLCullFace.BACK, rst: RaycastHit = null): RaycastHit {
            if (rst) {
                rst.clear();
            } else {
                rst = new RaycastHit();
            }

            if (root) {
                let ray = this.clone();
                let hit = new RaycastHit();
                let vec3 = new Vector3();
                let arr: Collider[] = [];
                this._castNode(root, layerMask, ray, cullFace, rst, hit, vec3, arr);

                if (rst.collider) {
                    rst.distance = Math.sqrt(rst.distanceSquared);
                    rst.normal.normalize();
                    rst.collider.node.readonlyWorldMatrix.transform33Vector3(rst.normal, rst.normal);
                }
            }

            return rst;
        }

        private _castNode(node: Node3D, layerMask: uint, ray: Ray, cullFace: GLCullFace, rstHit: RaycastHit, tmpHit: RaycastHit, tmpVec3: Vector3, tmpArr: Collider[]): void {
            if (node.active && node.layer & layerMask) {
                let num = node.getComponentsByType(Collider, true, tmpArr);
                for (let i = 0; i < num; ++i) {
                    let collider = tmpArr[i];
                    if (collider.shape) {
                        this.transform34(node.readonlyInverseWorldMatrix, ray);
                        collider.shape.intersectRay(ray, cullFace, tmpHit);
                        if (tmpHit.distance >= 0) {
                            let x = ray.direction.x * tmpHit.distance;
                            let y = ray.direction.y * tmpHit.distance;
                            let z = ray.direction.z * tmpHit.distance;

                            node.readonlyWorldMatrix.transform34XYZ(x, y, z, tmpVec3);

                            x = tmpVec3.x - this.origin.x;
                            y = tmpVec3.y - this.origin.y;
                            z = tmpVec3.z - this.origin.z;
                            let disSqr = x * x + y * y + z * z;

                            if (!rstHit.collider || rstHit.distanceSquared > disSqr) {
                                rstHit.collider = collider;
                                rstHit.distanceSquared = disSqr;
                                rstHit.normal.set(tmpHit.normal);
                            }
                        }
                    }
                }
            }

            let child = node._childHead;
            while (child) {
                this._castNode(child, layerMask, ray, cullFace, rstHit, tmpHit, tmpVec3, tmpArr);
                child = child._next;
            }
        }
    }
}