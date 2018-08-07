namespace MITOIA {
    class RenderNode {
        public material: Material;
        public node: Node;
        public renderer: Renderer;
        public localToWorld: Matrix44 = new Matrix44();
        public localToView: Matrix44 = new Matrix44();
        public localToProj: Matrix44 = new Matrix44();
    }

    export class ForwardRenderPipeline extends AbstractRenderPipeline {
        public alphaBlendSort: boolean = true;

        private _gl: WebGLRenderingContext;

        private _renderingQueue: RenderNode[] = [];
        private _renderingQueueLength: uint = 0;
        private _renderingQueueCapacity: uint = 0;

        protected _viewToProjMatrix: Matrix44 = new Matrix44();
        protected _worldToViewMatrix: Matrix44 = new Matrix44();
        protected _worldToProjMatrix: Matrix44 = new Matrix44();

        private _renderingNode: RenderNode = null;

        constructor() {
            super();

            this._renderingQueueCapacity = 100;
            for (let i = 0; i < this._renderingQueueCapacity; ++i) {
                this._renderingQueue[i] = new RenderNode();
            }
        }

        public render(gl: GL, camera: Camera, node: Node): void {
            this._gl = gl.context;

            if (camera.owner) {
                camera.owner.getWorldMatrix(this._worldToViewMatrix);
                this._worldToViewMatrix.invert();
            } else {
                this._worldToViewMatrix.identity();
            }

            camera.getProjectionMatrix(this._viewToProjMatrix);

            this._worldToViewMatrix.append44(this._viewToProjMatrix, this._worldToProjMatrix);

            this._shaderUniform.setNumberArray(Shader.u_MatV2P, this._viewToProjMatrix.toArray44());
            this._shaderUniform.setNumberArray(Shader.u_MatW2P, this._worldToProjMatrix.toArray44());
            this._shaderUniform.setNumberArray(Shader.u_MatW2V, this._worldToViewMatrix.toArray44());
            
            if (camera.frameBuffer) {
                camera.frameBuffer.bind();
                gl.setViewport(0, 0, camera.frameBuffer.width, camera.frameBuffer.height);
            } else {
                gl.restoreBackBuffer();
                gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            }

            gl.clear(camera.clear);

            this._collectNode(node);
            
            Sort.Merge.sort(this._renderingQueue, (a: RenderNode, b: RenderNode) => {
                return a.material.renderingPriority < b.material.renderingPriority;
            }, 0, this._renderingQueueLength);

            if (this.alphaBlendSort) this._sortByAlphaBlend();

            this._renderByQueue();

            //clean
            this._gl = null;
            for (let i = 0; i < this._renderingQueueLength; ++i) {
                let rn = this._renderingQueue[i];
                rn.material = null;
                rn.node = null;
                rn.renderer = null;
            }
            this._renderingQueueLength = 0;
        }

        private _collectNode(node: Node): void {
            let renderer = node.getComponentByType(Renderer, true);
            if (renderer && renderer.isReady()) {
                let materials = renderer.materials;
                if (materials) {
                    for (let i = 0, n = materials.length; i < n; ++i) {
                        let m = materials[i];
                        if (m && m.shader) {
                            let queueNode: RenderNode;
                            if (this._renderingQueueLength == this._renderingQueueCapacity) {
                                queueNode = new RenderNode();
                                this._renderingQueue[this._renderingQueueCapacity] = new RenderNode();
                                ++this._renderingQueueLength;
                                ++this._renderingQueueCapacity;
                            } else {
                                queueNode = this._renderingQueue[this._renderingQueueLength++];
                            }

                            queueNode.material = m;
                            queueNode.node = node;
                            queueNode.renderer = renderer;
                            node.getWorldMatrix(queueNode.localToWorld);
                            queueNode.localToWorld.append34(this._worldToViewMatrix, queueNode.localToView);
                            queueNode.localToWorld.append44(this._worldToProjMatrix, queueNode.localToProj);
                        }
                    }
                }
            }

            node.foreach(child => {
                this._collectNode(child);
            });
        }

        private _sortByAlphaBlend(): void {
            let renderingPriority: number = null;
            let alphaBlendStart: number = null;
            for (let i = 0; i < this._renderingQueueLength; ++i) {
                let rn = this._renderingQueue[i];
                if (rn.material.blend) {
                    if (alphaBlendStart === null) {
                        alphaBlendStart = i;
                        renderingPriority = rn.material.renderingPriority;
                    } else if (renderingPriority !== rn.material.renderingPriority) {
                        this._sortByProjDepth(alphaBlendStart, i - 1);
                        alphaBlendStart = i;
                        renderingPriority = rn.material.renderingPriority;
                    }
                } else if (alphaBlendStart !== null) {
                    this._sortByProjDepth(alphaBlendStart, i - 1);
                    alphaBlendStart = null;
                }
            }

            if (alphaBlendStart !== null) this._sortByProjDepth(alphaBlendStart, this._renderingQueueLength - 1);
        }

        private _sortByProjDepth(start: uint, end: uint): void {
            Sort.Merge.sort(this._renderingQueue, (a: RenderNode, b: RenderNode) => {
                return a.node.getDepth(a.localToView) > b.node.getDepth(b.localToView);
            }, start, end);
        }

        private _renderByQueue(): void {
            for (let i = 0; i < this._renderingQueueLength; ++i) {
                let rn = this._renderingQueue[i];
                this._renderingNode = rn;
                rn.renderer.draw(this, rn.material);
            }

            this._renderingNode = null;
        }

        public onShaderPreUse(): void {
            let shader = this._renderingNode.material.shader;

            if (shader.hasUniform(Shader.u_MatL2P)) this._shaderUniform.setNumberArray(Shader.u_MatL2P, this._renderingNode.localToProj.toArray44());
            if (shader.hasUniform(Shader.u_MatL2V)) this._shaderUniform.setNumberArray(Shader.u_MatL2V, this._renderingNode.localToView.toArray44());
            if (shader.hasUniform(Shader.u_MatL2W)) this._shaderUniform.setNumberArray(Shader.u_MatL2W, this._renderingNode.localToWorld.toArray44());
        }
    }
}