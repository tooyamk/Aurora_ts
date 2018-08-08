namespace MITOIA {
    export interface IRenderPass {
        clear: GLClear;
        frameBuffer: GLFrameBuffer;
    }
}