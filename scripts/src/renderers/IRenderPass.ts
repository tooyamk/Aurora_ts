namespace Aurora {
    export interface IRenderPass {
        clear: GLClear;
        frameBuffer: GLFrameBuffer;
    }
}