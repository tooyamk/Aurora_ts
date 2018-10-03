///<reference path="AbstractRenderable.ts" />

namespace Aurora {
    export class RenderableMesh extends AbstractRenderable {
        public assetStore: AssetStore = null;

        public isReady(): boolean {
            return this.assetStore != null;
        }

        public draw(renderer: AbstractRenderer, material: Material): void {
            if (material.ready(renderer.shaderDefines)) {
                renderer.onShaderPreUse();

                let p = material.use(renderer.shaderUniforms);

                let atts = p.attributes;
                for (let i = 0, n = atts.length; i < n; ++i) {
                    let att = atts[i];
                    let buffer = this.assetStore.getVertexBuffer(p.gl, att);
                    if (buffer) {
                        buffer.use(att.location);
                    } else {
                        p.gl.deactiveVertexAttrib(att.location);
                    }
                }

                let buffer = this.assetStore.getDrawIndexBuffer(p.gl);
                if (buffer) buffer.draw(material.drawMode);
            }
        }
    }
}