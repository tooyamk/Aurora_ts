namespace Aurora {
    export class Collider extends AbstractNode3DComponent {
        public shape: IBoundShape = null;

        constructor(shape: IBoundShape = null) {
            super();

            this.shape = shape;
        }
    }
}