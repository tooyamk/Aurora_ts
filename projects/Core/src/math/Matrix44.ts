///<reference path="Quaternion.ts"/>

namespace Aurora {
    /**
	 * 00 04 08 12  axisX                                                                                       
	 * 01 05 09 13  axisY                                                                                                                                                    
	 * 02 06 10 14  axisZ                                                                                       
	 * 03 07 11 15
     * 
	 * x' = x * 00 + y * 01 + z * 02 + w * 03                                                           
	 * y' = x * 04 + y * 05 + z * 06 + w * 07                                                                       
	 * z' = x * 08 + y * 09 + z * 10 + w * 11                                                                       
	 * w' = x * 12 + y * 13 + z * 14 + w * 15
     * 
     * @see https://docs.microsoft.com/en-us/previous-versions/windows/desktop/bb281696(v%3dvs.85)
	 */
    export class Matrix44 {
        public readonly elements = new Float32Array(16);

        constructor(
            m00: number = 1, m01: number = 0, m02: number = 0, m03: number = 0,
            m10: number = 0, m11: number = 1, m12: number = 0, m13: number = 0,
            m20: number = 0, m21: number = 0, m22: number = 1, m23: number = 0,
            m30: number = 0, m31: number = 0, m32: number = 0, m33: number = 1) {
            const e = this.elements;

            e[0] = m00;
            e[1] = m10;
            e[2] = m20;
            e[3] = m30;

            e[4] = m01;
            e[5] = m11;
            e[6] = m21;
            e[7] = m31;

            e[8] = m02;
            e[9] = m12;
            e[10] = m22;
            e[11] = m32;

            e[12] = m03;
            e[13] = m13;
            e[14] = m23;
            e[15] = m33;
        }

        public static createOrthoLH(width: number, height: number, zNear: number, zFar: number, rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();
            rst.set44FromNumbers(
                2 / width, 0, 0, 0,
                0, 2 / height, 0, 0,
                0, 0, 1 / (zFar - zNear), 0,
                0, 0, zNear / (zNear - zFar), 1);

            return rst;
        }

        public static createOrthoOffCenterLH(left: number, right: number, bottom: number, top: number, zNear: number, zFar: number, rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();
            rst.set44FromNumbers(
                2 / (right - 1), 0, 0, 0,
                0, 2 / (top - bottom), 0, 0,
                0, 0, 1 / (zFar - zNear), 0,
                (1 + right) / (1 - right), (top + bottom) / (bottom - top), zNear / (zNear - zFar), 1);

            return rst;
        }

        /**
         * @param fieldOfViewY radian,Field of view in the y direction, in radians..
		 * @param aspectRatio width / height.
		 */
        public static createPerspectiveFovLH(fieldOfViewY: number, aspectRatio: number, zNear: number, zFar: number, rst: Matrix44 = null): Matrix44 {
            const yScale = 1 / Math.tan(fieldOfViewY * 0.5);
            const xScale = yScale / aspectRatio;

            rst = rst || new Matrix44();
            rst.set44FromNumbers(
                xScale, 0, 0, 0,
                0, yScale, 0, 0,
                0, 0, zFar / (zFar - zNear), 1,
                0, 0, zNear * zFar / (zNear - zFar), 0);

            return rst;
        }

        public static createPerspectiveLH(width: number, height: number, zNear: number, zFar: number, rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();
            const zNear2 = zNear * 2;
            rst.set44FromNumbers(
                zNear2 / width, 0, 0, 0,
                0, zNear2 / height, 0, 0,
                0, 0, zFar / (zFar - zNear), 1,
                0, 0, zNear * zFar / (zNear - zFar), 0);

            return rst;
        }

        public static createPerspectiveOffCenterLH(left: number, right: number, bottom: number, top: number, zNear: number, zFar: number, rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();
            const zNear2 = zNear * 2;
            rst.set44FromNumbers(
                zNear2 / (right - left), 0, 0, 0,
                0, zNear2 / (top - bottom), 0, 0,
                (left + right) / (left - right), (top + bottom) / (bottom - top), zFar / (zFar - zNear), 1,
                0, 0, zNear * zFar / (zNear - zFar), 0);

            return rst;
        }

        public static createLookAtLH(eye: Vector3, at: Vector3, up: Vector3, rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();

            const zaxis = at.clone().sub(eye).normalize();
            const xaxis = Vector3.cross(up, zaxis).normalize();
            const yaxis = Vector3.cross(zaxis, xaxis);

            rst.set44FromNumbers(
                xaxis.x, xaxis.y, xaxis.z, 0,
                yaxis.x, yaxis.y, yaxis.z, 0,
                zaxis.x, zaxis.y, zaxis.z, 0,
                eye.x, eye.y, eye.z, 1);
                //-Vector3.dot(xaxis, eye), -Vector3.dot(yaxis, eye), -Vector3.dot(zaxis, eye), 1);

            return rst;
        }

        public static createRotationAxis(axis: Vector3, radian: number, rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();

            const axisX = axis.x;
            const axisY = axis.y;
            const axisZ = axis.z;
            const sin = Math.sin(radian);
            const cos = Math.cos(radian);
            const cos1 = 1 - cos;
            const cos1x = cos1 * axisX;
            const cos1xy = cos1x * axisY;
            const cos1xz = cos1x * axisZ;
            const cos1y = cos1 * axisY;
            const cos1yz = cos1y * axisZ;
            const xsin = axisX * sin;
            const ysin = axisY * sin;
            const zsin = axisZ * sin;

            rst.set44FromNumbers(
                cos + cos1x * axisX, cos1xy - zsin, cos1xz + ysin, 0,
                cos1xy + zsin, cos + cos1y * axisY, cos1yz - xsin, 0,
                cos1xz - ysin, cos1yz + xsin, cos + cos1 * axisZ * axisZ);

            return rst;
        }

        /**
		 * direction(LH):(0, 1, 0) to (0, 0, 1)
		 */
        public static createRotationX(radian: number, rst: Matrix44 = null): Matrix44 {
            const sin = Math.sin(radian);
            const cos = Math.cos(radian);

            if (rst) {
                rst.set44FromNumbers(
                    1, 0, 0, 0,
                    0, cos, sin, 0,
                    0, -sin, cos);
            } else {
                rst = new Matrix44(
                    1, 0, 0, 0,
                    0, cos, sin, 0,
                    0, -sin, cos);
            }

            return rst;
        }
		/**
		 * direction(LH):(1, 0, 0) to (0, 0, -1)
		 */
        public static createRotationY(radian: number, rst: Matrix44 = null): Matrix44 {
            const sin = Math.sin(radian);
            const cos = Math.cos(radian);

            if (rst) {
                rst.set44FromNumbers(
                    cos, 0, -sin, 0,
                    0, 1, 0, 0,
                    sin, 0, cos);
            } else {
                rst = new Matrix44(
                    cos, 0, -sin, 0,
                    0, 1, 0, 0,
                    sin, 0, cos);
            }

            return rst;
        }
		/**
		 * direction(LH):(1, 0, 0) to (0, 1, 0)
		 */
        public static createRotationZ(radian: number, rst: Matrix44 = null): Matrix44 {
            const sin = Math.sin(radian);
            const cos = Math.cos(radian);

            if (rst) {
                rst.set44FromNumbers(
                    cos, sin, 0, 0,
                    -sin, cos);
            } else {
                rst = new Matrix44(
                    cos, sin, 0, 0,
                    -sin, cos);
            }

            return rst;
        }

        public static createScale(sx: number, sy: number, sz: number, rst: Matrix44 = null): Matrix44 {
            if (rst) {
                rst.set44FromNumbers(
                    sx, 0, 0, 0,
                    0, sy, 0, 0,
                    0, 0, sz);
            } else {
                rst = new Matrix44(
                    sx, 0, 0, 0,
                    0, sy, 0, 0,
                    0, 0, sz);
            }

            return rst;
        }
        public static createTranslation(tx: number, ty: number, tz: number, rst: Matrix44 = null): Matrix44 {
            if (rst) {
                rst.set44FromNumbers(
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    tx, ty, tz);
            } else {
                rst = new Matrix44(
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    tx, ty, tz);
            }

            return rst;
        }

        public static createTRS(translation: Vector3, rotation: Quaternion, scale: Vector3, rst: Matrix44 = null): Matrix44 {
            if (rotation) {
                rst = rotation.toMatrix33(rst);
            } else {
                if (rst) {
                    rst.identity33();
                } else {
                    rst = new Matrix44();
                }
            }

            const e = rst.elements;
            
            e[12] = 0;
            e[13] = 0;
            e[14] = 0;
            e[15] = 1;

            if (scale) {
                const sx = scale.x, sy = scale.y, sz = scale.z;

                e[0] *= sx;
                e[1] *= sy;
                e[2] *= sz;

                e[4] *= sx;
                e[5] *= sy;
                e[6] *= sz;

                e[8] *= sx;
                e[9] *= sy;
                e[10] *= sz;
            }

            if (translation) {
                e[3] = translation.x;
                e[7] = translation.y;
                e[11] = translation.z;
            } else {
                e[3] = 0;
                e[7] = 0;
                e[11] = 0;
            }
            
            return rst;
        }

        public set33FromNumbers(
            m00: number = 1, m01: number = 0, m02: number = 0,
            m10: number = 0, m11: number = 1, m12: number = 0,
            m20: number = 0, m21: number = 0, m22: number = 1): Matrix44 {
            const e = this.elements;

            e[0] = m00;
            e[1] = m10;
            e[2] = m20;

            e[4] = m01;
            e[5] = m11;
            e[6] = m21;

            e[8] = m02;
            e[9] = m12;
            e[10] = m22;

            return this;
        }

        public set34FromNumbers(
            m00: number = 1, m01: number = 0, m02: number = 0,
            m10: number = 0, m11: number = 1, m12: number = 0,
            m20: number = 0, m21: number = 0, m22: number = 1,
            m30: number = 0, m31: number = 0, m32: number = 0): Matrix44 {
            const e = this.elements;

            e[0] = m00;
            e[1] = m10;
            e[2] = m20;
            e[3] = m30;

            e[4] = m01;
            e[5] = m11;
            e[6] = m21;
            e[7] = m31;

            e[8] = m02;
            e[9] = m12;
            e[10] = m22;
            e[11] = m32;

            return this;
        }

        public set44FromNumbers(
            m00: number = 1, m01: number = 0, m02: number = 0, m03: number = 0,
            m10: number = 0, m11: number = 1, m12: number = 0, m13: number = 0,
            m20: number = 0, m21: number = 0, m22: number = 1, m23: number = 0,
            m30: number = 0, m31: number = 0, m32: number = 0, m33: number = 1): Matrix44 {
            const e = this.elements;

            e[0] = m00;
            e[1] = m10;
            e[2] = m20;
            e[3] = m30;

            e[4] = m01;
            e[5] = m11;
            e[6] = m21;
            e[7] = m31;

            e[8] = m02;
            e[9] = m12;
            e[10] = m22;
            e[11] = m32;

            e[12] = m03;
            e[13] = m13;
            e[14] = m23;
            e[15] = m33;

            return this;
        }

        public set44FromArray(numbers: number[], offset: int = 0, transpose: boolean = false): Matrix44 {
            const e = this.elements;

            if (transpose) {
                for (let i = 0; i < 16; ++i) e[i] = numbers[i];
            } else {
                e[0] = numbers[offset];
                e[1] = numbers[offset + 4];
                e[2] = numbers[offset + 8];
                e[3] = numbers[offset + 12];

                e[4] = numbers[offset + 1];
                e[5] = numbers[offset + 5];
                e[6] = numbers[offset + 9];
                e[7] = numbers[offset + 13];

                e[8] = numbers[offset + 2];
                e[9] = numbers[offset + 6];
                e[10] = numbers[offset + 10];
                e[11] = numbers[offset + 14];

                e[12] = numbers[offset + 3];
                e[13] = numbers[offset + 7];
                e[14] = numbers[offset + 11];
                e[15] = numbers[offset + 15];
            }

            return this;
        }

        public set34(m: Matrix44): Matrix44 {
            const e0 = this.elements;
            const e1 = m.elements;

            for (let i = 0; i < 12; ++i) e0[i] = e1[i];

            return this;
        }

        public set44(m: Matrix44): Matrix44 {
            const e0 = this.elements;
            const e1 = m.elements;

            for (let i = 0; i < 16; ++i) e0[i] = e1[i];

            return this;
        }

        public clone(): Matrix44 {
            const e = this.elements;

            return new Matrix44(
                e[0], e[4], e[8], e[12],
                e[1], e[5], e[9], e[13],
                e[2], e[6], e[10], e[14],
                e[3], e[7], e[11], e[15]);
        }

        public identity33(): Matrix44 {
            return this.set33FromNumbers(
                1, 0, 0,
                0, 1, 0,
                0, 0, 1
            )
        }

        public identity34(): Matrix44 {
            return this.set34FromNumbers(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0
            )
        }

        public identity44(): Matrix44 {
            return this.set44FromNumbers(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            )
        }

        public transpose(rst: Matrix44 = null): Matrix44 {
            rst = rst || this;

            const e0 = this.elements;
            const e1 = rst.elements;

            if (e0 === e1) {
                const m10 = e0[1];
                const m20 = e0[2];
                const m30 = e0[3];

                const m01 = e0[4];
                const m21 = e0[6];
                const m31 = e0[7];

                const m02 = e0[8];
                const m12 = e0[9];
                const m32 = e0[11];

                const m03 = e0[12];
                const m13 = e0[13];
                const m23 = e0[14];

                e1[1] = m01;
                e1[2] = m02;
                e1[3] = m03;

                e1[4] = m10;
                e1[6] = m12;
                e1[7] = m13;

                e1[8] = m20;
                e1[9] = m21;
                e1[11] = m23;

                e1[12] = m30;
                e1[13] = m31;
                e1[14] = m32;
            } else {
                e1[0] = e0[0];
                e1[1] = e0[4];
                e1[2] = e0[8];
                e1[3] = e0[12];

                e1[4] = e0[1];
                e1[5] = e0[5];
                e1[6] = e0[9];
                e1[7] = e0[13];

                e1[8] = e0[2];
                e1[9] = e0[6];
                e1[10] = e0[10];
                e1[11] = e0[14];

                e1[12] = e0[3];
                e1[13] = e0[7];
                e1[14] = e0[11];
                e1[14] = e0[15];
            }

            return rst;
        }

        public decomposition(rstRot: Matrix44, rstScale: Vector3 = null): void {
            rstRot = rstRot || new Matrix44();

            rstRot.m00 = this.m00;
            rstRot.m01 = this.m01;
            rstRot.m02 = this.m02;
            rstRot.m03 = 1;

            let len = this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02;
            if (len != 1 && len != 0) {
                len = Math.sqrt(len);

                rstRot.m00 /= len;
                rstRot.m01 /= len;
                rstRot.m02 /= len;
            }

            let dot = rstRot.m00 * this.m10 + rstRot.m01 * this.m11 + rstRot.m02 * this.m12;
            rstRot.m10 = this.m10 - rstRot.m00 * dot;
            rstRot.m11 = this.m11 - rstRot.m01 * dot;
            rstRot.m12 = this.m12 - rstRot.m02 * dot;

            len = rstRot.m10 * rstRot.m10 + rstRot.m11 * rstRot.m11 + rstRot.m12 * rstRot.m12;
            if (len != 1 && len != 0) {
                len = Math.sqrt(len);

                rstRot.m10 /= len;
                rstRot.m11 /= len;
                rstRot.m12 /= len;
            }

            dot = rstRot.m00 * this.m20 + rstRot.m01 * this.m21 + rstRot.m02 * this.m22;
            rstRot.m20 = this.m20 - rstRot.m00 * dot;
            rstRot.m21 = this.m21 - rstRot.m01 * dot;
            rstRot.m22 = this.m22 - rstRot.m02 * dot;

            dot = rstRot.m10 * this.m20 + rstRot.m11 * this.m21 + rstRot.m12 * this.m22;
            rstRot.m20 -= rstRot.m10 * dot;
            rstRot.m21 -= rstRot.m11 * dot;
            rstRot.m22 -= rstRot.m12 * dot;

            len = rstRot.m20 * this.m20 + rstRot.m21 * this.m21 + rstRot.m22 * this.m22;
            if (len != 1 && len != 0) {
                len = Math.sqrt(len);

                rstRot.m20 /= len;
                rstRot.m21 /= len;
                rstRot.m22 /= len;
            }

            dot = rstRot.m00 * rstRot.m11 * rstRot.m22 +
                rstRot.m10 * rstRot.m21 * rstRot.m02 +
                rstRot.m20 * rstRot.m01 * rstRot.m12 -
                rstRot.m20 * rstRot.m11 * rstRot.m02 -
                rstRot.m10 * rstRot.m01 * rstRot.m22 -
                rstRot.m00 * rstRot.m21 * rstRot.m12;

            if (dot < 0) {
                rstRot.m00 = -rstRot.m00;
                rstRot.m01 = -rstRot.m01;
                rstRot.m02 = -rstRot.m02;
                rstRot.m10 = -rstRot.m10;
                rstRot.m11 = -rstRot.m11;
                rstRot.m12 = -rstRot.m12;
                rstRot.m20 = -rstRot.m20;
                rstRot.m21 = -rstRot.m21;
                rstRot.m22 = -rstRot.m22;
            }

            if (rstScale) {
                rstScale.x = rstRot.m00 * this.m00 + rstRot.m01 * this.m01 + rstRot.m02 * this.m02;
                rstScale.y = rstRot.m10 * this.m10 + rstRot.m11 * this.m11 + rstRot.m12 * this.m12;
                rstScale.z = rstRot.m20 * this.m20 + rstRot.m21 * this.m21 + rstRot.m22 * this.m22;
            }
        }

        public toQuaternion(rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();
            const tr = this.m00 + this.m11 + this.m22;
            if (tr > 0) {
                let s = Math.sqrt(tr + 1);
                rst.w = s * 0.5;
                s = 0.5 / s;
                rst.x = (this.m12 - this.m21) * s;
                rst.y = (this.m20 - this.m02) * s;
                rst.z = (this.m01 - this.m10) * s;
            } else {
                if (this.m11 > this.m00) {
                    if (this.m22 > this.m11) {//2
                        let s = Math.sqrt((this.m22 - this.m00 - this.m11) + 1);
                        rst.z = s * 0.5;
                        s = 0.5 / s;
                        rst.x = (this.m20 + this.m02) * s;
                        rst.y = (this.m21 + this.m12) * s;
                        rst.w = (this.m01 - this.m10) * s;
                    } else {//1
                        let s = Math.sqrt((this.m11 - this.m22 - this.m00) + 1);
                        rst.y = s * 0.5;
                        s = 0.5 / s;
                        rst.x = (this.m10 + this.m01) * s;
                        rst.z = (this.m12 + this.m21) * s;
                        rst.w = (this.m20 - this.m02) * s;
                    }
                } else if (this.m22 > this.m00) {//2
                    let s = Math.sqrt((this.m22 - this.m00 - this.m11) + 1);
                    rst.z = s * 0.5;
                    s = 0.5 / s;
                    rst.x = (this.m20 + this.m02) * s;
                    rst.y = (this.m21 + this.m12) * s;
                    rst.w = (this.m01 - this.m10) * s;
                } else {//0
                    let s = Math.sqrt((this.m00 - this.m11 - this.m22) + 1);
                    rst.x = s * 0.5;
                    s = 0.5 / s;
                    rst.y = (this.m01 + this.m10) * s;
                    rst.z = (this.m02 + this.m20) * s;
                    rst.w = (this.m12 - this.m21) * s;
                }
            }

            return rst;
        }

        public appendTranslate(x: number = 0, y: number = 0, z: number = 0): void {
            this.m00 += this.m03 * x;
            this.m01 += this.m03 * y;
            this.m02 += this.m03 * z;

            this.m10 += this.m13 * x;
            this.m11 += this.m13 * y;
            this.m12 += this.m13 * z;

            this.m20 += this.m23 * x;
            this.m21 += this.m23 * y;
            this.m22 += this.m23 * z;

            this.m30 += this.m33 * x;
            this.m31 += this.m33 * y;
            this.m32 += this.m33 * z;
        }

        public invert33(rst: Matrix44 = null): Matrix44 {
            let tmp0 = this.m22;
            let tmp2 = this.m12;
            let tmp6 = this.m02;

            const dst0 = tmp0 * this.m11 - tmp2 * this.m21;
            const dst1 = tmp6 * this.m21 - tmp0 * this.m01;
            const dst2 = tmp2 * this.m01 - tmp6 * this.m11;

            let det = this.m00 * dst0 + this.m10 * dst1 + this.m20 * dst2;
            if (det > MathUtils.ZERO_TOLERANCE || det < -MathUtils.ZERO_TOLERANCE) {
                const dst4 = tmp2 * this.m20 - tmp0 * this.m10;
                const dst5 = tmp0 * this.m00 - tmp6 * this.m20;
                const dst6 = tmp6 * this.m10 - tmp2 * this.m00;

                const dst8 = this.m10 * this.m21 - this.m20 * this.m11;
                const dst9 = this.m20 * this.m01 - this.m00 * this.m21;
                const dst10 = this.m00 * this.m11 - this.m10 * this.m01;

                det = 1 / det;

                rst = rst || this;

                rst.m00 = dst0 * det;
                rst.m01 = dst1 * det;
                rst.m02 = dst2 * det;

                rst.m10 = dst4 * det;
                rst.m11 = dst5 * det;
                rst.m12 = dst6 * det;

                rst.m20 = dst8 * det;
                rst.m21 = dst9 * det;
                rst.m22 = dst10 * det;

                return rst;
            } else {
                return null;
            }
        }

        public invert34(rst: Matrix44 = null): Matrix44 {
            let tmp0 = this.m22;
            let tmp2 = this.m12;
            let tmp6 = this.m02;

            const dst0 = tmp0 * this.m11 - tmp2 * this.m21;
            const dst1 = tmp6 * this.m21 - tmp0 * this.m01;
            const dst2 = tmp2 * this.m01 - tmp6 * this.m11;

            let det = this.m00 * dst0 + this.m10 * dst1 + this.m20 * dst2;
            if (det > MathUtils.ZERO_TOLERANCE || det < -MathUtils.ZERO_TOLERANCE) {
                const dst4 = tmp2 * this.m20 - tmp0 * this.m10;
                const dst5 = tmp0 * this.m00 - tmp6 * this.m20;
                const dst6 = tmp6 * this.m10 - tmp2 * this.m00;

                tmp0 = this.m20 * this.m31;
                const tmp1 = this.m30 * this.m21;
                tmp2 = this.m10 * this.m31;
                const tmp3 = this.m30 * this.m11;
                const tmp4 = this.m10 * this.m21;
                const tmp5 = this.m20 * this.m11;
                tmp6 = this.m00 * this.m31;
                const tmp7 = this.m30 * this.m01;
                const tmp8 = this.m00 * this.m21;
                const tmp9 = this.m20 * this.m01;
                const tmp10 = this.m00 * this.m11;
                const tmp11 = this.m10 * this.m01;

                const dst8 = tmp4 - tmp5;
                const dst9 = tmp9 - tmp8;
                const dst10 = tmp10 - tmp11;
                const dst12 = tmp2 * this.m22 + tmp5 * this.m32 + tmp1 * this.m12 - (tmp4 * this.m32 + tmp0 * this.m12 + tmp3 * this.m22);
                const dst13 = tmp8 * this.m32 + tmp0 * this.m02 + tmp7 * this.m22 - (tmp6 * this.m22 + tmp9 * this.m32 + tmp1 * this.m02);
                const dst14 = tmp6 * this.m12 + tmp11 * this.m32 + tmp3 * this.m02 - (tmp10 * this.m32 + tmp2 * this.m02 + tmp7 * this.m12);

                det = 1 / det;

                rst = rst || this;

                rst.m00 = dst0 * det;
                rst.m01 = dst1 * det;
                rst.m02 = dst2 * det;
                
                rst.m10 = dst4 * det;
                rst.m11 = dst5 * det;
                rst.m12 = dst6 * det;
                
                rst.m20 = dst8 * det;
                rst.m21 = dst9 * det;
                rst.m22 = dst10 * det;
                
                rst.m30 = dst12 * det;
                rst.m31 = dst13 * det;
                rst.m32 = dst14 * det;

                return rst;
            } else {
                return null;
            }
        }

        public invert44(rst: Matrix44 = null): Matrix44 {
            let tmp0 = this.m22 * this.m33;
            let tmp1 = this.m32 * this.m23;
            let tmp2 = this.m12 * this.m33;
            let tmp3 = this.m32 * this.m13;
            let tmp4 = this.m12 * this.m23;
            let tmp5 = this.m22 * this.m13;
            let tmp6 = this.m02 * this.m33;
            let tmp7 = this.m32 * this.m03;
            let tmp8 = this.m02 * this.m23;
            let tmp9 = this.m22 * this.m03;
            let tmp10 = this.m02 * this.m13;
            let tmp11 = this.m12 * this.m03;

            const dst0 = tmp0 * this.m11 + tmp3 * this.m21 + tmp4 * this.m31 - (tmp1 * this.m11 + tmp2 * this.m21 + tmp5 * this.m31);
            const dst1 = tmp1 * this.m01 + tmp6 * this.m21 + tmp9 * this.m31 - (tmp0 * this.m01 + tmp7 * this.m21 + tmp8 * this.m31);
            const dst2 = tmp2 * this.m01 + tmp7 * this.m11 + tmp10 * this.m31 - (tmp3 * this.m01 + tmp6 * this.m11 + tmp11 * this.m31);
            const dst3 = tmp5 * this.m01 + tmp8 * this.m11 + tmp11 * this.m21 - (tmp4 * this.m01 + tmp9 * this.m11 + tmp10 * this.m21);

            let det = this.m00 * dst0 + this.m10 * dst1 + this.m20 * dst2 + this.m30 * dst3;
            if (det > MathUtils.ZERO_TOLERANCE || det < -MathUtils.ZERO_TOLERANCE) {
                const dst4 = tmp1 * this.m10 + tmp2 * this.m20 + tmp5 * this.m30 - (tmp0 * this.m10 + tmp3 * this.m20 + tmp4 * this.m30);
                const dst5 = tmp0 * this.m00 + tmp7 * this.m20 + tmp8 * this.m30 - (tmp1 * this.m00 + tmp6 * this.m20 + tmp9 * this.m30);
                const dst6 = tmp3 * this.m00 + tmp6 * this.m10 + tmp11 * this.m30 - (tmp2 * this.m00 + tmp7 * this.m10 + tmp10 * this.m30);
                const dst7 = tmp4 * this.m00 + tmp9 * this.m10 + tmp10 * this.m20 - (tmp5 * this.m00 + tmp8 * this.m10 + tmp11 * this.m20);

                tmp0 = this.m20 * this.m31;
                tmp1 = this.m30 * this.m21;
                tmp2 = this.m10 * this.m31;
                tmp3 = this.m30 * this.m11;
                tmp4 = this.m10 * this.m21;
                tmp5 = this.m20 * this.m11;
                tmp6 = this.m00 * this.m31;
                tmp7 = this.m30 * this.m01;
                tmp8 = this.m00 * this.m21;
                tmp9 = this.m20 * this.m01;
                tmp10 = this.m00 * this.m11;
                tmp11 = this.m10 * this.m01;

                const dst8 = tmp0 * this.m13 + tmp3 * this.m23 + tmp4 * this.m33 - (tmp1 * this.m13 + tmp2 * this.m23 + tmp5 * this.m33);
                const dst9 = tmp1 * this.m03 + tmp6 * this.m23 + tmp9 * this.m33 - (tmp0 * this.m03 + tmp7 * this.m23 + tmp8 * this.m33);
                const dst10 = tmp2 * this.m03 + tmp7 * this.m13 + tmp10 * this.m33 - (tmp3 * this.m03 + tmp6 * this.m13 + tmp11 * this.m33);
                const dst11 = tmp5 * this.m03 + tmp8 * this.m13 + tmp11 * this.m23 - (tmp4 * this.m03 + tmp9 * this.m13 + tmp10 * this.m23);
                const dst12 = tmp2 * this.m22 + tmp5 * this.m32 + tmp1 * this.m12 - (tmp4 * this.m32 + tmp0 * this.m12 + tmp3 * this.m22);
                const dst13 = tmp8 * this.m32 + tmp0 * this.m02 + tmp7 * this.m22 - (tmp6 * this.m22 + tmp9 * this.m32 + tmp1 * this.m02);
                const dst14 = tmp6 * this.m12 + tmp11 * this.m32 + tmp3 * this.m02 - (tmp10 * this.m32 + tmp2 * this.m02 + tmp7 * this.m12);
                const dst15 = tmp10 * this.m22 + tmp4 * this.m02 + tmp9 * this.m12 - (tmp8 * this.m12 + tmp11 * this.m22 + tmp5 * this.m02);

                det = 1 / det;

                rst = rst || this;

                rst.m00 = dst0 * det;
                rst.m01 = dst1 * det;
                rst.m02 = dst2 * det;
                rst.m03 = dst3 * det;

                rst.m10 = dst4 * det;
                rst.m11 = dst5 * det;
                rst.m12 = dst6 * det;
                rst.m13 = dst7 * det;

                rst.m20 = dst8 * det;
                rst.m21 = dst9 * det;
                rst.m22 = dst10 * det;
                rst.m23 = dst11 * det;

                rst.m30 = dst12 * det;
                rst.m31 = dst13 * det;
                rst.m32 = dst14 * det;
                rst.m33 = dst15 * det;

                return rst;
            } else {
                return null;
            }
        }

        public append34a(m: Matrix44, rst: Matrix44 = null): Matrix44 {
            const self = this.elements;
            const target = m.elements;

            const b00 = target[0];
            const b01 = target[1];
            const b02 = target[2];

            const b10 = target[4];
            const b11 = target[5];
            const b12 = target[6];

            const b20 = target[8];
            const b21 = target[9];
            const b22 = target[10];

            let a0 = self[0];
            let a1 = self[1];
            let a2 = self[2];

            const m00 = a0 * b00 + a1 * b10 + a2 * b20;
            const m01 = a0 * b01 + a1 * b11 + a2 * b21;
            const m02 = a0 * b02 + a1 * b12 + a2 * b22;

            a0 = self[4];
            a1 = self[5];
            a2 = self[6];

            const m10 = a0 * b00 + a1 * b10 + a2 * b20;
            const m11 = a0 * b01 + a1 * b11 + a2 * b21;
            const m12 = a0 * b02 + a1 * b12 + a2 * b22;

            a0 = self[8];
            a1 = self[9];
            a2 = self[10];

            const m20 = a0 * b00 + a1 * b10 + a2 * b20;
            const m21 = a0 * b01 + a1 * b11 + a2 * b21;
            const m22 = a0 * b02 + a1 * b12 + a2 * b22;

            a0 = self[12];
            a1 = self[13];
            a2 = self[14];

            const m30 = a0 * b00 + a1 * b10 + a2 * b20 + target[12];
            const m31 = a0 * b01 + a1 * b11 + a2 * b21 + target[13];
            const m32 = a0 * b02 + a1 * b12 + a2 * b22 + target[14];

            rst = rst || this;
            const to = rst.elements;
            to[0] = m00;
            to[1] = m01;
            to[2] = m02;

            to[4] = m10;
            to[5] = m11;
            to[6] = m12;

            to[8] = m20;
            to[9] = m21;
            to[10] = m22;

            to[12] = m30;
            to[13] = m31;
            to[14] = m32;

            return rst;
        }

        public append34b(m: Matrix44, rst: Matrix44 = null): Matrix44 {
            const self = this;

            const b00 = m.m00;
            const b01 = m.m01;
            const b02 = m.m02;

            const b10 = m.m10;
            const b11 = m.m11;
            const b12 = m.m12;

            const b20 = m.m20;
            const b21 = m.m21;
            const b22 = m.m22;

            let a0 = self.m00;
            let a1 = self.m01;
            let a2 = self.m02;

            const m00 = a0 * b00 + a1 * b10 + a2 * b20;
            const m01 = a0 * b01 + a1 * b11 + a2 * b21;
            const m02 = a0 * b02 + a1 * b12 + a2 * b22;

            a0 = self.m10;
            a1 = self.m11;
            a2 = self.m12;

            const m10 = a0 * b00 + a1 * b10 + a2 * b20;
            const m11 = a0 * b01 + a1 * b11 + a2 * b21;
            const m12 = a0 * b02 + a1 * b12 + a2 * b22;

            a0 = self.m20;
            a1 = self.m21;
            a2 = self.m22;

            const m20 = a0 * b00 + a1 * b10 + a2 * b20;
            const m21 = a0 * b01 + a1 * b11 + a2 * b21;
            const m22 = a0 * b02 + a1 * b12 + a2 * b22;

            a0 = self.m30;
            a1 = self.m31;
            a2 = self.m32;

            const m30 = a0 * b00 + a1 * b10 + a2 * b20 + m.m30;
            const m31 = a0 * b01 + a1 * b11 + a2 * b21 + m.m31;
            const m32 = a0 * b02 + a1 * b12 + a2 * b22 + m.m32;

            rst = rst || self;
            rst.m00 = m00;
            rst.m01 = m01;
            rst.m02 = m02;

            rst.m10 = m10;
            rst.m11 = m11;
            rst.m12 = m12;

            rst.m20 = m20;
            rst.m21 = m21;
            rst.m22 = m22;

            rst.m30 = m30;
            rst.m31 = m31;
            rst.m32 = m32;

            return rst;
        }

        public append34(m: Matrix44, rst: Matrix44 = null): Matrix44 {
            const m00 = this.m00 * m.m00 + this.m01 * m.m10 + this.m02 * m.m20;
            const m01 = this.m00 * m.m01 + this.m01 * m.m11 + this.m02 * m.m21;
            const m02 = this.m00 * m.m02 + this.m01 * m.m12 + this.m02 * m.m22;

            const m10 = this.m10 * m.m00 + this.m11 * m.m10 + this.m12 * m.m20;
            const m11 = this.m10 * m.m01 + this.m11 * m.m11 + this.m12 * m.m21;
            const m12 = this.m10 * m.m02 + this.m11 * m.m12 + this.m12 * m.m22;

            const m20 = this.m20 * m.m00 + this.m21 * m.m10 + this.m22 * m.m20;
            const m21 = this.m20 * m.m01 + this.m21 * m.m11 + this.m22 * m.m21;
            const m22 = this.m20 * m.m02 + this.m21 * m.m12 + this.m22 * m.m22;

            const m30 = this.m30 * m.m00 + this.m31 * m.m10 + this.m32 * m.m20 + m.m30;
            const m31 = this.m30 * m.m01 + this.m31 * m.m11 + this.m32 * m.m21 + m.m31;
            const m32 = this.m30 * m.m02 + this.m31 * m.m12 + this.m32 * m.m22 + m.m32;

            rst = rst || this;
            rst.m00 = m00;
            rst.m01 = m01;
            rst.m02 = m02;

            rst.m10 = m10;
            rst.m11 = m11;
            rst.m12 = m12;

            rst.m20 = m20;
            rst.m21 = m21;
            rst.m22 = m22;

            rst.m30 = m30;
            rst.m31 = m31;
            rst.m32 = m32;

            return rst;
        }

        public append44(m: Matrix44, rst: Matrix44 = null): Matrix44 {
            const m00 = this.m00 * m.m00 + this.m01 * m.m10 + this.m02 * m.m20 + this.m03 * m.m30;
            const m01 = this.m00 * m.m01 + this.m01 * m.m11 + this.m02 * m.m21 + this.m03 * m.m31;
            const m02 = this.m00 * m.m02 + this.m01 * m.m12 + this.m02 * m.m22 + this.m03 * m.m32;
            const m03 = this.m00 * m.m03 + this.m01 * m.m13 + this.m02 * m.m23 + this.m03 * m.m33;

            const m10 = this.m10 * m.m00 + this.m11 * m.m10 + this.m12 * m.m20 + this.m13 * m.m30;
            const m11 = this.m10 * m.m01 + this.m11 * m.m11 + this.m12 * m.m21 + this.m13 * m.m31;
            const m12 = this.m10 * m.m02 + this.m11 * m.m12 + this.m12 * m.m22 + this.m13 * m.m32;
            const m13 = this.m10 * m.m03 + this.m11 * m.m13 + this.m12 * m.m23 + this.m13 * m.m33;

            const m20 = this.m20 * m.m00 + this.m21 * m.m10 + this.m22 * m.m20 + this.m23 * m.m30;
            const m21 = this.m20 * m.m01 + this.m21 * m.m11 + this.m22 * m.m21 + this.m23 * m.m31;
            const m22 = this.m20 * m.m02 + this.m21 * m.m12 + this.m22 * m.m22 + this.m23 * m.m32;
            const m23 = this.m20 * m.m03 + this.m21 * m.m13 + this.m22 * m.m23 + this.m23 * m.m33;

            const m30 = this.m30 * m.m00 + this.m31 * m.m10 + this.m32 * m.m20 + this.m33 * m.m30;
            const m31 = this.m30 * m.m01 + this.m31 * m.m11 + this.m32 * m.m21 + this.m33 * m.m31;
            const m32 = this.m30 * m.m02 + this.m31 * m.m12 + this.m32 * m.m22 + this.m33 * m.m32;
            const m33 = this.m30 * m.m03 + this.m31 * m.m13 + this.m32 * m.m23 + this.m33 * m.m33;

            rst = rst || this;
            rst.m00 = m00;
            rst.m01 = m01;
            rst.m02 = m02;
            rst.m03 = m03;

            rst.m10 = m10;
            rst.m11 = m11;
            rst.m12 = m12;
            rst.m13 = m13;

            rst.m20 = m20;
            rst.m21 = m21;
            rst.m22 = m22;
            rst.m23 = m23;

            rst.m30 = m30;
            rst.m31 = m31;
            rst.m32 = m32;
            rst.m33 = m33;

            return rst;
        }

        /** local scale. */
        public prependScale34XYZ(x: number = 1, y: number = 1, z: number = 1): void {
            this.m00 *= x;
            this.m01 *= x;
            this.m02 *= x;

            this.m10 *= y;
            this.m11 *= y;
            this.m12 *= y;

            this.m20 *= z;
            this.m21 *= z;
            this.m22 *= z;
        }

        public prependScale34Vector3(scale: Vector3): void {
            this.prependScale34XYZ(scale.x, scale.y, scale.z);
        }

        public prependScale44XYZ(x: number = 1, y: number = 1, z: number = 1): void {
            this.m00 *= x;
            this.m01 *= x;
            this.m02 *= x;
            this.m03 *= x;

            this.m10 *= y;
            this.m11 *= y;
            this.m12 *= y;
            this.m13 *= y;

            this.m20 *= z;
            this.m21 *= z;
            this.m22 *= z;
            this.m23 *= z;
        }

        public prependScale44Vector3(scale: Vector3): void {
            this.prependScale44XYZ(scale.x, scale.y, scale.z);
        }

        /** local translate. */
        public prependTranslate34XYZ(x: number = 0, y: number = 0, z: number = 0): void {
            this.m30 += x * this.m00 + y * this.m10 + z * this.m20;
            this.m31 += x * this.m01 + y * this.m11 + z * this.m21;
            this.m32 += x * this.m02 + y * this.m12 + z * this.m22;
        }

        public prependTranslate44XYZ(x: number = 0, y: number = 0, z: number = 0): void {
            this.m30 += x * this.m00 + y * this.m10 + z * this.m20;
            this.m31 += x * this.m01 + y * this.m11 + z * this.m21;
            this.m32 += x * this.m02 + y * this.m12 + z * this.m22;
            this.m33 += x * this.m03 + y * this.m13 + z * this.m23;
        }

        public transform33XYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            const dstX = x * this.m00 + y * this.m10 + z * this.m20;
            const dstY = x * this.m01 + y * this.m11 + z * this.m21;
            const dstZ = x * this.m02 + y * this.m12 + z * this.m22;

            return rst ? rst.setFromNumbers(dstX, dstY, dstZ) : new Vector3(dstX, dstY, dstZ);
        }

        public transform33Vector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.transform33XYZ(vec3.x, vec3.y, vec3.z, rst);
        }

        public transform34XYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            const dstX = x * this.m00 + y * this.m10 + z * this.m20 + this.m30;
            const dstY = x * this.m01 + y * this.m11 + z * this.m21 + this.m31;
            const dstZ = x * this.m02 + y * this.m12 + z * this.m22 + this.m32;

            return rst ? rst.setFromNumbers(dstX, dstY, dstZ) : new Vector3(dstX, dstY, dstZ);
        }

        public transform34Z(x: number = 0, y: number = 0, z: number = 0): number {
            return x * this.m02 + y * this.m12 + z * this.m22 + this.m32;
        }

        public transform34Vector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.transform34XYZ(vec3.x, vec3.y, vec3.z, rst);
        }

        public transform44XY(x: number = 0, y: number = 0, rst: Vector2 = null): Vector2 {
            const w = x * this.m03 + y * this.m13 + this.m33;

            const dstX = (x * this.m00 + y * this.m10 + this.m30) / w;
            const dstY = (x * this.m01 + y * this.m11 + this.m31) / w;

            return rst ? rst.setFromNumbers(dstX, dstY) : new Vector2(dstX, dstY);
        }

        public transform44XYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            const w = x * this.m03 + y * this.m13 + z * this.m23 + this.m33;

            const dstX = (x * this.m00 + y * this.m10 + z * this.m20 + this.m30) / w;
            const dstY = (x * this.m01 + y * this.m11 + z * this.m21 + this.m31) / w;
            const dstZ = (x * this.m02 + y * this.m12 + z * this.m22 + this.m32) / w;

            return rst ? rst.setFromNumbers(dstX, dstY, dstZ) : new Vector3(dstX, dstY, dstZ);
        }

        public transform44Vector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.transform44XYZ(vec3.x, vec3.y, vec3.z, rst);
        }

        public transform44XYZW(x: number = 0, y: number = 0, z: number = 0, w: number, rst: Vector4 = null): Vector4 {
            const dstX = x * this.m00 + y * this.m10 + z * this.m20 + w * this.m30;
            const dstY = x * this.m01 + y * this.m11 + z * this.m21 + w * this.m31;
            const dstZ = x * this.m02 + y * this.m12 + z * this.m22 + w * this.m32;
            const dstW = x * this.m03 + y * this.m13 + z * this.m23 + w * this.m33;

            return rst ? rst.setFromNumbers(dstX, dstY, dstZ, dstW) : new Vector4(dstX, dstY, dstZ, dstW);
        }

        public transform44Vector4(vec4: Vector4, rst: Vector4 = null): Vector4 {
            return this.transform44XYZW(vec4.x, vec4.y, vec4.z, vec4.w, rst);
        }

        /**
		 * transform axisY and axisZ
		 */
        public transformLRH(): void {
            let tmp = this.m10;
            this.m10 = this.m20;
            this.m20 = tmp;

            tmp = this.m01;
            this.m01 = this.m02;
            this.m02 = tmp;

            tmp = this.m11;
            this.m11 = this.m22;
            this.m22 = tmp;

            tmp = this.m21;
            this.m21 = this.m12;
            this.m12 = tmp;

            tmp = this.m31;
            this.m31 = this.m32;
            this.m32 = tmp;
        }

        public toArray33(transpose: boolean = false, rst: FloatArray = null): FloatArray {
            rst = rst || [];

            rst[0] = this.m00;
            rst[4] = this.m11;
            rst[8] = this.m22;

            if (transpose) {
                rst[1] = this.m10;
                rst[2] = this.m20;

                rst[3] = this.m01;
                rst[5] = this.m21;

                rst[6] = this.m02;
                rst[7] = this.m12;
            } else {
                rst[1] = this.m01;
                rst[2] = this.m02;

                rst[3] = this.m10;
                rst[5] = this.m12;

                rst[6] = this.m20;
                rst[7] = this.m21;
            }

            return rst;
        }

        public toArray34(transpose: boolean = false, rst: FloatArray = null): FloatArray {
            rst = rst || [];

            rst[0] = this.m00;

            if (transpose) {
                rst[1] = this.m10;
                rst[2] = this.m20;
                rst[3] = this.m30;

                rst[4] = this.m01;
                rst[5] = this.m11;
                rst[6] = this.m21;
                rst[7] = this.m31;

                rst[8] = this.m02;
                rst[9] = this.m12;
                rst[10] = this.m22;
                rst[11] = this.m32;
            } else {
                rst[1] = this.m01;
                rst[2] = this.m02;

                rst[3] = this.m10;
                rst[4] = this.m11;
                rst[5] = this.m12;

                rst[6] = this.m20;
                rst[7] = this.m21;
                rst[8] = this.m22;

                rst[9] = this.m30;
                rst[10] = this.m31;
                rst[11] = this.m32;
            }

            return rst;
        }

        public toArray44(transpose: boolean = false, rst: FloatArray = null): FloatArray {
            rst = rst || [];

            rst[0] = this.m00;
            rst[5] = this.m11;
            rst[10] = this.m22;
            rst[15] = this.m33;

            if (transpose) {
                rst[1] = this.m10;
                rst[2] = this.m20;
                rst[3] = this.m30;

                rst[4] = this.m01;
                rst[6] = this.m21;
                rst[7] = this.m31;

                rst[8] = this.m02;
                rst[9] = this.m12;
                rst[11] = this.m32;

                rst[12] = this.m03;
                rst[13] = this.m13;
                rst[14] = this.m23;
            } else {
                rst[1] = this.m01;
                rst[2] = this.m02;
                rst[3] = this.m03;

                rst[4] = this.m10;
                rst[6] = this.m12;
                rst[7] = this.m13;

                rst[8] = this.m20;
                rst[9] = this.m21;
                rst[11] = this.m23;

                rst[12] = this.m30;
                rst[13] = this.m31;
                rst[14] = this.m32;
            }

            return rst;
        }
    }
}