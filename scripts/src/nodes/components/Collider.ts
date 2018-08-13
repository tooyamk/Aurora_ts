namespace MITOIA {
    export class Collider extends AbstractNodeComponent {
        public shape: IBoundingShape = null;

        constructor(shape: IBoundingShape = null) {
            super();

            this.shape = shape;
        }
    }
}