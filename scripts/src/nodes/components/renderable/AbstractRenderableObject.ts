/// <reference path="../AbstractNodeComponent.ts" />

namespace Aurora {
    export abstract class AbstractRenderableObject extends AbstractNodeComponent {
        public renderer: AbstractRenderer = null;
        public materials: Material[] = [];

        public isReady(): boolean {
            return false;
        }

        public draw(renderer: AbstractRenderer, material: Material): void {
            //todo
        }
    }
}