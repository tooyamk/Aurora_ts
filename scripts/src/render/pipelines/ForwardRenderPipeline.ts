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
        private _worldToView: Matrix44 = new Matrix44();
        private _worldToProj: Matrix44 = new Matrix44();

        private _renderingQueue: RenderNode[] = [];
        private _renderingQueueLength: uint = 0;
        private _renderingQueueCapacity: uint = 0;

        private _globalDefines: ShaderDefines = new ShaderDefines();

        constructor() {
            super();

            this._renderingQueueCapacity = 100;
            for (let i = 0; i < this._renderingQueueCapacity; ++i) {
                this._renderingQueue[i] = new RenderNode();
            }
        }

        public render(engine: Engine, camera: Camera, node: Node): void {
            let gl = engine.gl;
            this._gl = gl.internalGL;

            camera.owner.getWorldMatrix(this._worldToView);
            this._worldToView.invert();

            this._worldToView.append44(camera.getProjectionMatrix(this._worldToProj), this._worldToProj);
            
            gl.clearWithClearData(camera.clearData);

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
                            queueNode.localToWorld.append34(this._worldToView, queueNode.localToView);
                            queueNode.localToWorld.append44(this._worldToProj, queueNode.localToProj);
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
                if (rn.material.enabledBlend) {
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
                rn.renderer.draw(this._globalDefines, rn.material);
            }
        }
    }
}