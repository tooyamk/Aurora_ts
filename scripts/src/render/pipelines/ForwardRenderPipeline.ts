namespace MITOIA {
    export class ForwardRenderPipeline extends AbstractRenderPipeline {
        private _gl: WebGLRenderingContext;

        private _renderingObjects: Node[] = [];

        public render(engine: Engine, camera: Camera, node: Node): void {
            let gl = engine.gl;
            this._gl = gl.internalGL;
            
            gl.clearWithClearData(camera.clearData);

            this._renderNode(node);

            this._gl = null;
            this._renderingObjects.length = 0;
        }

        private _renderNode(node: Node): void {
            let renderer = node.getComponentByType(Renderer);
            if (renderer) {
                let material = renderer.material;
                if (material && material.shader) {
                    material.shader.switch(material.defines);
                }
                
                let program = renderer.material;

                //this.shader.use();

                //let pos = this._gl.getAttribLocation(program, "position");
                //mesh.asset.vertexBuffer.bind();
                //this._gl.vertexAttribPointer(pos, size, type, normalized, stride, offset);
                let a = 1;
            }

            node.foreach(child => {
                this._renderNode(child);
            });
        }
    }
}