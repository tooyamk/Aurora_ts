///<reference path="AbstractRenderable.ts" />

namespace Aurora {
    export class Mesh extends AbstractRenderable {
        public assets: AssetsStore = null;

        public checkRenderable(): boolean {
            return Boolean(this.assets);
        }

        public visit(renderingData: RenderingData): void {
            renderingData.out.assets = this.assets;
        }
    }
}