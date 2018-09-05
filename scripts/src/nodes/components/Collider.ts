namespace Aurora {
    export class Collider extends AbstractNodeComponent {
        public shape: IBoundShape = null;

        constructor(shape: IBoundShape = null) {
            super();

            this.shape = shape;
        }
    }
}