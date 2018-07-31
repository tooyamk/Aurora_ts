/// <reference path="Renderer.ts" />

namespace MITOIA {
    export class MeshRenderer extends Renderer {
        public assetStore: AssetStore = null;

        public isReady(): boolean {
            return this.assetStore != null;
        }

        public draw(globalDefines: ShaderDefines, material: Material): void {
            let p = material.use(globalDefines);

            if (p) {
                let atts = p.attributes;
                for (let i = 0, n = atts.length; i < n; ++i) {
                    let att = atts[i];
                    let buffer = this.assetStore.getVertexBuffer(att);
                    if (buffer) buffer.use(att.location);
                }

                let buffer = this.assetStore.getIndexBuffer();
                if (buffer) buffer.draw(GLDrawMode.TRIANGLES);
            }
        }
    }
}