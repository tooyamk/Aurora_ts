namespace MITOIA {
    export abstract class Renderer extends AbstractComponent {
        public materials: Material[] = [];

        public isReady(): boolean {
            return false;
        }

        public draw(globalDefines: ShaderDefines, material: Material): void {
            //todo
        }
    }
}