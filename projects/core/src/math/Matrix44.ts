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

        public set44FromArray(numbers: number[], offset: int = 0, columnMajor: boolean = false): Matrix44 {
            const e = this.elements;

            if (columnMajor) {
                for (let i = 0; i < 16; ++i) e[i] = numbers[i + offset];
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

            const e = this.elements;
            const eRot = rstRot.elements;

            const m00 = e[0], m10 = e[1], m20 = e[2], m01 = e[4], m11 = e[5], m21 = e[6], m02 = e[8], m12 = e[9], m22 = e[10];
            let n00: number, n01: number, n02: number, n10: number, n11: number, n12: number, n20: number, n21: number, n22: number;

            let len = m00 * m00 + m01 * m01 + m02 * m02;
            if (len >= 0.0001) {
                len = Math.sqrt(len);

                n00 = m00 / len;
                n01 = m01 / len;
                n02 = m02 / len;
            } else {
                n00 = m00;
                n01 = m01;
                n02 = m02;
            }

            let dot = n00 * m10 + n01 * m11 + n02 * m12;
            n10 = m10 - n00 * dot;
            n11 = m10 - n01 * dot;
            n12 = m10 - n02 * dot;
            
            len = n10 * n10 + n11 * n11 + n12 * n12;
            if (len >= 0.0001) {
                len = Math.sqrt(len);

                n10 /= len;
                n11 /= len;
                n12 /= len;
            }

            dot = n00 * m20 + n01 * m21 + n02 * m22;
            n20 = m20 - n00 * dot;
            n21 = m21 - n01 * dot;
            n22 = m22 - n02 * dot;

            dot = n10 * m20 + n11 * m21 + n12 * m22;
            n20 -= n10 * dot;
            n21 -= n11 * dot;
            n22 -= n12 * dot;

            len = n20 * m20 + n21 * m21 + n22 * m22;
            if (len >= 0.0001) {
                len = Math.sqrt(len);

                n20 /= len;
                n21 /= len;
                n22 /= len;
            }
            
            if (n00 * n11 * n22 + n10 * n21 * n02 + n20 * n01 * n12 - n20 * n11 * n02 - n10 * n01 * n22 - n00 * n21 * n12 < 0) {
                n00 = -n00;
                n01 = -n01;
                n02 = -n02;

                n10 = -n10;
                n11 = -n11;
                n12 = -n12;

                n20 = -n20;
                n21 = -n21;
                n22 = -n22;
            }

            eRot[0] = n00;
            eRot[1] = n10;
            eRot[2] = n20;
            eRot[3] = 0;

            eRot[4] = n01;
            eRot[5] = n11;
            eRot[6] = n21;
            eRot[7] = 0;

            eRot[8] = n02;
            eRot[9] = n12;
            eRot[10] = n22;
            eRot[11] = 0;

            eRot[12] = 0;
            eRot[13] = 0;
            eRot[14] = 0;
            eRot[15] = 1;

            if (rstScale) {
                rstScale.x = n00 * m00 + n01 * m01 + n02 * m02;
                rstScale.y = n10 * m10 + n11 * m11 + n12 * m12;
                rstScale.z = n20 * m20 + n21 * m21 + n22 * m22;
            }
        }

        public toQuaternion(rst: Quaternion = null): Quaternion {
            rst = rst || new Quaternion();

            const e = this.elements;
            const m00 = e[0], m11 = e[5], m22 = e[10];

            const tr = m00 + m11 + m22;
            if (tr > 0) {
                let s = Math.sqrt(tr + 1);
                rst.w = s * 0.5;
                s = 0.5 / s;
                rst.x = (e[9] - e[6]) * s;
                rst.y = (e[2] - e[8]) * s;
                rst.z = (e[4] - e[1]) * s;
            } else {
                if (m11 > m00) {
                    if (m22 > m11) {//2
                        let s = Math.sqrt((m22 - m00 - m11) + 1);
                        rst.z = s * 0.5;
                        s = 0.5 / s;
                        rst.x = (e[2] + e[8]) * s;
                        rst.y = (e[6] + e[9]) * s;
                        rst.w = (e[4] - e[1]) * s;
                    } else {//1
                        let s = Math.sqrt((m11 - m22 - m00) + 1);
                        rst.y = s * 0.5;
                        s = 0.5 / s;
                        rst.x = (e[1] + e[4]) * s;
                        rst.z = (e[9] + e[6]) * s;
                        rst.w = (e[2] - e[8]) * s;
                    }
                } else if (m22 > m00) {//2
                    let s = Math.sqrt((m22 - m00 - m11) + 1);
                    rst.z = s * 0.5;
                    s = 0.5 / s;
                    rst.x = (e[2] + e[8]) * s;
                    rst.y = (e[6] + e[9]) * s;
                    rst.w = (e[4] - e[1]) * s;
                } else {//0
                    let s = Math.sqrt((m00 - m11 - m22) + 1);
                    rst.x = s * 0.5;
                    s = 0.5 / s;
                    rst.y = (e[4] + e[1]) * s;
                    rst.z = (e[8] + e[2]) * s;
                    rst.w = (e[9] - e[6]) * s;
                }
            }

            return rst;
        }

        public appendTranslate(x: number = 0, y: number = 0, z: number = 0): void {
            const e = this.elements;
            const m03 = e[3], m13 = e[7], m23 = e[11], m33 = e[15];

            e[0] += m03 * x;
            e[1] += m13 * x;
            e[2] += m23 * x;
            e[3] += m33 * x;

            e[4] += m03 * y;
            e[5] += m13 * y;
            e[6] += m23 * y;
            e[7] += m33 * y;

            e[8] += m03 * z;
            e[9] += m13 * z;
            e[10] += m23 * z;
            e[11] += m33 * z;
        }

        public invert33(rst: Matrix44 = null): Matrix44 {
            const e = this.elements;
            const m00 = e[0], m10 = e[1], m20 = e[2], m01 = e[4], m11 = e[5], m21 = e[6], m02 = e[8], m12 = e[9], m22 = e[10];

            const dst0 = m22 * m11 - m12 * m21;
            const dst1 = m02 * m21 - m22 * m01;
            const dst2 = m12 * m01 - m02 * m11;

            let det = m00 * dst0 + m10 * dst1 + m20 * dst2;
            if (det > MathUtils.ZERO_TOLERANCE || det < -MathUtils.ZERO_TOLERANCE) {
                const dst4 = m12 * m20 - m22 * m10;
                const dst5 = m22 * m00 - m02 * m20;
                const dst6 = m02 * m10 - m12 * m00;

                const dst8 = m10 * m21 - m20 * m11;
                const dst9 = m20 * m01 - m00 * m21;
                const dst10 = m00 * m11 - m10 * m01;

                det = 1 / det;

                rst = rst || this;
                const eRst = rst.elements;

                eRst[0] = dst0 * det;
                eRst[1] = dst4 * det;
                eRst[2] = dst8 * det;

                eRst[4] = dst1 * det;
                eRst[5] = dst5 * det;
                eRst[6] = dst9 * det;

                eRst[8] = dst2 * det;
                eRst[9] = dst6 * det;
                eRst[10]= dst10 * det;

                return rst;
            } else {
                return null;
            }
        }

        public invert34(rst: Matrix44 = null): Matrix44 {
            const e = this.elements;
            const m00 = e[0], m10 = e[1], m20 = e[2], m30 = e[3], m01 = e[4], m11 = e[5], m21 = e[6], m31 = e[7], m02 = e[8], m12 = e[9], m22 = e[10], m32 = e[11];

            const dst0 = m22 * m11 - m12 * m21;
            const dst1 = m02 * m21 - m22 * m01;
            const dst2 = m12 * m01 - m02 * m11;

            let det = m00 * dst0 + m10 * dst1 + m20 * dst2;
            if (det > MathUtils.ZERO_TOLERANCE || det < -MathUtils.ZERO_TOLERANCE) {
                const dst4 = m12 * m20 - m22 * m10;
                const dst5 = m22 * m00 - m02 * m20;
                const dst6 = m02 * m10 - m12 * m00;

                const tmp0 = m20 * m31;
                const tmp1 = m30 * m21;
                const tmp2 = m10 * m31;
                const tmp3 = m30 * m11;
                const tmp4 = m10 * m21;
                const tmp5 = m20 * m11;
                const tmp6 = m00 * m31;
                const tmp7 = m30 * m01;
                const tmp8 = m00 * m21;
                const tmp9 = m20 * m01;
                const tmp10 = m00 * m11;
                const tmp11 = m10 * m01;

                const dst8 = tmp4 - tmp5;
                const dst9 = tmp9 - tmp8;
                const dst10 = tmp10 - tmp11;
                const dst12 = tmp2 * m22 + tmp5 * m32 + tmp1 * m12 - (tmp4 * m32 + tmp0 * m12 + tmp3 * m22);
                const dst13 = tmp8 * m32 + tmp0 * m02 + tmp7 * m22 - (tmp6 * m22 + tmp9 * m32 + tmp1 * m02);
                const dst14 = tmp6 * m12 + tmp11 * m32 + tmp3 * m02 - (tmp10 * m32 + tmp2 * m02 + tmp7 * m12);

                det = 1 / det;

                rst = rst || this;
                const eRst = rst.elements;

                eRst[0] = dst0 * det;
                eRst[1] = dst4 * det;
                eRst[2] = dst8 * det;
                eRst[3] = dst12 * det;

                eRst[4] = dst1 * det;
                eRst[5] = dst5 * det;
                eRst[6] = dst9 * det;
                eRst[7] = dst13 * det;

                eRst[8] = dst2 * det;
                eRst[9] = dst6 * det;
                eRst[10] = dst10 * det;
                eRst[11] = dst14 * det;

                return rst;
            } else {
                return null;
            }
        }

        public invert44(rst: Matrix44 = null): Matrix44 {
            const e = this.elements;
            const m00 = e[0], m10 = e[1], m20 = e[2], m30 = e[3], m01 = e[4], m11 = e[5], m21 = e[6], m31 = e[7], m02 = e[8], m12 = e[9], m22 = e[10], m32 = e[11], m03 = e[12], m13 = e[13], m23 = e[14], m33 = e[15];

            let tmp0 = m22 * m33;
            let tmp1 = m32 * m23;
            let tmp2 = m12 * m33;
            let tmp3 = m32 * m13;
            let tmp4 = m12 * m23;
            let tmp5 = m22 * m13;
            let tmp6 = m02 * m33;
            let tmp7 = m32 * m03;
            let tmp8 = m02 * m23;
            let tmp9 = m22 * m03;
            let tmp10 = m02 * m13;
            let tmp11 = m12 * m03;

            const dst0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
            const dst1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
            const dst2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
            const dst3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);

            let det = m00 * dst0 + m10 * dst1 + m20 * dst2 + m30 * dst3;
            if (det > MathUtils.ZERO_TOLERANCE || det < -MathUtils.ZERO_TOLERANCE) {
                const dst4 = tmp1 * m10 + tmp2 * m20 + tmp5 * m30 - (tmp0 * m10 + tmp3 * m20 + tmp4 * m30);
                const dst5 = tmp0 * m00 + tmp7 * m20 + tmp8 * m30 - (tmp1 * m00 + tmp6 * m20 + tmp9 * m30);
                const dst6 = tmp3 * m00 + tmp6 * m10 + tmp11 * m30 - (tmp2 * m00 + tmp7 * m10 + tmp10 * m30);
                const dst7 = tmp4 * m00 + tmp9 * m10 + tmp10 * m20 - (tmp5 * m00 + tmp8 * m10 + tmp11 * m20);

                tmp0 = m20 * m31;
                tmp1 = m30 * m21;
                tmp2 = m10 * m31;
                tmp3 = m30 * m11;
                tmp4 = m10 * m21;
                tmp5 = m20 * m11;
                tmp6 = m00 * m31;
                tmp7 = m30 * m01;
                tmp8 = m00 * m21;
                tmp9 = m20 * m01;
                tmp10 = m00 * m11;
                tmp11 = m10 * m01;

                const dst8 = tmp0 * m13 + tmp3 * m23 + tmp4 * m33 - (tmp1 * m13 + tmp2 * m23 + tmp5 * m33);
                const dst9 = tmp1 * m03 + tmp6 * m23 + tmp9 * m33 - (tmp0 * m03 + tmp7 * m23 + tmp8 * m33);
                const dst10 = tmp2 * m03 + tmp7 * m13 + tmp10 * m33 - (tmp3 * m03 + tmp6 * m13 + tmp11 * m33);
                const dst11 = tmp5 * m03 + tmp8 * m13 + tmp11 * m23 - (tmp4 * m03 + tmp9 * m13 + tmp10 * m23);
                const dst12 = tmp2 * m22 + tmp5 * m32 + tmp1 * m12 - (tmp4 * m32 + tmp0 * m12 + tmp3 * m22);
                const dst13 = tmp8 * m32 + tmp0 * m02 + tmp7 * m22 - (tmp6 * m22 + tmp9 * m32 + tmp1 * m02);
                const dst14 = tmp6 * m12 + tmp11 * m32 + tmp3 * m02 - (tmp10 * m32 + tmp2 * m02 + tmp7 * m12);
                const dst15 = tmp10 * m22 + tmp4 * m02 + tmp9 * m12 - (tmp8 * m12 + tmp11 * m22 + tmp5 * m02);

                det = 1 / det;

                rst = rst || this;
                const eRst = rst.elements;

                eRst[0] = dst0 * det;
                eRst[1] = dst4 * det;
                eRst[2] = dst8 * det;
                eRst[3] = dst12 * det;

                eRst[4] = dst1 * det;
                eRst[5] = dst5 * det;
                eRst[6] = dst9 * det;
                eRst[7] = dst13 * det;

                eRst[8] = dst2 * det;
                eRst[9] = dst6 * det;
                eRst[10] = dst10 * det;
                eRst[11] = dst14 * det;

                eRst[12] = dst3 * det;
                eRst[13] = dst7 * det;
                eRst[14] = dst11 * det;
                eRst[15] = dst15 * det;

                return rst;
            } else {
                return null;
            }
        }

        public append34(m: Matrix44, rst: Matrix44 = null): Matrix44 {
            const a = this.elements;
            const b = m.elements;

            const b00 = b[0], b10 = b[1], b20 = b[2], b01 = b[4], b11 = b[5], b21 = b[6], b02 = b[8], b12 = b[9], b22 = b[10];

            let a0 = a[0], a1 = a[1], a2 = a[2];
            const m00 = a0 * b00 + a1 * b10 + a2 * b20;
            const m01 = a0 * b01 + a1 * b11 + a2 * b21;
            const m02 = a0 * b02 + a1 * b12 + a2 * b22;

            a0 = a[4], a1 = a[5], a2 = a[6];
            const m10 = a0 * b00 + a1 * b10 + a2 * b20;
            const m11 = a0 * b01 + a1 * b11 + a2 * b21;
            const m12 = a0 * b02 + a1 * b12 + a2 * b22;

            a0 = a[8], a1 = a[9], a2 = a[10];
            const m20 = a0 * b00 + a1 * b10 + a2 * b20;
            const m21 = a0 * b01 + a1 * b11 + a2 * b21;
            const m22 = a0 * b02 + a1 * b12 + a2 * b22;

            a0 = a[12], a1 = a[13], a2 = a[14];
            const m30 = a0 * b00 + a1 * b10 + a2 * b20 + b[3];
            const m31 = a0 * b01 + a1 * b11 + a2 * b21 + b[7];
            const m32 = a0 * b02 + a1 * b12 + a2 * b22 + b[11];

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

        public append44(m: Matrix44, rst: Matrix44 = null): Matrix44 {
            const a = this.elements;
            const b = m.elements;

            const b00 = b[0], b10 = b[1], b20 = b[2], b30 = b[3], b01 = b[4], b11 = b[5], b21 = b[6], b31 = b[7], b02 = b[8], b12 = b[9], b22 = b[10], b32 = b[11], b03 = b[12], b13 = b[13], b23 = b[14], b33 = b[15];

            let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
            const m00 = a0 * b00 + a1 * b10 + a2 * b20 + a3 * b30;
            const m01 = a0 * b01 + a1 * b11 + a2 * b21 + a3 * b31;
            const m02 = a0 * b02 + a1 * b12 + a2 * b22 + a3 * b32;
            const m03 = a0 * b03 + a1 * b13 + a2 * b23 + a3 * b33;

            a0 = a[4], a1 = a[5], a2 = a[6], a3 = a[7];
            const m10 = a0 * b00 + a1 * b10 + a2 * b20 + a3 * b30;
            const m11 = a0 * b01 + a1 * b11 + a2 * b21 + a3 * b31;
            const m12 = a0 * b02 + a1 * b12 + a2 * b22 + a3 * b32;
            const m13 = a0 * b03 + a1 * b13 + a2 * b23 + a3 * b33;

            a0 = a[8], a1 = a[9], a2 = a[10], a3 = a[11];
            const m20 = a0 * b00 + a1 * b10 + a2 * b20 + a3 * b30;
            const m21 = a0 * b01 + a1 * b11 + a2 * b21 + a3 * b31;
            const m22 = a0 * b02 + a1 * b12 + a2 * b22 + a3 * b32;
            const m23 = a0 * b03 + a1 * b13 + a2 * b23 + a3 * b33;

            a0 = a[12], a1 = a[13], a2 = a[14], a3 = a[15];
            const m30 = a0 * b00 + a1 * b10 + a2 * b20 + a3 * b30;
            const m31 = a0 * b01 + a1 * b11 + a2 * b21 + a3 * b31;
            const m32 = a0 * b02 + a1 * b12 + a2 * b22 + a3 * b32;
            const m33 = a0 * b03 + a1 * b13 + a2 * b23 + a3 * b33;

            rst = rst || this;
            const to = rst.elements;

            to[0] = m00;
            to[1] = m01;
            to[2] = m02;
            to[3] = m03;

            to[4] = m10;
            to[5] = m11;
            to[6] = m12;
            to[7] = m13;

            to[8] = m20;
            to[9] = m21;
            to[10] = m22;
            to[11] = m23;

            to[12] = m30;
            to[13] = m31;
            to[14] = m32;
            to[15] = m33;

            return rst;
        }

        /** local scale. */
        public prependScale34XYZ(x: number = 1, y: number = 1, z: number = 1): void {
            const e = this.elements;

            e[0] *= x;
            e[1] *= y;
            e[2] *= z;

            e[4] *= x;
            e[5] *= y;
            e[6] *= z;

            e[8] *= x;
            e[9] *= y;
            e[10] *= z;
        }

        public prependScale34Vector3(scale: Vector3): void {
            this.prependScale34XYZ(scale.x, scale.y, scale.z);
        }

        public prependScale44XYZ(x: number = 1, y: number = 1, z: number = 1): void {
            const e = this.elements;

            e[0] *= x;
            e[1] *= y;
            e[2] *= z;

            e[4] *= x;
            e[5] *= y;
            e[6] *= z;

            e[8] *= x;
            e[9] *= y;
            e[10] *= z;

            e[12] *= x;
            e[13] *= y;
            e[14] *= z;
        }

        public prependScale44Vector3(scale: Vector3): void {
            this.prependScale44XYZ(scale.x, scale.y, scale.z);
        }

        /** local translate. */
        public prependTranslate34XYZ(x: number = 0, y: number = 0, z: number = 0): void {
            const e = this.elements;

            e[3] += x * e[0] + y * e[1] + z * e[2];
            e[7] += x * e[4] + y * e[5] + z * e[6];
            e[11] += x * e[8] + y * e[9] + z * e[10];
        }

        public prependTranslate44XYZ(x: number = 0, y: number = 0, z: number = 0): void {
            const e = this.elements;

            e[3] += x * e[0] + y * e[1] + z * e[2];
            e[7] += x * e[4] + y * e[5] + z * e[6];
            e[11] += x * e[8] + y * e[9] + z * e[10];
            e[12] += x * e[13] + y * e[14] + z * e[15];
        }

        public transform33XYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            const e = this.elements;

            const dstX = x * e[0] + y * e[1] + z * e[2];
            const dstY = x * e[4] + y * e[5] + z * e[6];
            const dstZ = x * e[8] + y * e[9] + z * e[10];

            return rst ? rst.setFromNumbers(dstX, dstY, dstZ) : new Vector3(dstX, dstY, dstZ);
        }

        public transform33Vector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.transform33XYZ(vec3.x, vec3.y, vec3.z, rst);
        }

        public transform34XYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            const e = this.elements;

            const dstX = x * e[0] + y * e[1] + z * e[2] + e[3];
            const dstY = x * e[4] + y * e[5] + z * e[6] + e[7];
            const dstZ = x * e[8] + y * e[9] + z * e[10] + e[11];

            return rst ? rst.setFromNumbers(dstX, dstY, dstZ) : new Vector3(dstX, dstY, dstZ);
        }

        public transform34Z(x: number = 0, y: number = 0, z: number = 0): number {
            const e = this.elements;
            return x * e[8] + y * e[9] + z * e[10] + e[11];
        }

        public transform34Vector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.transform34XYZ(vec3.x, vec3.y, vec3.z, rst);
        }

        public transform44XY(x: number = 0, y: number = 0, rst: Vector2 = null): Vector2 {
            const e = this.elements;

            const w = x * e[8] + y * e[9] + e[11];
            const dstX = (x * e[0] + y * e[1] + e[3]) / w;
            const dstY = (x * e[4] + y * e[5] + e[7]) / w;

            return rst ? rst.setFromNumbers(dstX, dstY) : new Vector2(dstX, dstY);
        }

        public transform44XYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            const e = this.elements;

            const w = x * e[8] + y * e[9] + z * e[10] + e[11];
            const dstX = (x * e[0] + y * e[1] + z * e[2] + e[3]) / w;
            const dstY = (x * e[4] + y * e[5] + z * e[6] + e[7]) / w;
            const dstZ = (x * e[8] + y * e[9] + z * e[10] + e[11]) / w;

            return rst ? rst.setFromNumbers(dstX, dstY, dstZ) : new Vector3(dstX, dstY, dstZ);
        }

        public transform44Vector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.transform44XYZ(vec3.x, vec3.y, vec3.z, rst);
        }

        public transform44XYZW(x: number = 0, y: number = 0, z: number = 0, w: number, rst: Vector4 = null): Vector4 {
            const e = this.elements;

            const dstX = x * e[0] + y * e[1] + z * e[2] + w * e[3];
            const dstY = x * e[4] + y * e[5] + z * e[6] + w * e[7];
            const dstZ = x * e[8] + y * e[9] + z * e[10] + w * e[11];
            const dstW = x * e[12] + y * e[13] + z * e[14] + w * e[15];

            return rst ? rst.setFromNumbers(dstX, dstY, dstZ, dstW) : new Vector4(dstX, dstY, dstZ, dstW);
        }

        public transform44Vector4(vec4: Vector4, rst: Vector4 = null): Vector4 {
            return this.transform44XYZW(vec4.x, vec4.y, vec4.z, vec4.w, rst);
        }

        public toArray33(columnMajor: boolean = false, rst: FloatArray = null): FloatArray {
            const e = this.elements;

            rst = rst || [];

            rst[0] = e[0];
            rst[4] = e[5];
            rst[8] = e[10];

            if (columnMajor) {
                rst[1] = e[1];
                rst[2] = e[2];

                rst[3] = e[4];
                rst[5] = e[6];

                rst[6] = e[8];
                rst[7] = e[9];
            } else {
                rst[1] = e[4];
                rst[2] = e[8];

                rst[3] = e[1];
                rst[5] = e[9];

                rst[6] = e[2];
                rst[7] = e[6];
            }

            return rst;
        }

        public toArray34(columnMajor: boolean = false, rst: FloatArray = null): FloatArray {
            const e = this.elements;

            rst = rst || [];

            if (columnMajor) {
                for (let i = 0; i < 12; ++i) rst[i] = e[i];
            } else {
                rst[0] = e[0];
                rst[1] = e[4];
                rst[2] = e[8];

                rst[3] = e[1];
                rst[4] = e[5];
                rst[5] = e[9];

                rst[6] = e[2];
                rst[7] = e[6];
                rst[8] = e[10];

                rst[9] = e[3];
                rst[10] = e[7];
                rst[11] = e[11];
            }

            return rst;
        }

        public toArray44(columnMajor: boolean = false, rst: FloatArray = null): FloatArray {
            const e = this.elements;

            rst = rst || [];

            if (columnMajor) {
                for (let i = 0; i < 16; ++i) rst[i] = e[i];
            } else {
                rst[0] = e[0];
                rst[1] = e[4];
                rst[2] = e[8];
                rst[3] = e[12];

                rst[4] = e[1];
                rst[5] = e[5];
                rst[6] = e[9];
                rst[7] = e[13];

                rst[8] = e[2];
                rst[9] = e[6];
                rst[10] = e[10];
                rst[11] = e[14];

                rst[12] = e[3];
                rst[13] = e[7];
                rst[14] = e[11];
                rst[15] = e[15];
            }

            return rst;
        }
    }
}