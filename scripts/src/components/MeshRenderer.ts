/// <reference path="Renderer.ts" />

namespace MITOIA {
    export class MeshRenderer extends Renderer {
        public assetStore: AssetStore = null;

        public isReady(): boolean {
            return this.assetStore != null;
        }

        public draw(renderPipeline: AbstractRenderPipeline, material: Material): void {
            if (material.ready(renderPipeline.shaderDefines)) {
                renderPipeline.onShaderPreUse();

                let p = material.use(renderPipeline.shaderUniform);

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