///<reference path="PostProcess.ts" />
///<reference path="../shaders/builtin/postprocesses/Default.ts" />

namespace Aurora {
    export class RenderingManager {
        protected _renderingQueue: RenderingObject[] = [];
        protected _renderingQueueLength: uint = 0;
        protected _renderingQueueCapacity: uint = 0;

        protected _renderers: AbstractRenderer[] = [];

        protected _shaderDefines: ShaderDefines = new ShaderDefines();
        protected _shaderUniforms: ShaderUniforms = new ShaderUniforms();

        protected _cameraWorldMatrix: Matrix44 = new Matrix44();
        protected _viewToProjMatrix: Matrix44 = new Matrix44();
        protected _worldToViewMatrix: Matrix44 = new Matrix44();
        protected _worldToProjMatrix: Matrix44 = new Matrix44();
        protected _viewToProjM44Array: number[] = [];
        protected _worldToViewM44Array: number[] = [];
        protected _worldToProjM44Array: number[] = [];

        protected _defaultPostProcessVertexBuffer: GLVertexBuffer = null;
        protected _defaultPostProcessTexCoordBuffer: GLVertexBuffer = null;
        protected _defaultPostProcessIndexBuffer: GLIndexBuffer = null;
        protected _defaultPostProcessShader: Shader = null;

        protected _renderingData: RenderingData;

        protected _appendRenderingObjectFn: (renderable: AbstractRenderable, material: Material, alternativeUniforms: ShaderUniforms) => void = null;

        constructor () {
            this._shaderDefines.setDefine(ShaderPredefined.LIGHTING_SPECULAR, ShaderPredefined.LIGHTING_SPECULAR_BLINN_PHONE);

            this._shaderUniforms.setNumber(ShaderPredefined.u_AlphaTestCompareValue, 1);
            this._shaderUniforms.setNumber(ShaderPredefined.u_LighitngSpecularShininess, 32);
            this._shaderUniforms.setNumber(ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);
            this._shaderUniforms.setNumber(ShaderPredefined.u_SpecularColor, 1, 1, 1, 1);
            this._shaderUniforms.setNumber(ShaderPredefined.u_AmbientColor, 0.1, 0.1, 0.1);
            this._shaderUniforms.setNumber(ShaderPredefined.u_ReflectionColor, 1, 1, 1, 1);

            this._renderingData = new RenderingData();

            this._renderingQueueCapacity = 100;
            for (let i = 0; i < this._renderingQueueCapacity; ++i) this._renderingQueue[i] = new RenderingObject();

            this._appendRenderingObjectFn = this.appendRenderingObject.bind(this);
        }

        public dispose(): void {
            if (this._defaultPostProcessVertexBuffer) {
                this._defaultPostProcessVertexBuffer.destroy();
                this._defaultPostProcessVertexBuffer = null;

                this._defaultPostProcessTexCoordBuffer.destroy();
                this._defaultPostProcessTexCoordBuffer = null;

                this._defaultPostProcessIndexBuffer.destroy();
                this._defaultPostProcessIndexBuffer = null;

                this._defaultPostProcessShader.destroy();
                this._defaultPostProcessShader = null;
            }

            this._appendRenderingObjectFn = null;
        }

        public get shaderDefines(): ShaderDefines {
            return this._shaderDefines;
        }

        public get shaderUniforms(): ShaderUniforms {
            return this._shaderUniforms;
        }

        public begin(gl: GL, pass: IRenderPass): void {
            let vp = pass.viewport;
            if (pass.frameBuffer) {
                pass.frameBuffer.bind();
                if (vp && vp.width >= 0 && vp.height >= 0) {
                    gl.setViewport(vp.x, vp.y, vp.width, vp.height);
                } else {
                    gl.setViewport(0, 0, pass.frameBuffer.width, pass.frameBuffer.height);
                }
            } else {
                gl.restoreBackBuffer();
                gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                if (vp && vp.width >= 0 && vp.height >= 0) {
                    gl.setViewport(vp.x, vp.y, vp.width, vp.height);
                } else {
                    gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                }
            }

            gl.setDepthWrite(true);
            gl.clear(pass.clear);
        }

        public render(gl: GL, camera: Camera, node: Node3D, lights: AbstractLight[] = null, replaceMaterials: Material[] = null): void {
            if (camera.node) {
                camera.node.getWorldMatrix(this._cameraWorldMatrix);
                camera.node.getInverseWorldMatrix(this._worldToViewMatrix);
            } else {
                this._cameraWorldMatrix.identity();
                this._worldToViewMatrix.identity();
            }

            this._renderingData.in.camera = camera;

            camera.getProjectionMatrix(this._viewToProjMatrix);

            this._worldToViewMatrix.append44(this._viewToProjMatrix, this._worldToProjMatrix);

            this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_V2P, this._viewToProjMatrix.toArray44(false, this._viewToProjM44Array));
            this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_W2P, this._worldToProjMatrix.toArray44(false, this._worldToProjM44Array));
            this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_W2V, this._worldToViewMatrix.toArray44(false, this._worldToViewM44Array));
            this._shaderUniforms.setNumber(ShaderPredefined.u_CamPosW, this._cameraWorldMatrix.m30, this._cameraWorldMatrix.m31, this._cameraWorldMatrix.m32);

            this.begin(gl, camera);

            this._collectNode(node, camera.cullingMask, replaceMaterials);

            if (this._renderingQueueLength > 0) {
                Sort.Merge.sort(this._renderingQueue, (a: RenderingObject, b: RenderingObject) => {
                    let sub = a.material.renderingPriority - b.material.renderingPriority;
                    if (sub < 0) {
                        return true;
                    } else if (sub === 0) {
                        let value = a.material.renderingSort - b.material.renderingSort;
                        if (value === 0) {
                            switch (a.material.renderingSort) {
                                case RenderingSort.FAR_TO_NEAR: {
                                    return a.localToView.m32 >= b.localToView.m32;
                                }
                                case RenderingSort.NEAR_TO_FAR: {
                                    return a.localToView.m32 <= b.localToView.m32;
                                }
                                default:
                                    return true;
                            }
                        } else {
                            return value < 0;
                        }
                    } else {
                        return false;
                    }
                }, 0, this._renderingQueueLength - 1);
            }

            this._renderByQueue(lights);

            //clean
            for (let i = 0; i < this._renderingQueueLength; ++i) this._renderingQueue[i].clean();
            this._renderingQueueLength = 0;

            this._renderingData.clear();
        }

        public appendRenderingObject(renderable: AbstractRenderable, material: Material, alternativeUniforms: ShaderUniforms): void {
            if (material && material.shader) {
                if (!renderable.renderer.isRendering) {
                    renderable.renderer.isRendering = true;
                    this._renderers.push(renderable.renderer);
                }

                let queueNode: RenderingObject;
                if (this._renderingQueueLength === this._renderingQueueCapacity) {
                    queueNode = new RenderingObject();
                    this._renderingQueue[this._renderingQueueCapacity++] = queueNode;
                    ++this._renderingQueueLength;
                } else {
                    queueNode = this._renderingQueue[this._renderingQueueLength++];
                }

                queueNode.material = material;
                queueNode.renderable = renderable;
                queueNode.alternativeUniforms = alternativeUniforms;
                renderable.node.getWorldMatrix(queueNode.localToWorld);
                queueNode.localToWorld.append34(this._worldToViewMatrix, queueNode.localToView);
                queueNode.localToWorld.append44(this._worldToProjMatrix, queueNode.localToProj);
            }
        }

        private _collectNode(node: Node3D, cullingMask: uint, replaceMaterials: Material[]): void {
            let renderable = node.getComponentByType(AbstractRenderable, true);
            if (renderable && renderable.renderer && (node.layer & cullingMask) && renderable.isReady()) {
                renderable.renderer.collectRenderingObjects(renderable, replaceMaterials, this._appendRenderingObjectFn);
            }

            let child = node._childHead;
            while (child) {
                this._collectNode(child, cullingMask, replaceMaterials);
                child = child._next;
            }
        }

        private _renderByQueue(lights: AbstractLight[]): void {
            if (this._renderingQueueLength > 0) {
                for (let i = 0, n = this._renderers.length; i < n; ++i) this._renderers[i].preRender(this._shaderDefines, this._shaderUniforms, lights);

                let renderer: AbstractRenderer = this._renderingQueue[0].renderable.renderer;
                let start: int = 0;
                for (let i = 1; i < this._renderingQueueLength; ++i) {
                    let obj = this._renderingQueue[i];

                    if (obj.renderable.renderer !== renderer) {
                        if (renderer) renderer.render(this._renderingData, this._renderingQueue, start, i - 1);
                        start = i;
                    }
                }

                if (renderer) renderer.render(this._renderingData, this._renderingQueue, start, this._renderingQueueLength - 1);

                for (let i = 0, n = this._renderers.length; i < n; ++i) {
                    let renderer = this._renderers[i];
                    renderer.isRendering = false;
                    renderer.postRender();
                }
                this._renderers.length = 0;
            }
        }

        public postProcess(gl: GL, postProcesses: PostProcess[]): void {
            if (postProcesses) {
                this._createDefaultPostProcessAssets(gl);

                for (let i = 0, n = postProcesses.length; i < n; ++i) {
                    let pp = postProcesses[i];
                    if (pp && pp.enabled && pp.material) {
                        let useDefaultShader = pp.material.shader === null;
                        if (useDefaultShader) pp.material.shader = this._defaultPostProcessShader;

                        if (pp.material.ready(this._shaderDefines)) {
                            this.begin(gl, pp);

                            let p = pp.material.use(this._shaderUniforms);

                            let atts = p.attributes;
                            for (let i = 0, n = atts.length; i < n; ++i) {
                                let att = atts[i];
                                let buffer = pp.assetStore ? pp.assetStore.getVertexBuffer(gl, att) : null;
                                if (!buffer) {
                                    if (att.name === ShaderPredefined.a_Position0) {
                                        buffer = this._defaultPostProcessVertexBuffer;
                                    } else if (att.name === ShaderPredefined.a_TexCoord0) {
                                        buffer = this._defaultPostProcessTexCoordBuffer;
                                    }
                                }
                                if (buffer) buffer.use(att.location);
                            }

                            let buffer = pp.assetStore ? pp.assetStore.getDrawIndexBuffer(gl) : this._defaultPostProcessIndexBuffer;
                            if (!buffer) buffer = this._defaultPostProcessIndexBuffer;
                            if (buffer) buffer.draw(pp.material.drawMode);
                        }

                        if (useDefaultShader) pp.material.shader = null;
                    }
                }
            }
        }

        private _createDefaultPostProcessAssets(gl: GL): void {
            if (!this._defaultPostProcessVertexBuffer) {
                this._defaultPostProcessVertexBuffer = new GLVertexBuffer(gl);
                this._defaultPostProcessVertexBuffer.upload([-1, -1, -1, 1, 1, 1, 1, -1], GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW);

                this._defaultPostProcessTexCoordBuffer = new GLVertexBuffer(gl);
                this._defaultPostProcessTexCoordBuffer.upload([0, 0, 0, 1, 1, 1, 1, 0], GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW);

                this._defaultPostProcessIndexBuffer = new GLIndexBuffer(gl);
                this._defaultPostProcessIndexBuffer.upload([0, 1, 2, 0, 2, 3], GLIndexDataType.UNSIGNED_BYTE, GLUsageType.STATIC_DRAW);

                this._defaultPostProcessShader = new Shader(gl, new ShaderSource(BuiltinShader.PostProcess.Default.VERTEX), new ShaderSource(BuiltinShader.PostProcess.Default.FRAGMENT));
            }
        }
    }
}