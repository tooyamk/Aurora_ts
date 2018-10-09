///<reference path="AbstractRenderable.ts" />

namespace Aurora {
    export class Mesh extends AbstractRenderable {
        public assetStore: AssetStore = null;

        public checkRenderable(): boolean {
            return Boolean(this.assetStore);
        }

        public visit(renderingData: RenderingData): void {
            renderingData.out.assetStore = this.assetStore;
        }
    }
}