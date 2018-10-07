///<reference path="AbstractRenderable.ts" />

namespace Aurora {
    export class RenderableMesh extends AbstractRenderable {
        public assetStore: AssetStore = null;

        public isReady(): boolean {
            return Boolean(this.assetStore);
        }

        public visit(renderingObject: RenderingObject): AssetStore {
            return this.assetStore;
        }
    }
}