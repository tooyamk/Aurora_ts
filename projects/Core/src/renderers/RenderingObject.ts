///<reference path="../math/Matrix44.ts"/>

namespace Aurora {
    export class RenderingObject {
        public material: Material = null;
        public alternativeUniforms: ShaderUniforms = null;
        public renderable: AbstractRenderable = null;
        public sortWeight: number = 0;
        public l2w = new Matrix44();
        public l2v = new Matrix44();
        public l2p = new Matrix44();

        public clean(): void {
            this.material = null;
            this.alternativeUniforms = null;
            this.renderable = null;
        }
    }
}