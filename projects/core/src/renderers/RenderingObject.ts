///<reference path="../math/Matrix44.ts" />

namespace Aurora {
    export class RenderingObject {
        public material: Material = null;
        public alternativeMaterial: Material = null;
        public renderable: AbstractRenderable = null;
        public localToWorld: Matrix44 = new Matrix44();
        public localToView: Matrix44 = new Matrix44();
        public localToProj: Matrix44 = new Matrix44();

        public clean(): void {
            this.material = null;
            this.alternativeMaterial = null;
            this.renderable = null;
        }
    }
}