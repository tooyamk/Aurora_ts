///<reference path="../AbstractNode3DComponent.ts" />

namespace Aurora {
    export abstract class AbstractRenderable extends AbstractNode3DComponent {
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