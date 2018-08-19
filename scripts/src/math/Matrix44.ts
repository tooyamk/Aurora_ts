namespace MITOIA {
    /**
	 * m00 m01 m02 m03  axisX                                                                                       
	 * m10 m11 m12 m13  axisY                                                                                                                                                    
	 * m20 m21 m22 m23  axisZ                                                                                       
	 * m30 m31 m32 m33
     * 
	 * x' = x * m00 + y * m10 + z * m20 + w * m30                                                           
	 * y' = x * m01 + y * m11 + z * m21 + w * m31                                                                       
	 * z' = x * m02 + y * m12 + z * m22 + w * m32                                                                       
	 * w' = x * m03 + y * m13 + z * m23 + w * m33
     * 
     * @see https://docs.microsoft.com/en-us/previous-versions/windows/desktop/bb281696(v%3dvs.85)
	 */
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
            rst.set44(
                2 / width, 0, 0, 0,
                0, 2 / height, 0, 0,
                0, 0, 1 / (zFar - zNear), 0,
                0, 0, zNear / (zNear - zFar), 1);

            return rst;
        }

        /**
         * Builds a left-handed perspective projection matrix based on a field of view.
         * 
         * @param fieldOfViewY radian,Field of view in the y direction, in radians..
		 * @param aspectRatio width / height.
		 */
        public static createPerspectiveFovLHMatrix(fieldOfViewY: number, aspectRatio: number, zNear: number, zFar: number, rst: Matrix44 = null): Matrix44 {
            let yScale = 1 / Math.tan(fieldOfViewY * 0.5);
            let xScale = yScale / aspectRatio;

            rst = rst || new Matrix44();
            rst.set44(
                xScale, 0, 0, 0,
                0, yScale, 0, 0,
                0, 0, zFar / (zFar - zNear), 1,
                0, 0, zNear * zFar / (zNear - zFar), 0);

            return rst;
        }

        public static createPerspectiveLHMatrix(width: number, height: number, zNear: number, zFar: number, rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();
            let zNear2 = zNear * 2;
            rst.set44(
                zNear2 / width, 0, 0, 0,
                0, zNear2 / height, 0, 0,
                0, 0, zFar / (zFar - zNear), 1,
                0, 0, zNear * zFar / (zNear - zFar), 0);

            return rst;
        }

        /**
         * Builds a customized, left-handed perspective projection matrix.
         */
        public static createPerspectiveOffCenterLH(left: number, right: number, bottom: number, top: number, zNear: number, zFar: number, rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();
            let zNear2 = zNear * 2;
            rst.set44(
                zNear2 / (right - left), 0, 0, 0,
                0, zNear2 / (top - bottom), 0, 0,
                (left + right) / (left - right), (top + bottom) / (bottom - top), zFar / (zFar - zNear), 1,
                0, 0, zNear * zFar / (zNear - zFar), 0);

            return rst;
        }

        public static createLookAtLHMatrix(eye: Vector3, at: Vector3, up: Vector3, rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();

            let axisZ_X = at.x - eye.x;
            let axisZ_Y = at.y - eye.y;
            let axisZ_Z = at.z - eye.z;

            let d = axisZ_X * axisZ_X + axisZ_Y * axisZ_Y + axisZ_Z * axisZ_Z;
            if (d != 1) {
                d = Math.sqrt(d);
                axisZ_X /= d;
                axisZ_Y /= d;
                axisZ_Z /= d;
            }

            let axisX_X = up.y * axisZ_Z - up.z * axisZ_Y;
            let axisX_Y = up.z * axisZ_X - up.x * axisZ_Z;
            let axisX_Z = up.x * axisZ_Y - up.y * axisZ_X;

            d = axisX_X * axisX_X + axisX_Y * axisX_Y + axisX_Z * axisX_Z;
            if (d != 1) {
                d = Math.sqrt(d);
                axisX_X /= d;
                axisX_Y /= d;
                axisX_Z /= d;
            }

            let axisY_X = axisZ_Y * axisX_Z - axisZ_Z * axisX_Y;
            let axisY_Y = axisZ_Z * axisX_X - axisZ_X * axisX_Z;
            let axisY_Z = axisZ_X * axisX_Y - axisZ_Y * axisX_X;

            rst.m00 = axisX_X;
            rst.m01 = axisX_Y;
            rst.m02 = axisX_Z;
            rst.m03 = 0;

            rst.m10 = axisY_X;
            rst.m11 = axisY_Y;
            rst.m12 = axisY_Z;
            rst.m13 = 0;

            rst.m20 = axisZ_X;
            rst.m21 = axisZ_Y;
            rst.m22 = axisZ_Z;
            rst.m23 = 0;

            rst.m30 = eye.x;
            rst.m31 = eye.y;
            rst.m32 = eye.z;
            //rst.m30 = -(axisX_X*eyeX+axisX_Y*eyeY+axisX_Z*eyeZ);
            //rst.m31 = -(axisY_X*eyeX+axisY_Y*eyeY+axisY_Z*eyeZ);
            //rst.m32 = -(axisZ_X*eyeX+axisZ_Y*eyeY+axisZ_Z*eyeZ);
            rst.m33 = 1;

            return rst;
        }

        public static createRotationAxisMatrix(axis: Vector3, radian: number, rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();

            let axisX = axis.x;
            let axisY = axis.y;
            let axisZ = axis.z;
            let sin = Math.sin(radian);
            let cos = Math.cos(radian);
            let cos1 = 1 - cos;
            let cos1x = cos1 * axisX;
            let cos1xy = cos1x * axisY;
            let cos1xz = cos1x * axisZ;
            let cos1y = cos1 * axisY;
            let cos1yz = cos1y * axisZ;
            let xsin = axisX * sin;
            let ysin = axisY * sin;
            let zsin = axisZ * sin;
            
            rst.m00 = cos + cos1x * axisX;
            rst.m01 = cos1xy - zsin;
            rst.m02 = cos1xz + ysin;
            rst.m03 = 0;

            rst.m10 = cos1xy + zsin;
            rst.m11 = cos + cos1y * axisY;
            rst.m12 = cos1yz - xsin;
            rst.m13 = 0;

            rst.m20 = cos1xz - ysin;
            rst.m21 = cos1yz + xsin;
            rst.m22 = cos + cos1 * axisZ * axisZ;
            rst.m23 = 0;

            rst.m30 = 0;
            rst.m31 = 0;
            rst.m32 = 0;
            rst.m33 = 1;

            return rst;
        }

        /**
		 * direction(LH):(0, 1, 0) to (0, 0, 1)
		 */
        public static createRotationXMatrix(radian: number, rst: Matrix44 = null): Matrix44 {
            let sin = Math.sin(radian);
            let cos = Math.cos(radian);

            if (rst) {
                rst.set44(1, 0, 0, 0,
                    0, cos, sin, 0,
                    0, -sin, cos); 
            } else {
                rst = new Matrix44(1, 0, 0, 0,
                    0, cos, sin, 0,
                    0, -sin, cos); 
            }

            return rst;
        }
		/**
		 * direction(LH):(1, 0, 0) to (0, 0, -1)
		 */
        public static createRotationYMatrix(radian: number, rst: Matrix44 = null): Matrix44 {
            let sin = Math.sin(radian);
            let cos = Math.cos(radian);

            if (rst) {
                rst.set44(cos, 0, -sin, 0,
                    0, 1, 0, 0,
                    sin, 0, cos);
            } else {
                rst = new Matrix44(cos, 0, -sin, 0,
                    0, 1, 0, 0,
                    sin, 0, cos);
            }

            return rst;
        }
		/**
		 * direction(LH):(1, 0, 0) to (0, 1, 0)
		 */
        public static createRotationZMatrix(radian: number, rst: Matrix44 = null): Matrix44 {
            let sin = Math.sin(radian);
            let cos = Math.cos(radian);

            if (rst) {
                rst.set44(cos, sin, 0, 0,
                    -sin, cos);
            } else {
                rst = new Matrix44(cos, sin, 0, 0,
                    -sin, cos);
            }

            return rst;
        }

        public static createScaleMatrix(sx: number, sy: number, sz: number, rst: Matrix44 = null): Matrix44 {
            if (rst) {
                rst.set44(sx, 0, 0, 0,
                    0, sy, 0, 0,
                    0, 0, sz);
            } else {
                rst = new Matrix44(sx, 0, 0, 0,
                    0, sy, 0, 0,
                    0, 0, sz);
            }

            return rst;
        }
        public static createTranslationMatrix(tx: number, ty: number, tz: number, rst: Matrix44 = null): Matrix44 {
            if (rst) {
                rst.set44(1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    tx, ty, tz);
            } else {
                rst = new Matrix44(1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    tx, ty, tz);
            }

            return rst;
        }

        public static createTRSMatrix(translation: Vector3, rotation: Quaternion, scale: Vector3, rst: Matrix44 = null): Matrix44 {
            rst = rotation.toMatrix33(rst);
            rst.m00 *= scale.x;
            rst.m01 *= scale.x;
            rst.m02 *= scale.x;
            rst.m03 = 0;

            rst.m10 *= scale.y;
            rst.m11 *= scale.y;
            rst.m12 *= scale.y;
            rst.m13 = 0;

            rst.m20 *= scale.z;
            rst.m21 *= scale.z;
            rst.m22 *= scale.z;
            rst.m23 = 0;

            rst.m30 = translation.x;
            rst.m31 = translation.y;
            rst.m32 = translation.z;
            rst.m33 = 1;

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

        public transpose(rst: Matrix44 = null): Matrix44 {
            rst = rst || this;

            let n01 = this.m01;
            let n02 = this.m02;
            let n03 = this.m03;
            let n10 = this.m10;
            let n12 = this.m12;
            let n13 = this.m13;
            let n20 = this.m20;
            let n21 = this.m21;
            let n23 = this.m23;
            let n30 = this.m30;
            let n31 = this.m31;
            let n32 = this.m32;

            if (rst !== this) {
                rst.m00 = this.m00;
                rst.m11 = this.m11;
                rst.m22 = this.m22;
                rst.m33 = this.m33;
            }

            rst.m01 = n10;
            rst.m02 = n20;
            rst.m03 = n30;
            rst.m10 = n01;
            rst.m12 = n21;
            rst.m13 = n31;
            rst.m20 = n02;
            rst.m21 = n12;
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

            let len = this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02;
            if (len != 1.0 && len != 0.0) {
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
            let tr = this.m00 + this.m11 + this.m22;
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
                if (quatIndex === 0) {
                    if (this.m22 > this.m00) quatIndex = 2;
                } else {
                    if (this.m22 > this.m11) quatIndex = 2;
                }
                if (quatIndex === 0) {
                    s = Math.sqrt((this.m00 - (this.m11 + this.m22)) + 1);
                    rst.x = s * 0.5;
                    if (s != 0) s = 0.5 / s;
                    rst.y = (this.m01 + this.m10) * s;
                    rst.z = (this.m02 + this.m20) * s;
                    rst.w = (this.m12 - this.m21) * s;
                } else if (quatIndex === 1) {
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

            let dst0 = tmp0 * this.m11 + tmp3 * this.m21 + tmp4 * this.m31 - (tmp1 * this.m11 + tmp2 * this.m21 + tmp5 * this.m31);
            let dst1 = tmp1 * this.m01 + tmp6 * this.m21 + tmp9 * this.m31 - (tmp0 * this.m01 + tmp7 * this.m21 + tmp8 * this.m31);
            let dst2 = tmp2 * this.m01 + tmp7 * this.m11 + tmp10 * this.m31 - (tmp3 * this.m01 + tmp6 * this.m11 + tmp11 * this.m31);
            let dst3 = tmp5 * this.m01 + tmp8 * this.m11 + tmp11 * this.m21 - (tmp4 * this.m01 + tmp9 * this.m11 + tmp10 * this.m21);
            let dst4 = tmp1 * this.m10 + tmp2 * this.m20 + tmp5 * this.m30 - (tmp0 * this.m10 + tmp3 * this.m20 + tmp4 * this.m30);
            let dst5 = tmp0 * this.m00 + tmp7 * this.m20 + tmp8 * this.m30 - (tmp1 * this.m00 + tmp6 * this.m20 + tmp9 * this.m30);
            let dst6 = tmp3 * this.m00 + tmp6 * this.m10 + tmp11 * this.m30 - (tmp2 * this.m00 + tmp7 * this.m10 + tmp10 * this.m30);
            let dst7 = tmp4 * this.m00 + tmp9 * this.m10 + tmp10 * this.m20 - (tmp5 * this.m00 + tmp8 * this.m10 + tmp11 * this.m20);

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

            let dst8 = tmp0 * this.m13 + tmp3 * this.m23 + tmp4 * this.m33 - (tmp1 * this.m13 + tmp2 * this.m23 + tmp5 * this.m33);
            let dst9 = tmp1 * this.m03 + tmp6 * this.m23 + tmp9 * this.m33 - (tmp0 * this.m03 + tmp7 * this.m23 + tmp8 * this.m33);
            let dst10 = tmp2 * this.m03 + tmp7 * this.m13 + tmp10 * this.m33 - (tmp3 * this.m03 + tmp6 * this.m13 + tmp11 * this.m33);
            let dst11 = tmp5 * this.m03 + tmp8 * this.m13 + tmp11 * this.m23 - (tmp4 * this.m03 + tmp9 * this.m13 + tmp10 * this.m23);
            let dst12 = tmp2 * this.m22 + tmp5 * this.m32 + tmp1 * this.m12 - (tmp4 * this.m32 + tmp0 * this.m12 + tmp3 * this.m22);
            let dst13 = tmp8 * this.m32 + tmp0 * this.m02 + tmp7 * this.m22 - (tmp6 * this.m22 + tmp9 * this.m32 + tmp1 * this.m02);
            let dst14 = tmp6 * this.m12 + tmp11 * this.m32 + tmp3 * this.m02 - (tmp10 * this.m32 + tmp2 * this.m02 + tmp7 * this.m12);
            let dst15 = tmp10 * this.m22 + tmp4 * this.m02 + tmp9 * this.m12 - (tmp8 * this.m12 + tmp11 * this.m22 + tmp5 * this.m02);

            let det = this.m00 * dst0 + this.m10 * dst1 + this.m20 * dst2 + this.m30 * dst3;

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
            let m00 = this.m00 * m.m00 + this.m01 * m.m10 + this.m02 * m.m20;
            let m01 = this.m00 * m.m01 + this.m01 * m.m11 + this.m02 * m.m21;
            let m02 = this.m00 * m.m02 + this.m01 * m.m12 + this.m02 * m.m22;

            let m10 = this.m10 * m.m00 + this.m11 * m.m10 + this.m12 * m.m20;
            let m11 = this.m10 * m.m01 + this.m11 * m.m11 + this.m12 * m.m21;
            let m12 = this.m10 * m.m02 + this.m11 * m.m12 + this.m12 * m.m22;

            let m20 = this.m20 * m.m00 + this.m21 * m.m10 + this.m22 * m.m20;
            let m21 = this.m20 * m.m01 + this.m21 * m.m11 + this.m22 * m.m21;
            let m22 = this.m20 * m.m02 + this.m21 * m.m12 + this.m22 * m.m22;

            let m30 = this.m30 * m.m00 + this.m31 * m.m10 + this.m32 * m.m20 + m.m30;
            let m31 = this.m30 * m.m01 + this.m31 * m.m11 + this.m32 * m.m21 + m.m31;
            let m32 = this.m30 * m.m02 + this.m31 * m.m12 + this.m32 * m.m22 + m.m32;

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

        public append44(m: Matrix44, rst: Matrix44 = null): Matrix44 {
            let m00 = this.m00 * m.m00 + this.m01 * m.m10 + this.m02 * m.m20 + this.m03 * m.m30;
            let m01 = this.m00 * m.m01 + this.m01 * m.m11 + this.m02 * m.m21 + this.m03 * m.m31;
            let m02 = this.m00 * m.m02 + this.m01 * m.m12 + this.m02 * m.m22 + this.m03 * m.m32;
            let m03 = this.m00 * m.m03 + this.m01 * m.m13 + this.m02 * m.m23 + this.m03 * m.m33;

            let m10 = this.m10 * m.m00 + this.m11 * m.m10 + this.m12 * m.m20 + this.m13 * m.m30;
            let m11 = this.m10 * m.m01 + this.m11 * m.m11 + this.m12 * m.m21 + this.m13 * m.m31;
            let m12 = this.m10 * m.m02 + this.m11 * m.m12 + this.m12 * m.m22 + this.m13 * m.m32;
            let m13 = this.m10 * m.m03 + this.m11 * m.m13 + this.m12 * m.m23 + this.m13 * m.m33;

            let m20 = this.m20 * m.m00 + this.m21 * m.m10 + this.m22 * m.m20 + this.m23 * m.m30;
            let m21 = this.m20 * m.m01 + this.m21 * m.m11 + this.m22 * m.m21 + this.m23 * m.m31;
            let m22 = this.m20 * m.m02 + this.m21 * m.m12 + this.m22 * m.m22 + this.m23 * m.m32;
            let m23 = this.m20 * m.m03 + this.m21 * m.m13 + this.m22 * m.m23 + this.m23 * m.m33;

            let m30 = this.m30 * m.m00 + this.m31 * m.m10 + this.m32 * m.m20 + this.m33 * m.m30;
            let m31 = this.m30 * m.m01 + this.m31 * m.m11 + this.m32 * m.m21 + this.m33 * m.m31;
            let m32 = this.m30 * m.m02 + this.m31 * m.m12 + this.m32 * m.m22 + this.m33 * m.m32;
            let m33 = this.m30 * m.m03 + this.m31 * m.m13 + this.m32 * m.m23 + this.m33 * m.m33;

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
            let dstX = x * this.m00 + y * this.m10 + z * this.m20;
            let dstY = x * this.m01 + y * this.m11 + z * this.m21;
            let dstZ = x * this.m02 + y * this.m12 + z * this.m22;

            return rst ? rst.setFromXYZ(dstX, dstY, dstZ) : new Vector3(dstX, dstY, dstZ);
        }

        public transform33Vector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.transform33XYZ(vec3.x, vec3.y, vec3.z, rst);
        }

        public transform34XYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            let dstX = x * this.m00 + y * this.m10 + z * this.m20 + this.m30;
            let dstY = x * this.m01 + y * this.m11 + z * this.m21 + this.m31;
            let dstZ = x * this.m02 + y * this.m12 + z * this.m22 + this.m32;

            return rst ? rst.setFromXYZ(dstX, dstY, dstZ) : new Vector3(dstX, dstY, dstZ);
        }

        public transform34Z(x: number = 0, y: number = 0, z: number = 0): number {
            return x * this.m02 + y * this.m12 + z * this.m22 + this.m32;
        }

        public transform34Vector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.transform34XYZ(vec3.x, vec3.y, vec3.z, rst);
        }

        public transform44XYZ(x: number = 0, y: number = 0, z: number = 0, rst: Vector3 = null): Vector3 {
            let w = x * this.m03 + y * this.m13 + z * this.m23 + this.m33;

            let dstX = (x * this.m00 + y * this.m10 + z * this.m20 + this.m30) / w;
            let dstY = (x * this.m01 + y * this.m11 + z * this.m21 + this.m31) / w;
            let dstZ = (x * this.m02 + y * this.m12 + z * this.m22 + this.m32) / w;

            return rst ? rst.setFromXYZ(dstX, dstY, dstZ) : new Vector3(dstX, dstY, dstZ);
        }

        public transform44Vector3(vec3: Vector3, rst: Vector3 = null): Vector3 {
            return this.transform44XYZ(vec3.x, vec3.y, vec3.z, rst);
        }

        public transform44XYZW(x: number = 0, y: number = 0, z: number = 0, w: number, rst: Vector4 = null): Vector4 {
            let dstX = x * this.m00 + y * this.m10 + z * this.m20 + w * this.m30;
            let dstY = x * this.m01 + y * this.m11 + z * this.m21 + w * this.m31;
            let dstZ = x * this.m02 + y * this.m12 + z * this.m22 + w * this.m32;
            let dstW = x * this.m03 + y * this.m13 + z * this.m23 + w * this.m33;

            return rst ? rst.setFromXYZW(dstX, dstY, dstZ, dstW) : new Vector4(dstX, dstY, dstZ, dstW);
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

        public toArray33(transpose:boolean = false, rst: number[] = null): number[] {
            rst = rst || [];

            rst.length = 9;

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

        public toArray34(transpose: boolean = false, rst: number[] = null): number[] {
            rst = rst || [];

            rst.length = 12;

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

        public toArray44(transpose: boolean = false, rst: number[] = null): number[] {
            rst = rst || [];

            rst.length = 16;

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