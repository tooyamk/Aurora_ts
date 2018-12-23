///<reference path="../Node.ts"/>
///<reference path="../../renderers/IRenderPass.ts"/>

namespace Aurora {
    export class Camera extends Node.AbstractComponent implements IRenderPass {
        public clear = new GLClear();
        public frameBuffer: GLFrameBuffer = null;
        public viewport = new Rect(0, 0, -1, -1);

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

        public get readonlyProjectionMatrix(): Matrix44 {
            return this._projectionMatrix;
        }

        public getProjectionMatrix(rst: Matrix44 = null): Matrix44 {
            return rst ? rst.set44(this._projectionMatrix) : this._projectionMatrix.clone();
        }

        public setProjectionMatrix(m: Matrix44): void {
            this._projectionMatrix.set44(m);

            const e = this._projectionMatrix.elements;
            const m22 = e[10];

            this._zNear = -e[11] / m22;

            if (e[15] === 1) {
                this._zFar = 1 / m22 + this._zNear;
            } else {
                this._zFar = (this._zNear * m22) / (m22 - 1);
            }

            this._aspectRatio = e[5] / e[0];
        }

        public getWorldToProjectionMatrix(rst: Matrix44 = null): Matrix44 {
            if (this._node) {
                return this._node.getInverseWorldMatrix(rst).append44(this._projectionMatrix);
            } else {
                return rst ? rst.set44(this._projectionMatrix) : this._projectionMatrix.clone();
            }
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

            const e = this._projectionMatrix.elements;

            if (e[15] === 1) {
                let w = 2 / e[0];
                let h = 2 / e[5];

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

                dirX = dirX * this._zNear / e[0];
                dirY = dirY * this._zNear / e[5];
                dirZ = this._zNear;

                let d = dirX * dirX + dirY * dirY + dirZ * dirZ;
                d = Math.sqrt(d);
                dirX /= d;
                dirY /= d;
                dirZ /= d;

                const t = this._zNear / dirZ;

                originX = dirX * t;
                originY = dirY * t;
                originZ = this._zNear;
            }

            rst.origin.setFromNumbers(originX, originY, originZ);
            rst.direction.setFromNumbers(dirX, dirY, dirZ);

            return rst;
        }
    }
}