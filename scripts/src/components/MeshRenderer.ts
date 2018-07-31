/// <reference path="Renderer.ts" />

namespace MITOIA {
    export class MeshRenderer extends Renderer {
        public assetStore: AssetStore = null;
        public attributes: ShaderAttributes = new ShaderAttributes();
        public indexName: string = "index";

        public isReady(): boolean {
            return this.assetStore && this.indexName && this.indexName.length > 0;
        }

        public use(material: Material): void {
            material.use();

            if (this.attributes) {
                this.attributes.getLocations(material.shader);

                let names = this.attributes.names;
                for (let i = 0, n = names.length; i < n; ++i) {
                    let pos = this.attributes.locations[i];
                    if (pos >= 0) {
                        let name = names[i];
                        
                        let buffer = this.assetStore.getVertexBuffer(name);
                        if (buffer) buffer.use(pos);
                    }
                }
            }

            let buffer = this.assetStore.getIndexBuffer(this.indexName);
            if (buffer) {
                buffer.draw(GLDrawMode.TRIANGLES);
            }
        }
    }
}