/// <reference path="AbstractNodeComponent.ts" />

namespace Aurora {
    export class Camera extends AbstractNodeComponent implements IRenderPass {
        public clear: GLClear = new GLClear();
        public frameBuffer: GLFrameBuffer = null;

        public cullingMask: uint = 0x7FFFFFFF;

        protected _projectionMatrix: Matrix44 = new Matrix44();
        protected _zNear: number;
        protected _zFar: number;
        protected _aspectRatio: number;

        public get aspectRatio(): number {
            return this._aspectRatio;
        }

        public get zFar(): number {
            return this._zFar;
        }

        public get zNear(): number {
            return this._zNear;
        }

        public getProjectionMatrix(rst: Matrix44 = null): Matrix44 {
            return rst ? rst.set44FromMatrix(this._projectionMatrix) : this._projectionMatrix.clone();
        }

        public setProjectionMatrix(m: Matrix44): void {
            this._projectionMatrix.set44FromMatrix(m);

            this._zNear = -this._projectionMatrix.m32 / this._projectionMatrix.m22;

            if (this._projectionMatrix.m33 === 1) {
                this._zFar = 1 / this._projectionMatrix.m22 + this._zNear;
            } else {
                this._zFar = (this._zNear * this._projectionMatrix.m22) / (this._projectionMatrix.m22 - 1);
            }

            this._aspectRatio = this._projectionMatrix.m11 / this._projectionMatrix.m00;
        }

        public getWorldToProjectionMatrix(rst: Matrix44 = null): Matrix44 {
            rst = rst || new Matrix44();

            if (this._node) {
                this._node.getInverseWorldMatrix(rst);
            } else {
                rst.identity();
            }

            rst.append44(this._projectionMatrix);

            return rst;
        }

        /**
		 * @param foucs (0, 0) = (left, top).
         * 
         * @returns view space ray.
		 */
        public getRay(screenWidth: number, screenHeight: number, focusX: number, focusY: number, rst: Ray = null): Ray {
            rst = rst || new Ray();

            let originX: number, originY: number, originZ: number;
            let dirX: number, dirY: number, dirZ: number;

            if (this._projectionMatrix.m33 === 1) {
                let w: number = 2 / this._projectionMatrix.m00;
                let h: number = 2 / this._projectionMatrix.m11;

                w /= screenWidth;
                h /= screenHeight;

                screenWidth *= w;
                screenHeight *= h;
                focusX *= w;
                focusY *= h;

                originX = focusX - screenWidth * 0.5;
                originY = screenHeight * 0.5 - focusY;
                originZ = this._zNear;

                dirX = 0;
                dirY = 0;
                dirZ = 1;
            } else {
                dirX = (focusX / screenWidth) * 2 - 1;
                dirY = 1 - (focusY / screenHeight) * 2;

                dirX = dirX * this._zNear / this._projectionMatrix.m00;
                dirY = dirY * this._zNear / this._projectionMatrix.m11;
                dirZ = this._zNear;

                let d: number = dirX * dirX + dirY * dirY + dirZ * dirZ;
                d = Math.sqrt(d);
                dirX /= d;
                dirY /= d;
                dirZ /= d;

                let t: number = this._zNear / dirZ;

                originX = dirX * t;
                originY = dirY * t;
                originZ = this._zNear;
            }

            rst.origin.setFromXYZ(originX, originY, originZ);
            rst.direction.setFromXYZ(dirX, dirY, dirZ);

            return rst;
        }
    }
}