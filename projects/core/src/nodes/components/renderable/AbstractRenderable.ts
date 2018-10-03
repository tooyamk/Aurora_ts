///<reference path="../AbstractNodeComponent.ts" />
///<reference path="../../../renderers/AbstractRenderer.ts" />

namespace Aurora {
    export abstract class AbstractRenderable extends AbstractNodeComponent {
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