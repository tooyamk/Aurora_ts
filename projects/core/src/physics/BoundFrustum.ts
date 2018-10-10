namespace Aurora {
    export class BoundFrustum {
        public readonly left: Vector4 = new Vector4();
        public readonly right: Vector4 = new Vector4();
        public readonly far: Vector4 = new Vector4();
        public readonly near: Vector4 = new Vector4();
        public readonly top: Vector4 = new Vector4();
        public readonly bottom: Vector4 = new Vector4();
        
        constructor(m: Matrix44 = null) {
            if (m) this.matrix = m;
        }

        /**
         * If test vertex in local space, matrix = world to proj Matrix.
         * 
         * If test vertex in world space, matrix = view to proj Matrix.
         * 
         * If test vertex in view space, matrix = projMatrix.
         */
        public set matrix(m: Matrix44) {
            let x = m.m03 - m.m00;
            let y = m.m13 - m.m10;
            let z = m.m23 - m.m20;
            let w = m.m33 - m.m30;
            let t = Math.sqrt(x * x + y * y + z * z);
            this.right.setFromNumbers(x / t, y / t, z / t, w / t);

            x = m.m03 + m.m00;
            y = m.m13 + m.m10;
            z = m.m23 + m.m20;
            w = m.m33 + m.m30;
            t = Math.sqrt(x * x + y * y + z * z);
            this.left.setFromNumbers(x / t, y / t, z / t, w / t);

            x = m.m03 - m.m01;
            y = m.m13 - m.m11;
            z = m.m23 - m.m21;
            w = m.m33 - m.m31;
            t = Math.sqrt(x * x + y * y + z * z);
            this.top.setFromNumbers(x / t, y / t, z / t, w / t);

            x = m.m03 + m.m01;
            y = m.m13 + m.m11;
            z = m.m23 + m.m21;
            w = m.m33 + m.m31;
            t = Math.sqrt(x * x + y * y + z * z);
            this.bottom.setFromNumbers(x / t, y / t, z / t, w / t);

            x = m.m03 - m.m02;
            y = m.m13 - m.m12;
            z = m.m23 - m.m22;
            w = m.m33 - m.m32;
            t = Math.sqrt(x * x + y * y + z * z);
            this.far.setFromNumbers(x / t, y / t, z / t, w / t);

            x = m.m03 + m.m02;
            y = m.m13 + m.m12;
            z = m.m23 + m.m22;
            w = m.m33 + m.m32;
            t = Math.sqrt(x * x + y * y + z * z);
            this.near.setFromNumbers(x / t, y / t, z / t, w / t);
        }

        public static pointToFaceDistance(face: Vector4, p: Vector3): number {
            return face.dotVector3(p);
        }

        public isContainmentPoint(p: Vector3): boolean {
            if (BoundFrustum.pointToFaceDistance(this.right, p) <= 0) {
                return false;
            } else if (BoundFrustum.pointToFaceDistance(this.left, p) <= 0) {
                return false;
            } else if (BoundFrustum.pointToFaceDistance(this.top, p)<= 0) {
                return false;
            } else if (BoundFrustum.pointToFaceDistance(this.bottom, p) <= 0) {
                return false;
            } else if (BoundFrustum.pointToFaceDistance(this.far, p) <= 0) {
                return false;
            } else if (BoundFrustum.pointToFaceDistance(this.near, p) <= 0) {
                return false;
            }

            return true;
        }

        public isContainmentBox(min: Vector3, max: Vector3): ContainmentType {
            let side: int = 0;

            let state = BoundFrustum._isContainmentBox(this.right, min, max);
            if (state > 0) {
                if (state == 8) ++side;
                state = BoundFrustum._isContainmentBox(this.left, min, max);
                if (state > 0) {
                    if (state == 8) ++side;
                    state = BoundFrustum._isContainmentBox(this.top, min, max);
                    if (state > 0) {
                        if (state == 8) ++side;
                        state = BoundFrustum._isContainmentBox(this.bottom, min, max);
                        if (state > 0) {
                            if (state == 8) ++side;
                            state = BoundFrustum._isContainmentBox(this.far, min, max);
                            if (state > 0) {
                                if (state == 8) ++side;
                                state = BoundFrustum._isContainmentBox(this.near, min, max);
                                if (state == 8) ++side;
                            }
                        }
                    }
                }
            }

            return state > 0 ? (side == 6 ? ContainmentType.CONTAINS : ContainmentType.INTERSECTS): ContainmentType.DISJOINT;
        }

        private static _isContainmentBox(face: Vector4, min: Vector3, max: Vector3): int {
            let state = 0;

            let x1 = face.x * min.x + face.w;
            let x2 = face.x * max.x + face.w;
            let y1 = face.y * min.y;
            let y2 = face.y * max.y;
            let z1 = face.z * min.z;
            let z2 = face.z * max.z;

            if (x1 + y1 + z1 >= 0) state++;
            if (x2 + y1 + z1 >= 0) state++;
            if (x1 + y2 + z1 >= 0) state++;
            if (x2 + y2 + z1 >= 0) state++;
            if (x1 + y1 + z2 >= 0) state++;
            if (x2 + y1 + z2 >= 0) state++;
            if (x1 + y2 + z2 >= 0) state++;
            if (x2 + y2 + z2 >= 0) state++;

            return state;
        }

        public isContainmentSphere(p: Vector3, radius: number): ContainmentType {
            let state = 0;
            let side = 0;

            let d = BoundFrustum.pointToFaceDistance(this.right, p);
            if (d > -radius) {
                if (d > radius) ++side;
                d = BoundFrustum.pointToFaceDistance(this.left, p);
                if (d > -radius) {
                    if (d > radius) ++side;
                    d = BoundFrustum.pointToFaceDistance(this.top, p);
                    if (d > -radius) {
                        if (d > radius) ++side;
                        d = BoundFrustum.pointToFaceDistance(this.bottom, p);
                        if (d > -radius) {
                            if (d > radius) ++side;
                            d = BoundFrustum.pointToFaceDistance(this.far, p);
                            if (d > -radius) {
                                if (d > radius) ++side;
                                d = BoundFrustum.pointToFaceDistance(this.near, p);
                                if (d > -radius && d > radius) ++side;
                            }
                        }
                    }
                }
            }

            return state > 0 ? (side == 6 ? ContainmentType.CONTAINS : ContainmentType.INTERSECTS) : ContainmentType.DISJOINT;
        }
    }
}