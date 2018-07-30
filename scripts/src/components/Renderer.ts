namespace MITOIA {
    export abstract class Renderer extends AbstractComponent {
        public materials: Material[] = [];
        public vertexBuffers: { [key: string]: GLVertexBuffer } = {};

        public use(material: Material): void {
            //todo
        }
    }
}