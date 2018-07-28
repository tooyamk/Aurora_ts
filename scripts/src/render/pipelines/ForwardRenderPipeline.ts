namespace MITOIA {
    export class ForwardRenderPipeline extends AbstractRenderPipeline {
        public render(engine: Engine, camera: Camera, node: Node): void {
            let gl = engine.gl;
            
            if (camera.clearData) gl.clearWithClearData(camera.clearData);
        }
    }
}