namespace MITOIA {
    export class Matrix44 {
        public m00: number;
        public m01: number;
        public m02: number;
        public m03: number;
        public m10: number;
        public m11: number;
        public m12: number;
        public m13: number;
        public m20: number;
        public m21: number;
        public m22: number;
        public m23: number;
        public m30: number;
        public m31: number;
        public m32: number;
        public m33: number;

        constructor(m00: number = 1, m01: number = 0, m02: number = 0, m03: number = 0,
            m10: number = 0, m11: number = 1, m12: number = 0, m13: number = 0,
            m20: number = 0, m21: number = 0, m22: number = 1, m23: number = 0,
            m30: number = 0, m31: number = 0, m32: number = 0, m33: number = 1) {
            this.m00 = m00;
            this.m01 = m01;
            this.m02 = m02;
            this.m03 = m03;

            this.m10 = m10;
            this.m11 = m11;
            this.m12 = m12;
            this.m13 = m13;

            this.m20 = m20;
            this.m21 = m21;
            this.m22 = m22;
            this.m23 = m23;

            this.m30 = m30;
            this.m31 = m31;
            this.m32 = m32;
            this.m33 = m33;
        }

        public static createOrthoLHMatrix(width: number, height: number, zNear: number, zFar: number, rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();
            rst.set44(2 / width, 0, 0, 0,
                0, 2 / height, 0, 0,
                0, 0, 1 / (zFar - zNear), 0,
                0, 0, zNear / (zNear - zFar));

            return rst;
        }

        /**
		 * aspectRatio = width / height
		 */
        public static createPerspectiveFieldOfViewLHMatrix(fieldOfViewY: number, aspectRatio: number, zNear: number, zFar: number, rst: Matrix44 = null): Matrix44 {
            let yScale: number = 1 / Math.tan(fieldOfViewY * 0.5);
            let xScale: number = yScale / aspectRatio;

            rst = rst || new Matrix44();
            rst.set44(xScale, 0, 0, 0,
                0, yScale, 0, 0,
                0, 0, zFar / (zFar - zNear), 1,
                0, 0, zNear * zFar / (zNear - zFar), 0);

            return rst;
        }

        public static createPerspectiveLHMatrix(width: number, height: number, zNear: number, zFar: number, rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();
            rst.set44(2 * zNear / width, 0, 0, 0,
                0, 2 * zNear / height, 0, 0,
                0, 0, zFar / (zFar - zNear), 1,
                0, 0, zNear * zFar / (zNear - zFar), 0);

            return rst;
        }

        public set34(m00: number = 1, m01: number = 0, m02: number = 0,
            m10: number = 0, m11: number = 1, m12: number = 0,
            m20: number = 0, m21: number = 0, m22: number = 1,
            m30: number = 0, m31: number = 0, m32: number = 0): Matrix44 {
            this.m00 = m00;
            this.m01 = m01;
            this.m02 = m02;

            this.m10 = m10;
            this.m11 = m11;
            this.m12 = m12;

            this.m20 = m20;
            this.m21 = m21;
            this.m22 = m22;

            this.m30 = m30;
            this.m31 = m31;
            this.m32 = m32;

            return this;
        }

        public set44(m00: number = 1, m01: number = 0, m02: number = 0, m03: number = 0,
            m10: number = 0, m11: number = 1, m12: number = 0, m13: number = 0,
            m20: number = 0, m21: number = 0, m22: number = 1, m23: number = 0,
            m30: number = 0, m31: number = 0, m32: number = 0, m33: number = 1): Matrix44 {
            this.m00 = m00;
            this.m01 = m01;
            this.m02 = m02;
            this.m03 = m03;

            this.m10 = m10;
            this.m11 = m11;
            this.m12 = m12;
            this.m13 = m13;

            this.m20 = m20;
            this.m21 = m21;
            this.m22 = m22;
            this.m23 = m23;

            this.m30 = m30;
            this.m31 = m31;
            this.m32 = m32;
            this.m33 = m33;

            return this;
        }

        public set34FromMatrix(m: Matrix44): Matrix44 {
            this.m00 = m.m00;
            this.m01 = m.m01;
            this.m02 = m.m02;

            this.m10 = m.m10;
            this.m11 = m.m11;
            this.m12 = m.m12;

            this.m20 = m.m20;
            this.m21 = m.m21;
            this.m22 = m.m22;

            this.m30 = m.m30;
            this.m31 = m.m31;
            this.m32 = m.m32;

            return this;
        }

        public set44FromMatrix(m: Matrix44): Matrix44 {
            this.m00 = m.m00;
            this.m01 = m.m01;
            this.m02 = m.m02;
            this.m03 = m.m03;

            this.m10 = m.m10;
            this.m11 = m.m11;
            this.m12 = m.m12;
            this.m13 = m.m13;

            this.m20 = m.m20;
            this.m21 = m.m21;
            this.m22 = m.m22;
            this.m23 = m.m23;

            this.m30 = m.m30;
            this.m31 = m.m31;
            this.m32 = m.m32;
            this.m33 = m.m33;

            return this;
        }

        public clone(): Matrix44 {
            return new Matrix44(this.m00, this.m01, this.m02, this.m03,
                this.m10, this.m11, this.m12, this.m13,
                this.m20, this.m21, this.m22, this.m23,
                this.m30, this.m31, this.m32, this.m33);
        }

        public identity(): void {
            this.m00 = 1;
            this.m01 = 0;
            this.m02 = 0;
            this.m03 = 0;

            this.m10 = 0;
            this.m11 = 1;
            this.m12 = 0;
            this.m13 = 0;

            this.m20 = 0;
            this.m21 = 0;
            this.m22 = 1;
            this.m23 = 0;

            this.m30 = 0;
            this.m31 = 0;
            this.m32 = 0;
            this.m33 = 1;
        }

        public transpose(rst: Matrix44): Matrix44 {
            rst = rst || this;

            let n01: number = this.m01;
            let n02: number = this.m02;
            let n03: number = this.m03;
            let n10: number = this.m10;
            let n11: number = this.m11;
            let n12: number = this.m12;
            let n13: number = this.m13;
            let n20: number = this.m20;
            let n21: number = this.m21;
            let n22: number = this.m22;
            let n23: number = this.m23;
            let n30: number = this.m30;
            let n31: number = this.m31;
            let n32: number = this.m32;

            rst.m01 = n10;
            rst.m02 = n20;
            rst.m03 = n30;
            rst.m10 = n01;
            rst.m11 = n11;
            rst.m12 = n21;
            rst.m13 = n31;
            rst.m20 = n02;
            rst.m21 = n12;
            rst.m22 = n22;
            rst.m23 = n32;
            rst.m30 = n03;
            rst.m31 = n13;
            rst.m32 = n23;

            return rst;
        }

        public decomposition(rstRot: Matrix44, rstScale: Vector3 = null): void {
            rstRot = rstRot || new Matrix44();

            rstRot.m00 = this.m00;
            rstRot.m01 = this.m01;
            rstRot.m02 = this.m02;
            rstRot.m03 = 1;

            let len: number = this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02;
            if (len != 1.0 && len != 0.0) {
                len = Math.sqrt(len);

                rstRot.m00 /= len;
                rstRot.m01 /= len;
                rstRot.m02 /= len;
            }

            let dot: number = rstRot.m00 * this.m10 + rstRot.m01 * this.m11 + rstRot.m02 * this.m12;
            rstRot.m10 = this.m10 - rstRot.m00 * dot;
            rstRot.m11 = this.m11 - rstRot.m01 * dot;
            rstRot.m12 = this.m12 - rstRot.m02 * dot;

            len = rstRot.m10 * rstRot.m10 + rstRot.m11 * rstRot.m11 + rstRot.m12 * rstRot.m12;
            if (len != 1.0 && len != 0.0) {
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
            let s: number;
            let tr: number = this.m00 + this.m11 + this.m22;
            if (tr > 0) {
                s = Math.sqrt(tr + 1);
                rst.w = s * 0.5;
                s = 0.5 / s;
                rst.x = (this.m12 - this.m21) * s;
                rst.y = (this.m20 - this.m02) * s;
                rst.z = (this.m01 - this.m10) * s;
            } else {
                let quatIndex = 0;
                if (this.m11 > this.m00) quatIndex = 1;
                if (quatIndex == 0) {
                    if (this.m22 > this.m00) quatIndex = 2;
                } else {
                    if (this.m22 > this.m11) quatIndex = 2;
                }
                if (quatIndex == 0) {
                    s = Math.sqrt((this.m00 - (this.m11 + this.m22)) + 1);
                    rst.x = s * 0.5;
                    if (s != 0) s = 0.5 / s;
                    rst.y = (this.m01 + this.m10) * s;
                    rst.z = (this.m02 + this.m20) * s;
                    rst.w = (this.m12 - this.m21) * s;
                } else if (quatIndex == 1) {
                    s = Math.sqrt((this.m11 - (this.m22 + this.m00)) + 1);
                    rst.y = s * 0.5;
                    if (s != 0) s = 0.5 / s;
                    rst.z = (this.m12 + this.m21) * s;
                    rst.x = (this.m10 + this.m01) * s;
                    rst.w = (this.m20 - this.m02) * s;
                } else {
                    s = Math.sqrt((this.m22 - (this.m00 + this.m11)) + 1);
                    rst.z = s * 0.5;
                    if (s != 0) s = 0.5 / s;
                    rst.x = (this.m20 + this.m02) * s;
                    rst.y = (this.m21 + this.m12) * s;
                    rst.w = (this.m01 - this.m10) * s;
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

        public invert(rst: Matrix44 = null): boolean {
            let tmp0: number = this.m22 * this.m33;
            let tmp1: number = this.m32 * this.m23;
            let tmp2: number = this.m12 * this.m33;
            let tmp3: number = this.m32 * this.m13;
            let tmp4: number = this.m12 * this.m23;
            let tmp5: number = this.m22 * this.m13;
            let tmp6: number = this.m02 * this.m33;
            let tmp7: number = this.m32 * this.m03;
            let tmp8: number = this.m02 * this.m23;
            let tmp9: number = this.m22 * this.m03;
            let tmp10: number = this.m02 * this.m13;
            let tmp11: number = this.m12 * this.m03;

            let dst0: number = tmp0 * this.m11 + tmp3 * this.m21 + tmp4 * this.m31 - (tmp1 * this.m11 + tmp2 * this.m21 + tmp5 * this.m31);
            let dst1: number = tmp1 * this.m01 + tmp6 * this.m21 + tmp9 * this.m31 - (tmp0 * this.m01 + tmp7 * this.m21 + tmp8 * this.m31);
            let dst2: number = tmp2 * this.m01 + tmp7 * this.m11 + tmp10 * this.m31 - (tmp3 * this.m01 + tmp6 * this.m11 + tmp11 * this.m31);
            let dst3: number = tmp5 * this.m01 + tmp8 * this.m11 + tmp11 * this.m21 - (tmp4 * this.m01 + tmp9 * this.m11 + tmp10 * this.m21);
            let dst4: number = tmp1 * this.m10 + tmp2 * this.m20 + tmp5 * this.m30 - (tmp0 * this.m10 + tmp3 * this.m20 + tmp4 * this.m30);
            let dst5: number = tmp0 * this.m00 + tmp7 * this.m20 + tmp8 * this.m30 - (tmp1 * this.m00 + tmp6 * this.m20 + tmp9 * this.m30);
            let dst6: number = tmp3 * this.m00 + tmp6 * this.m10 + tmp11 * this.m30 - (tmp2 * this.m00 + tmp7 * this.m10 + tmp10 * this.m30);
            let dst7: number = tmp4 * this.m00 + tmp9 * this.m10 + tmp10 * this.m20 - (tmp5 * this.m00 + tmp8 * this.m10 + tmp11 * this.m20);

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

            let dst8: number = tmp0 * this.m13 + tmp3 * this.m23 + tmp4 * this.m33 - (tmp1 * this.m13 + tmp2 * this.m23 + tmp5 * this.m33);
            let dst9: number = tmp1 * this.m03 + tmp6 * this.m23 + tmp9 * this.m33 - (tmp0 * this.m03 + tmp7 * this.m23 + tmp8 * this.m33);
            let dst10: number = tmp2 * this.m03 + tmp7 * this.m13 + tmp10 * this.m33 - (tmp3 * this.m03 + tmp6 * this.m13 + tmp11 * this.m33);
            let dst11: number = tmp5 * this.m03 + tmp8 * this.m13 + tmp11 * this.m23 - (tmp4 * this.m03 + tmp9 * this.m13 + tmp10 * this.m23);
            let dst12: number = tmp2 * this.m22 + tmp5 * this.m32 + tmp1 * this.m12 - (tmp4 * this.m32 + tmp0 * this.m12 + tmp3 * this.m22);
            let dst13: number = tmp8 * this.m32 + tmp0 * this.m02 + tmp7 * this.m22 - (tmp6 * this.m22 + tmp9 * this.m32 + tmp1 * this.m02);
            let dst14: number = tmp6 * this.m12 + tmp11 * this.m32 + tmp3 * this.m02 - (tmp10 * this.m32 + tmp2 * this.m02 + tmp7 * this.m12);
            let dst15: number = tmp10 * this.m22 + tmp4 * this.m02 + tmp9 * this.m12 - (tmp8 * this.m12 + tmp11 * this.m22 + tmp5 * this.m02);

            let det: number = this.m00 * dst0 + this.m10 * dst1 + this.m20 * dst2 + this.m30 * dst3;

            if (det === 0.0) {
                return false;
            } else {
                det = 1.0 / det;

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

                return true;
            }
        }

        public append34(m: Matrix44, rst: Matrix44 = null): void {
            let m00: number = this.m00 * m.m00 + this.m01 * m.m10 + this.m02 * m.m20;
            let m01: number = this.m00 * m.m01 + this.m01 * m.m11 + this.m02 * m.m21;
            let m02: number = this.m00 * m.m02 + this.m01 * m.m12 + this.m02 * m.m22;

            let m10: number = this.m10 * m.m00 + this.m11 * m.m10 + this.m12 * m.m20;
            let m11: number = this.m10 * m.m01 + this.m11 * m.m11 + this.m12 * m.m21;
            let m12: number = this.m10 * m.m02 + this.m11 * m.m12 + this.m12 * m.m22;

            let m20: number = this.m20 * m.m00 + this.m21 * m.m10 + this.m22 * m.m20;
            let m21: number = this.m20 * m.m01 + this.m21 * m.m11 + this.m22 * m.m21;
            let m22: number = this.m20 * m.m02 + this.m21 * m.m12 + this.m22 * m.m22;

            let m30: number = this.m30 * m.m00 + this.m31 * m.m10 + this.m32 * m.m20 + m.m30;
            let m31: number = this.m30 * m.m01 + this.m31 * m.m11 + this.m32 * m.m21 + m.m31;
            let m32: number = this.m30 * m.m02 + this.m31 * m.m12 + this.m32 * m.m22 + m.m32;

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
        }

        public append44(m: Matrix44, rst: Matrix44 = null): void {
            let m00: number = this.m00 * m.m00 + this.m01 * m.m10 + this.m02 * m.m20 + this.m03 * m.m30;
            let m01: number = this.m00 * m.m01 + this.m01 * m.m11 + this.m02 * m.m21 + this.m03 * m.m31;
            let m02: number = this.m00 * m.m02 + this.m01 * m.m12 + this.m02 * m.m22 + this.m03 * m.m32;
            let m03: number = this.m00 * m.m03 + this.m01 * m.m13 + this.m02 * m.m23 + this.m03 * m.m33;

            let m10: number = this.m10 * m.m00 + this.m11 * m.m10 + this.m12 * m.m20 + this.m13 * m.m30;
            let m11: number = this.m10 * m.m01 + this.m11 * m.m11 + this.m12 * m.m21 + this.m13 * m.m31;
            let m12: number = this.m10 * m.m02 + this.m11 * m.m12 + this.m12 * m.m22 + this.m13 * m.m32;
            let m13: number = this.m10 * m.m03 + this.m11 * m.m13 + this.m12 * m.m23 + this.m13 * m.m33;

            let m20: number = this.m20 * m.m00 + this.m21 * m.m10 + this.m22 * m.m20 + this.m23 * m.m30;
            let m21: number = this.m20 * m.m01 + this.m21 * m.m11 + this.m22 * m.m21 + this.m23 * m.m31;
            let m22: number = this.m20 * m.m02 + this.m21 * m.m12 + this.m22 * m.m22 + this.m23 * m.m32;
            let m23: number = this.m20 * m.m03 + this.m21 * m.m13 + this.m22 * m.m23 + this.m23 * m.m33;

            let m30: number = this.m30 * m.m00 + this.m31 * m.m10 + this.m32 * m.m20 + this.m33 * m.m30;
            let m31: number = this.m30 * m.m01 + this.m31 * m.m11 + this.m32 * m.m21 + this.m33 * m.m31;
            let m32: number = this.m30 * m.m02 + this.m31 * m.m12 + this.m32 * m.m22 + this.m33 * m.m32;
            let m33: number = this.m30 * m.m03 + this.m31 * m.m13 + this.m32 * m.m23 + this.m33 * m.m33;

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

        public transform34XYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            let dstX: number = x * this.m00 + y * this.m10 + z * this.m20 + this.m30;
            let dstY: number = x * this.m01 + y * this.m11 + z * this.m21 + this.m31;
            let dstZ: number = x * this.m02 + y * this.m12 + z * this.m22 + this.m32;

            return rst ? rst.setFromXYZ(dstX, dstY, dstZ) : new Vector3(dstX, dstY, dstZ);
        }

        public transform34Z(x: number = 0, y: number = 0, z: number = 0): number {
            return x * this.m02 + y * this.m12 + z * this.m22 + this.m32;
        }

        public transform34Vector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.transform34XYZ(vec3.x, vec3.y, vec3.z, rst);
        }
    }
}