///<reference path="AbstractRenderable.ts" />

namespace Aurora {
    export class SkinnedMesh extends AbstractRenderable {
        public asset: MeshAsset = null;
        public skeleton: Skeleton = null;

        public checkRenderable(): boolean {
            return Boolean(this.asset);
        }

        public visit(renderingData: RenderingData): void {
            renderingData.out.asset = this.asset;
        }
    }
}