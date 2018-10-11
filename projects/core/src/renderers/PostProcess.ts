///<reference path="IRenderPass.ts" />
///<reference path="../assets/AssetsStore.ts" />

namespace Aurora {
    export class PostProcess implements IRenderPass {
        public clear = new GLClear();
        public frameBuffer: GLFrameBuffer = null;
        public viewport = new Rect(0, 0, -1, -1);

        public assets: AssetsStore = null;
        public material: Material = null;
        public enabled: boolean = true;
    }
}