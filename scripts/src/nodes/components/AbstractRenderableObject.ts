/// <reference path="AbstractNodeComponent.ts" />

namespace MITOIA {
    export abstract class AbstractRenderableObject extends AbstractNodeComponent {
        public materials: Material[] = [];

        public isReady(): boolean {
            return false;
        }

        public draw(renderer: AbstractRenderer, material: Material): void {
            //todo
        }
    }
}