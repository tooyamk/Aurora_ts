/// <reference path="Renderer.ts" />

namespace MITOIA {
    export class MeshRenderer extends Renderer {
        public attributes: ShaderAttributes = new ShaderAttributes();

        public use(material: Material): void {
            material.use();

            if (this.attributes) {
                this.attributes.getLocations(material.shader);

                let names = this.attributes.names;
                for (let i = 0, n = names.length; i < n; ++i) {
                    let pos = this.attributes.locations[i];
                    if (pos >= 0) {
                        let name = names[i];
                        
                        let buffer = this.vertexBuffers[name];
                        if (buffer) buffer.use(pos);
                    }
                }

                let a = 1;
            }
        }
    }
}