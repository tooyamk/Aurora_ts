///<reference path="AbstractRenderable.ts" />

namespace Aurora {
    export class Mesh extends AbstractRenderable {
        public asset: MeshAsset = null;

        public checkRenderable(): boolean {
            return Boolean(this.asset);
        }

        public visit(renderingData: RenderingData): void {
            renderingData.out.asset = this.asset;
        }
    }
}