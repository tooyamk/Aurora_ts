namespace MITOIA {
    export class Quaternion {
        public static readonly ConstZero: Quaternion = new Quaternion();

        public x: number;
        public y: number;
        public z: number;
        public w: number;

        constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }

        public static get Zero(): Quaternion {
            return new Quaternion();
        }

        public setFromXYZW(x: number = 0, y: number = 0, z: number = 0, w: number = 1): Quaternion {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;

            return this;
        }

        public setFromQuaternion(quat: Quaternion): Quaternion {
            return this.setFromXYZW(quat.x, quat.y, quat.z, quat.w);
        }

        public clone(): Quaternion {
            return new Quaternion(this.x, this.y, this.z, this.w);
        }

        public prepend(quat: Quaternion, rst: Quaternion = null): void {
            quat.append(this, rst || this);
        }

        public append(quat: Quaternion, rst: Quaternion = null): void {
            var w1: number = this.w * quat.w - this.x * quat.x - this.y * quat.y - this.z * quat.z;
            var x1: number = this.w * quat.x + this.x * quat.w + this.y * quat.z - this.z * quat.y;
            var y1: number = this.w * quat.y + this.y * quat.w + this.z * quat.x - this.x * quat.z;
            var z1: number = this.w * quat.z + this.z * quat.w + this.x * quat.y - this.y * quat.x;

            rst = rst || this;
            rst.x = x1;
            rst.y = y1;
            rst.z = z1;
            rst.w = w1;
        }

        public rotateXYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            rst = rst || new Vector3();

            let w1: number = -this.x * x - this.y * y - this.z * z;
            let x1: number = this.w * x + this.y * z - this.z * y;
            let y1: number = this.w * y - this.x * z + this.z * x;
            let z1: number = this.w * z + this.x * y - this.y * x;

            rst.x = -w1 * this.x + x1 * this.w - y1 * this.z + z1 * this.y;
            rst.y = -w1 * this.y + x1 * this.z + y1 * this.w - z1 * this.x;
            rst.z = -w1 * this.z - x1 * this.y + y1 * this.x + z1 * this.w;

            return rst;
        }

        public rotateVector3(vec3: Vector3): Vector3 {
            return this.rotateXYZ(vec3.x, vec3.y, vec3.z, vec3);
        }

        public toMatrix(rst: Matrix44 = null): Matrix44 {
            let x2: number = this.x * 2.0;
            let y2: number = this.y * 2.0;
            let z2: number = this.z * 2.0;
            let xx: number = this.x * x2;
            let xy: number = this.x * y2;
            let xz: number = this.x * z2;
            let yy: number = this.y * y2;
            let yz: number = this.y * z2;
            let zz: number = this.z * z2;
            let wx: number = this.w * x2;
            let wy: number = this.w * y2;
            let wz: number = this.w * z2;

            if (rst) {
                rst.m00 = 1 - yy - zz;
                rst.m01 = xy + wz;
                rst.m02 = xz - wy;
                rst.m03 = 0;

                rst.m10 = xy - wz;
                rst.m11 = 1 - xx - zz;
                rst.m12 = yz + wx;
                rst.m13 = 0;

                rst.m20 = xz + wy;
                rst.m21 = yz - wx;
                rst.m22 = 1 - xx - yy;
                rst.m23 = 0;

                rst.m30 = 0;
                rst.m31 = 0;
                rst.m32 = 0;
                rst.m33 = 1;
            } else {
                rst = new Matrix44(1 - yy - zz, xy + wz, xz - wy, 0, xy - wz, 1 - xx - zz, yz + wx, 0, xz + wy, yz - wx, 1 - xx - yy, 0);
            }

            return rst;
        }
    }
}