namespace Aurora {
    export class Quaternion {
        public static readonly CONST_IDENTITY: Quaternion = new Quaternion();

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

        public get length(): number {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        }

        public get lengthSq(): number {
            return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
        }

        public setFromNumbers(x: number = 0, y: number = 0, z: number = 0, w: number = 1): Quaternion {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;

            return this;
        }

        public setFromArray(numbers: number[], offset: int = 0): Quaternion {
            this.x = numbers[offset];
            this.y = numbers[offset + 1];
            this.z = numbers[offset + 2];
            this.w = numbers[offset + 3];

            return this;
        }

        public set(q: Quaternion): Quaternion {
            this.x = q.x;
            this.y = q.y;
            this.z = q.z;
            this.w = q.w;

            return this;
        }

        public invert(rst: Quaternion = null): Quaternion {
            return rst ? rst.setFromNumbers(-this.x, -this.y, -this.z, this.w) : new Quaternion(-this.x, -this.y, -this.z, this.w);
            /*
            rst = rst || this;

            let dot = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
            let invDot = dot > MathUtils.ZERO_TOLERANCE ? 1 / dot : 0;

            rst.x = -this.x * invDot;
            rst.y = -this.y * invDot;
            rst.z = -this.z * invDot;
            rst.w = this.w * invDot;

            return rst;
            */
        }

        /**
         * @param rst values are radian.
         */
        public toEuler(rst: Vector3 = null): Vector3 {
            rst = rst || new Vector3();

            const y2 = this.y * this.y;
            rst.x = Math.atan2(2 * (this.w * this.x + this.y * this.z), (1 - 2 * (this.x * this.x + y2)));
            rst.y = Math.asin(2 * (this.w * this.y - this.z * this.x));
            rst.z = Math.atan2(2 * (this.w * this.z + this.x * this.y), (1 - 2 * (y2 + this.z * this.z)));

            return rst;
        }

        public normalize(): Quaternion {
            const len = 1 / this.length;
            this.x *= len;
            this.y *= len;
            this.z *= len;
            this.w *= len;

            return this;
        }

        public static createFromEulerX(radian: number, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            radian *= 0.5;

            return rst.setFromNumbers(Math.sin(radian), 0, 0, Math.cos(radian));
        }

        public static createFromEulerY(radian: number, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            radian *= 0.5;

            return rst.setFromNumbers(0, Math.sin(radian), 0, Math.cos(radian));
        }

        public static createFromEulerZ(radian: number, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            radian *= 0.5;

            return rst.setFromNumbers(0, 0, Math.sin(radian), Math.cos(radian));
        }

        public static createFromEulerXYZ(x: number = 0, y: number = 0, z: number = 0, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            x *= 0.5;
            y *= 0.5;
            z *= 0.5;

            const sinX = Math.sin(x);
            const cosX = Math.cos(x);
            const sinY = Math.sin(y);
            const cosY = Math.cos(y);
            const sinZ = Math.sin(z);
            const cosZ = Math.cos(z);

            const scXY = sinX * cosY;
            const csXY = cosX * sinY;
            const ccXY = cosX * cosY;
            const ssXY = sinX * sinY;

            rst.x = scXY * cosZ - csXY * sinZ;
            rst.y = csXY * cosZ + scXY * sinZ;
            rst.z = ccXY * sinZ - ssXY * cosZ;
            rst.w = ccXY * cosZ + ssXY * sinZ;

            return rst;
        }

        public static createFromEulerVector3(angles: Vector3, rst: Quaternion = null): Quaternion {
            return Quaternion.createFromEulerXYZ(angles.x, angles.y, angles.z, rst);
        }
    
        /**
		 * @param axis the axis is a normalize vector.
		 */
        public static createFromAxis(axis: Vector3, radian: number, rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            radian *= 0.5;
            const s = Math.sin(radian);

            return rst.setFromNumbers(-axis.x * s, -axis.y * s, -axis.z * s, Math.cos(radian));
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
                const omega = Math.acos(cosOmega);
                const sinOmega = Math.sin(omega);
                const to = t * omega;
                k0 = Math.sin(omega - to) / sinOmega;
                k1 = Math.sin(to) / sinOmega;
            }

            rst.x = from.x * k0 + x1 * k1;
            rst.y = from.y * k0 + y1 * k1;
            rst.z = from.z * k0 + z1 * k1;
            rst.w = from.w * k0 + w1 * k1;

            return rst;
        }

        public get isIdentity(): boolean {
            return this.x === 0 && this.y === 0 && this.z === 0 && this.w === 1;
        }

        public identity(): void {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;
        }

        public isEqual(toCompare: Quaternion, tolerance: number = 0): boolean {
            if (tolerance === 0) {
                return this.x === toCompare.x && this.y === toCompare.y && this.z === toCompare.z && this.w === toCompare.w;
            } else {
                if (tolerance < 0) tolerance = -tolerance;
                tolerance *= tolerance;
                const x = this.x - toCompare.x;
                const y = this.y - toCompare.y;
                const z = this.z - toCompare.z;
                const w = this.w - toCompare.w;

                return (x * x + y * y + z * z + w * w) <= tolerance;
            }
        }

        public clone(): Quaternion {
            return new Quaternion(this.x, this.y, this.z, this.w);
        }

        public prepend(q: Quaternion, rst: Quaternion = null): Quaternion {
            return q.append(this, rst || this);
        }

        public append(quat: Quaternion, rst: Quaternion = null): Quaternion {
            let w1 = this.w * quat.w - this.x * quat.x - this.y * quat.y - this.z * quat.z;
            let x1 = this.w * quat.x + this.x * quat.w + this.y * quat.z - this.z * quat.y;
            let y1 = this.w * quat.y + this.y * quat.w + this.z * quat.x - this.x * quat.z;
            let z1 = this.w * quat.z + this.z * quat.w + this.x * quat.y - this.y * quat.x;

            return rst ? rst.setFromNumbers(x1, y1, z1, w1) : new Quaternion(x1, y1, z1, w1);
        }

        /*
        public append(q: Quaternion, rst: Quaternion = null): Quaternion {
            const w1 = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z;
            const x1 = this.x * q.w + this.w * q.x + this.z * q.y - this.y * q.z;
            const y1 = this.y * q.w + this.w * q.y + this.x * q.z - this.z * q.x;
            const z1 = this.z * q.w + this.w * q.z + this.y * q.x - this.x * q.y;

            return rst ? rst.setFromNumbers(x1, y1, z1, w1) : new Quaternion(x1, y1, z1, w1);
        }
        */

        public rotateXYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            //let m = this.toMatrix33();
            //return m.transform33XYZ(x, y, z, rst);
            
            rst = rst || new Vector3();

            const w1 = -x * this.x - y * this.y - z * this.z;
            const x1 = this.w * x + this.y * z - this.z * y;
            const y1 = this.w * y - this.x * z + this.z * x;
            const z1 = this.w * z + this.x * y - this.y * x;

            rst.x = -w1 * this.x + x1 * this.w - y1 * this.z + z1 * this.y;
            rst.y = -w1 * this.y + x1 * this.z + y1 * this.w - z1 * this.x;
            rst.z = -w1 * this.z - x1 * this.y + y1 * this.x + z1 * this.w;

            return rst;
        }

        public rotateVector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.rotateXYZ(vec3.x, vec3.y, vec3.z, rst);
        }

        public toMatrix33(rst: Matrix44 = null): Matrix44 {
            const x2 = this.x * 2;
            const y2 = this.y * 2;
            const z2 = this.z * 2;
            const xx = this.x * x2;
            const xy = this.x * y2;
            const xz = this.x * z2;
            const yy = this.y * y2;
            const yz = this.y * z2;
            const zz = this.z * z2;
            const wx = this.w * x2;
            const wy = this.w * y2;
            const wz = this.w * z2;

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
                rst = new Matrix44(
                    1 - yy - zz, xy + wz, xz - wy, 0,
                    xy - wz, 1 - xx - zz, yz + wx, 0,
                    xz + wy, yz - wx, 1 - xx - yy);
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

        public toString(): string {
            return "Quaternion(x=" + this.x + ", y=" + this.y + ", z=" + this.z + ", w=" + this.w + ")";
        }
    }
}