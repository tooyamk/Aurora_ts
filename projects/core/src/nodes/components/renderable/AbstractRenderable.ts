///<reference path="../AbstractNodeComponent.ts" />
///<reference path="../../../renderers/AbstractRenderer.ts" />

namespace Aurora {
    export abstract class AbstractRenderable extends AbstractNodeComponent {
        public renderer: AbstractRenderer = null;
        public materials: Material[] = null;

        public isReady(): boolean {
            //override
            return false;
        }

        public visit(renderingData: RenderingData): void {
            //override
        }
    }
}