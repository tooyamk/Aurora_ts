///<reference path="IRenderPass.ts" />
///<reference path="../assets/AssetStore.ts" />

namespace Aurora {
    export class PostProcess implements IRenderPass {
        public clear: GLClear = new GLClear();
        public frameBuffer: GLFrameBuffer = null;

        public assetStore: AssetStore = null;
        public material: Material = null;
        public enabled: boolean = true;
    }
}