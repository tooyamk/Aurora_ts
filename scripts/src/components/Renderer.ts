namespace MITOIA {
    export abstract class Renderer extends AbstractComponent {
        public materials: Material[] = [];

        public isReady(): boolean {
            return false;
        }

        public draw(renderPipeline: AbstractRenderPipeline, material: Material): void {
            //todo
        }
    }
}