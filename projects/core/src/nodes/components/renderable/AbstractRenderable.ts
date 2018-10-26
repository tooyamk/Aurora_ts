///<reference path="../../Node.ts" />

namespace Aurora {
    export abstract class AbstractRenderable extends Node.AbstractComponent {
        public renderer: AbstractRenderer = null;
        public materials: Material[] = null;

        public checkRenderable(): boolean {
            //override
            return false;
        }

        public visit(renderingData: RenderingData): void {
            //override
        }
    }
}