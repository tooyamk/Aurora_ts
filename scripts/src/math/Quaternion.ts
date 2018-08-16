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
            this.x = quat.x;
            this.y = quat.y;
            this.z = quat.z;
            this.w = quat.w;
            return this;
        }

        /**
         * @param rst values are radian.
         */
        public getEuler(rst: Vector3 = null): Vector3 {
            rst = rst || new Vector3();

            rst.x = Math.atan2(2 * (this.w * this.x + this.y * this.z), (1 - 2 * (this.x * this.x + this.y * this.y)));
            rst.y = Math.asin(2 * (this.w * this.y - this.z * this.x));
            rst.z = Math.atan2(2 * (this.w * this.z + this.x * this.y), (1 - 2 * (this.y * this.y + this.z * this.z)));

            return rst;
        }

        public static createFromEulerX(radian: number, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            radian *= 0.5;

            rst.x = Math.sin(radian);
            rst.y = 0;
            rst.z = 0;
            rst.w = Math.cos(radian);

            return rst;
        }

        public static createFromEulerY(radian: number, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            radian *= 0.5;

            rst.x = 0;
            rst.y = Math.sin(radian);
            rst.z = 0;
            rst.w = Math.cos(radian);

            return rst;
        }

        public static createFromEulerZ(radian: number, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            radian *= 0.5;

            rst.x = 0;
            rst.y = 0;
            rst.z = Math.sin(radian);
            rst.w = Math.cos(radian);

            return rst;
        }

        public static createFromEulerXYZ(x: number = 0, y: number = 0, z: number = 0, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            x *= 0.5;
            y *= 0.5;
            z *= 0.5;

            let sinX = Math.sin(x);
            let cosX = Math.cos(x);
            let sinY = Math.sin(y);
            let cosY = Math.cos(y);
            let sinZ = Math.sin(z);
            let cosZ = Math.cos(z);

            let scXY = sinX * cosY;
            let csXY = cosX * sinY;
            let ccXY = cosX * cosY;
            let ssXY = sinX * sinY;

            rst.x = scXY * cosZ - csXY * sinZ;
            rst.y = csXY * cosZ + scXY * sinZ;
            rst.z = ccXY * sinZ - ssXY * cosZ;
            rst.w = ccXY * cosZ + ssXY * sinZ;

            return rst;
        }

        /**
		 * @param axis the axis is a normalize vector.
		 */
        public static createFromAxis(axis: Vector3, radian: number, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            radian *= 0.5;
            let s = Math.sin(radian);
            rst.x = -axis.x * s;
            rst.y = -axis.y * s;
            rst.z = -axis.z * s;
            rst.w = Math.cos(radian);

            return rst;
        }

        /**
         * @param t [0.0 - 1.0]
         */
        public static slerp(from: Quaternion, to: Quaternion, t: number, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            let w1 = to.w;
            let x1 = to.x;
            let y1 = to.y;
            let z1 = to.z;
            let cosOmega = from.w * w1 + from.x * x1 + from.y * y1 + from.z * z1;
            if (cosOmega < 0) {
                w1 = -w1;
                x1 = -x1;
                y1 = -y1;
                z1 = -z1;
                cosOmega = -cosOmega;
            }
            let k0: number, k1: number;
            if (cosOmega > 0.9999) {
                k0 = 1 - t;
                k1 = t;
            } else {
                let omega = Math.acos(cosOmega);
                let sinOmega = Math.sin(omega);
                k0 = Math.sin((1 - t) * omega) / sinOmega;
                k1 = Math.sin(t * omega) / sinOmega;
            }

            rst.x = from.x * k0 + x1 * k1;
            rst.y = from.y * k0 + y1 * k1;
            rst.z = from.z * k0 + z1 * k1;
            rst.w = from.w * k0 + w1 * k1;

            return rst;
        }

        public isEqual(toCompare: Quaternion, tolerance: number = 0.0): boolean {
            if (tolerance === 0.0) {
                return this.x === toCompare.x && this.y === toCompare.y && this.z === toCompare.z && this.w === toCompare.w;
            } else {
                if (tolerance < 0) tolerance = -tolerance;
                tolerance *= tolerance;
                let x = this.x - toCompare.x;
                let y = this.y - toCompare.y;
                let z = this.z - toCompare.z;
                let w = this.w - toCompare.w;

                return (x * x + y * y + z * z + w * w) <= tolerance;
            }
        }

        public clone(): Quaternion {
            return new Quaternion(this.x, this.y, this.z, this.w);
        }

        public prepend(quat: Quaternion, rst: Quaternion = null): void {
            quat.append(this, rst || this);
        }

        public append(quat: Quaternion, rst: Quaternion = null): void {
            let w1 = this.w * quat.w - this.x * quat.x - this.y * quat.y - this.z * quat.z;
            let x1 = this.w * quat.x + this.x * quat.w + this.y * quat.z - this.z * quat.y;
            let y1 = this.w * quat.y + this.y * quat.w + this.z * quat.x - this.x * quat.z;
            let z1 = this.w * quat.z + this.z * quat.w + this.x * quat.y - this.y * quat.x;

            rst = rst || this;
            rst.x = x1;
            rst.y = y1;
            rst.z = z1;
            rst.w = w1;
        }

        public rotateXYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            rst = rst || new Vector3();

            let w1 = -this.x * x - this.y * y - this.z * z;
            let x1 = this.w * x + this.y * z - this.z * y;
            let y1 = this.w * y - this.x * z + this.z * x;
            let z1 = this.w * z + this.x * y - this.y * x;

            rst.x = -w1 * this.x + x1 * this.w - y1 * this.z + z1 * this.y;
            rst.y = -w1 * this.y + x1 * this.z + y1 * this.w - z1 * this.x;
            rst.z = -w1 * this.z - x1 * this.y + y1 * this.x + z1 * this.w;

            return rst;
        }

        public rotateVector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.rotateXYZ(vec3.x, vec3.y, vec3.z, rst);
        }

        public toMatrix33(rst: Matrix44 = null): Matrix44 {
            let x2 = this.x * 2.0;
            let y2 = this.y * 2.0;
            let z2 = this.z * 2.0;
            let xx = this.x * x2;
            let xy = this.x * y2;
            let xz = this.x * z2;
            let yy = this.y * y2;
            let yz = this.y * z2;
            let zz = this.z * z2;
            let wx = this.w * x2;
            let wy = this.w * y2;
            let wz = this.w * z2;

            if (rst) {
                rst.m00 = 1 - yy - zz;
                rst.m01 = xy + wz;
                rst.m02 = xz - wy;

                rst.m10 = xy - wz;
                rst.m11 = 1 - xx - zz;
                rst.m12 = yz + wx;

                rst.m20 = xz + wy;
                rst.m21 = yz - wx;
                rst.m22 = 1 - xx - yy;
            } else {
                rst = new Matrix44(1 - yy - zz, xy + wz, xz - wy, 0, xy - wz, 1 - xx - zz, yz + wx, 0, xz + wy, yz - wx, 1 - xx - yy, 0);
            }

            return rst;
        }

        public toMatrix44(rst: Matrix44 = null): Matrix44 {
            rst = this.toMatrix33(rst);

            rst.m03 = 0;
            rst.m13 = 0;
            rst.m23 = 0;

            rst.m30 = 0;
            rst.m31 = 0;
            rst.m32 = 0;
            rst.m33 = 1;

            return rst;
        }
    }
}