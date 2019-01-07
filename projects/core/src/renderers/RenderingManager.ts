///<reference path="PostProcess.ts"/>
///<reference path="../shaders/builtin/postprocesses/Default.ts"/>

namespace Aurora {
    export class RenderingManager {
        protected _renderingQueue: RenderingObject[] = [];
        protected _renderingQueueLength: uint = 0;
        protected _renderingQueueCapacity: uint = 0;
        protected _sortTmpRenderingQueue: RenderingObject[] = [];

        protected _renderables: AbstractRenderable[] = [];

        protected _renderers: AbstractRenderer[] = [];

        protected _shaderDefines: ShaderDefines = null;
        protected _shaderUniforms: ShaderUniforms = null;

        protected _cameraWorldMatrix = new Matrix44();
        protected _viewToProjMatrix = new Matrix44();
        protected _worldToViewMatrix = new Matrix44();
        protected _worldToProjMatrix = new Matrix44();
        protected _viewToProjM44Array = new Float32Array(16);
        protected _worldToViewM44Array = new Float32Array(16);
        protected _worldToProjM44Array = new Float32Array(16);

        protected _defaultPPVertexBuffer: GLVertexBuffer = null;
        protected _defaultPPUVBuffer: GLVertexBuffer = null;
        protected _defaultPPIndexBuffer: GLIndexBuffer = null;
        protected _defaultPPShader: Shader = null;
        protected _defaultPPDefinesList: ShaderDefinesList = null;
        protected _defaultPPUniformsList: ShaderUniformsList = null;

        protected _renderingData: RenderingData;

        protected _appendRenderingObjectFn: (renderable: AbstractRenderable, material: Material, alternativeUniforms: ShaderUniforms) => void = null;

        constructor(gl: GL) {
            this._shaderDefines = new ShaderDefines();
            this._shaderDefines.retain();

            this._shaderUniforms = new ShaderUniforms();
            this._shaderUniforms.retain();

            this._shaderDefines.set(ShaderPredefined.AMBIENT_COLOR, true);
            this._shaderDefines.set(ShaderPredefined.LIGHTING_SPECULAR, ShaderPredefined.LIGHTING_SPECULAR_BLINN_PHONE);

            this._shaderUniforms.setNumbers(ShaderPredefined.u_AlphaTestCompareValue, 1);
            this._shaderUniforms.setNumbers(ShaderPredefined.u_LighitngSpecularShininess, 32);
            this._shaderUniforms.setNumbers(ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);
            this._shaderUniforms.setNumbers(ShaderPredefined.u_SpecularColor, 1, 1, 1, 1);
            this._shaderUniforms.setNumbers(ShaderPredefined.u_AmbientColor, 0.1, 0.1, 0.1);
            this._shaderUniforms.setNumbers(ShaderPredefined.u_ReflectionColor, 1, 1, 1, 1);

            this._renderingData = new RenderingData();

            this._renderingQueueCapacity = 100;
            for (let i = 0; i < this._renderingQueueCapacity; ++i) this._renderingQueue[i] = new RenderingObject();
            this._sortTmpRenderingQueue.length = this._renderingQueueCapacity;

            this._appendRenderingObjectFn = this.appendRenderingObject.bind(this);
        }

        public dispose(): void {
            if (this._defaultPPVertexBuffer) {
                this._defaultPPVertexBuffer.release();
                this._defaultPPVertexBuffer = null;

                this._defaultPPUVBuffer.release();
                this._defaultPPUVBuffer = null;

                this._defaultPPIndexBuffer.release();
                this._defaultPPIndexBuffer = null;

                this._defaultPPShader.release();
                this._defaultPPShader = null;

                this._defaultPPDefinesList.clear();
                this._defaultPPDefinesList = null;

                this._defaultPPUniformsList.clear();
                this._defaultPPUniformsList = null;
            }

            if (this._shaderDefines) {
                this._shaderDefines.release();
                this._shaderDefines = null;
            }

            if (this._shaderUniforms) {
                this._shaderUniforms.release();
                this._shaderUniforms = null;
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
            const vp = pass.viewport;
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

        public render(gl: GL, camera: Camera, node: Node, lights: AbstractLight[] = null, replaceMaterials: Material[] = null): void {
            if (camera.node) {
                camera.node.getWorldMatrix(this._cameraWorldMatrix);
                camera.node.getInverseWorldMatrix(this._worldToViewMatrix);
            } else {
                this._cameraWorldMatrix.identity34();
                this._worldToViewMatrix.identity34();
            }

            this._renderingData.in.camera = camera;

            camera.getProjectionMatrix(this._viewToProjMatrix);

            this._worldToViewMatrix.append44(this._viewToProjMatrix, this._worldToProjMatrix);

            this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_V2P, this._viewToProjMatrix.toArray44(false, this._viewToProjM44Array));
            this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_W2P, this._worldToProjMatrix.toArray44(false, this._worldToProjM44Array));
            this._shaderUniforms.setNumberArray(ShaderPredefined.u_M44_W2V, this._worldToViewMatrix.toArray44(false, this._worldToViewM44Array));
            this._shaderUniforms.setNumbers(ShaderPredefined.u_CamPosW, this._cameraWorldMatrix.m30, this._cameraWorldMatrix.m31, this._cameraWorldMatrix.m32);

            this.begin(gl, camera);

            this._collectNode(node, camera.cullingMask, replaceMaterials);
            for (let i = 0, n = this._renderables.length; i < n; ++i) {
                const r = this._renderables[i];
                if (r) {
                    this._renderables[i] = null;
                } else {
                    break;
                }
            }

            if (this._renderingQueueLength > 0) Sort.Merge.sort(this._renderingQueue, this._sortFn, 0, this._renderingQueueLength - 1, this._sortTmpRenderingQueue);

            this._renderByQueue(lights);

            //clean
            for (let i = 0; i < this._renderingQueueLength; ++i) this._renderingQueue[i].clean();
            this._renderingQueueLength = 0;

            this._renderingData.clear();
        }

        protected _sortFn(a: RenderingObject, b: RenderingObject): boolean {
            const sub = a.material.renderingPriorityLv0 - b.material.renderingPriorityLv0;
            if (sub < 0) {
                return true;
            } else if (sub === 0) {
                const rs = a.material.renderingPriorityLv1;
                const value = rs - b.material.renderingPriorityLv1;
                if (value === 0) {
                    switch (rs) {
                        case RenderingSortLv1.FAR_TO_NEAR: {
                            const az = a.l2v.m32, bz = b.l2v.m32;
                            if (az > bz) {
                                return true;
                            } else if (az < bz) {
                                return false;
                            } else {
                                return a.renderingPriorityLv2 <= b.renderingPriorityLv2;
                            }
                        }
                        case RenderingSortLv1.NEAR_TO_FAR: {
                            const az = a.l2v.m32, bz = b.l2v.m32;
                            if (az < bz) {
                                return true;
                            } else if (az > bz) {
                                return false;
                            } else {
                                return a.renderingPriorityLv2 <= b.renderingPriorityLv2;
                            }
                        }
                        default:
                            return a.renderingPriorityLv2 <= b.renderingPriorityLv2;
                    }
                } else {
                    return value < 0;
                }
            } else {
                return false;
            }
        }

        public appendRenderingObject(renderable: AbstractRenderable, material: Material, alternativeUniforms: ShaderUniforms, sortWeight: number): void {
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
                queueNode.renderingPriorityLv2 = sortWeight;

                const l2w = queueNode.l2w;
                l2w.set34(renderable.node.readonlyWorldMatrix);
                l2w.append34(this._worldToViewMatrix, queueNode.l2v);
                l2w.append44(this._worldToProjMatrix, queueNode.l2p);
            }
        }

        public useShader(material: Material, definesList: ShaderDefinesList, uniformsList: ShaderUniformsList): GLProgram {
            definesList.pushBack(this._shaderDefines);
            const b = material.ready(definesList);
            definesList.eraseTail();
            if (b) {
                uniformsList.pushBack(this._shaderUniforms);
                const p = material.use(uniformsList);
                uniformsList.eraseTail();
                return p;
            }

            return null;
        }

        public draw(asset: MeshAsset, material: Material, count: uint = null, offset: uint = 0): void {
            this._draw(asset, material, material.shader.currentProgram, count, offset);
        }

        public useAndDraw(asset: MeshAsset, material: Material, definesList: ShaderDefinesList, uniformsList: ShaderUniformsList, count: uint = null, offset: uint = 0): void {
            const p = this.useShader(material, definesList, uniformsList);
            if (p) this._draw(asset, material, p, count, offset);
        }

        private _draw(asset: MeshAsset, material: Material, program: GLProgram, count: uint = null, offset: uint = 0): void {
            const gl = program.gl;
            const ib = asset.getDrawIndexBuffer(gl);
            if (ib) {
                let valid = true;
                const atts = program.attributes;
                for (let i = 0, n = atts.length; i < n; ++i) {
                    let att = atts[i];
                    let vb = asset.getVertexBuffer(gl, att);
                    if (vb) {
                        vb.use(att.location);
                    } else {
                        valid = false;
                        console.log("draw not found attribute: " + att.name);
                    }
                }

                if (valid) ib.draw(material.drawMode, count, offset);
            }
        }

        private _collectNode(node: Node, cullingMask: uint, replaceMaterials: Material[]): void {
            if (node.active) {
                if (node.layer & cullingMask) {
                    const num = node.getComponentsByType(AbstractRenderable, true, cullingMask, this._renderables);
                    for (let i = 0; i < num; ++i) {
                        const renderable = this._renderables[i];
                        if (renderable.renderer && renderable.checkRenderable()) renderable.renderer.collect(renderable, replaceMaterials, this._appendRenderingObjectFn);
                    }
                }

                let child = node._childHead;
                while (child) {
                    this._collectNode(child, cullingMask, replaceMaterials);
                    child = child._next;
                }
            }
        }

        private _renderByQueue(lights: AbstractLight[]): void {
            if (this._renderingQueueLength > 0) {
                for (let i = 0, n = this._renderers.length; i < n; ++i) this._renderers[i].preRender(this, lights);

                const renderer = this._renderingQueue[0].renderable.renderer;
                let start = 0;
                for (let i = 1; i < this._renderingQueueLength; ++i) {
                    const obj = this._renderingQueue[i];

                    if (obj.renderable.renderer !== renderer) {
                        if (renderer) renderer.render(this._renderingData, this._renderingQueue, start, i - 1);
                        start = i;
                    }
                }

                if (renderer) renderer.render(this._renderingData, this._renderingQueue, start, this._renderingQueueLength - 1);

                for (let i = 0, n = this._renderers.length; i < n; ++i) {
                    const renderer = this._renderers[i];
                    renderer.isRendering = false;
                    renderer.postRender();
                }
                this._renderers.length = 0;
            }
        }

        public postProcess(gl: GL, postProcesses: PostProcess[]): void {
            if (postProcesses) {
                this._createDefaultPPAssets(gl);

                for (let i = 0, n = postProcesses.length; i < n; ++i) {
                    const pp = postProcesses[i];
                    if (pp && pp.enabled && pp.material) {
                        const useDefaultShader = !!pp.material.shader;
                        if (useDefaultShader) pp.material.shader = this._defaultPPShader;

                        const mat = pp.material;
                        this._defaultPPDefinesList.pushBack(mat.defines);
                        const b = mat.ready(this._defaultPPDefinesList);
                        this._defaultPPDefinesList.clear();
                        if (b) {
                            this.begin(gl, pp);

                            this._defaultPPUniformsList.pushBack(mat.uniforms).pushBack(this._shaderUniforms);
                            const p = mat.use(this._defaultPPUniformsList);
                            this._defaultPPUniformsList.clear();

                            const atts = p.attributes;
                            for (let i = 0, n = atts.length; i < n; ++i) {
                                const att = atts[i];
                                let buffer = pp.asset ? pp.asset.getVertexBuffer(gl, att) : null;
                                if (!buffer) {
                                    if (att.name === ShaderPredefined.a_Position0) {
                                        buffer = this._defaultPPVertexBuffer;
                                    } else if (att.name === ShaderPredefined.a_UV0) {
                                        buffer = this._defaultPPUVBuffer;
                                    }
                                }
                                if (buffer) buffer.use(att.location);
                            }

                            let buffer = pp.asset ? pp.asset.getDrawIndexBuffer(gl) : this._defaultPPIndexBuffer;
                            if (!buffer) buffer = this._defaultPPIndexBuffer;
                            if (buffer) buffer.draw(mat.drawMode);
                        }

                        if (useDefaultShader) mat.shader = null;
                    }
                }
            }
        }

        private _createDefaultPPAssets(gl: GL): void {
            if (!this._defaultPPVertexBuffer) {
                this._defaultPPVertexBuffer = new GLVertexBuffer(gl);
                this._defaultPPVertexBuffer.retain();
                this._defaultPPVertexBuffer.upload([-1, -1, -1, 1, 1, 1, 1, -1], 0, -1, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW);

                this._defaultPPUVBuffer = new GLVertexBuffer(gl);
                this._defaultPPUVBuffer.retain();
                this._defaultPPUVBuffer.upload([0, 0, 0, 1, 1, 1, 1, 0], 0, -1, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW);

                this._defaultPPIndexBuffer = new GLIndexBuffer(gl);
                this._defaultPPIndexBuffer.retain();
                this._defaultPPIndexBuffer.upload([0, 1, 2, 0, 2, 3], 0, -1, GLIndexDataType.UNSIGNED_BYTE, GLUsageType.STATIC_DRAW);

                this._defaultPPShader = new Shader(gl, new ShaderSource(BuiltinShader.PostProcess.Default.VERTEX), new ShaderSource(BuiltinShader.PostProcess.Default.FRAGMENT));
                this._defaultPPShader.retain();

                this._defaultPPDefinesList = new ShaderDataList<ShaderDefines, ShaderDefines.Value>();
                this._defaultPPUniformsList = new ShaderDataList<ShaderUniforms, ShaderUniforms.Value>();
            }
        }
    }
}