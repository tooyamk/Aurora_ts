namespace Aurora {
    export class RenderingObject {
        public material: Material;
        public node: Node;
        public renderable: AbstractRenderableObject;
        public localToWorld: Matrix44 = new Matrix44();
        public localToView: Matrix44 = new Matrix44();
        public localToProj: Matrix44 = new Matrix44();

        public clean(): void {
            this.material = null;
            this.node = null;
            this.renderable = null;
        }
    }
}