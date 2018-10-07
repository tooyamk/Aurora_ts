///<reference path="../AbstractNodeComponent.ts" />
///<reference path="../../../renderers/AbstractRenderer.ts" />

namespace Aurora {
    export abstract class AbstractRenderable extends AbstractNodeComponent {
        public renderer: AbstractRenderer = null;
        public materials: Material[] = [];

        public isReady(): boolean {
            //override
            return false;
        }

        public visit(renderingObject: RenderingObject): AssetStore {
            //override
            return null;
        }
    }
}