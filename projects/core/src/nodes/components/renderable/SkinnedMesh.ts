///<reference path="AbstractRenderable.ts" />

namespace Aurora {
    export class SkinnedMesh extends Mesh {
        public skeleton: Skeleton = null;

        public checkRenderable(): boolean {
            return !!this.asset;
        }

        public render(renderingData: RenderingData): void {
            renderingData.out.asset = this.asset;
        }

        public destroy(): void {
            this.skeleton = null;

            super.destroy();
        }
    }
}