///<reference path="IRenderPass.ts"/>
///<reference path="../assets/MeshAsset.ts"/>

namespace Aurora {
    export class PostProcess implements IRenderPass {
        public clear = new GLClear();
        public frameBuffer: GLFrameBuffer = null;
        public viewport = new Rect(0, 0, -1, -1);

        public asset: MeshAsset = null;
        public material: Material = null;
        public enabled: boolean = true;
    }
}