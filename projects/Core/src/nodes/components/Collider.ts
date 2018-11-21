///<reference path="../Node.ts"/>

namespace Aurora {
    export class Collider extends Node.AbstractComponent {
        public shape: IBoundShape = null;

        constructor(shape: IBoundShape = null) {
            super();

            this.shape = shape;
        }
    }
}