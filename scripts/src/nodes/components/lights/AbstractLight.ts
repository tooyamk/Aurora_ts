namespace MITOIA {
    export abstract class AbstractLight extends AbstractNodeComponent {
        public readonly color: Color3 = Color3.WHITE;
        public intensity: number = 1.0;

        public preRender(renderer: AbstractRenderer): void {
        }
    }
}