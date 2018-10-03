///<reference path="IRenderPass.ts" />
///<reference path="../assets/AssetStore.ts" />

namespace Aurora {
    export class PostProcess implements IRenderPass {
        public clear = new GLClear();
        public frameBuffer: GLFrameBuffer = null;
        public viewport = new Rect(0, 0, -1, -1);

        public assetStore: AssetStore = null;
        public material: Material = null;
        public enabled: boolean = true;
    }
}