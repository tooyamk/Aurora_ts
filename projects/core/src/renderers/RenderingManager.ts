///<reference path="PostProcess.ts" />
///<reference path="../shaders/builtin/postprocesses/Default.ts" />

namespace Aurora {
    export class RenderingManager {
        protected _renderingQueue: RenderingObject[] = [];
        protected _renderingQueueLength: uint = 0;
        protected _renderingQueueCapacity: uint = 0;

        protected _renderables: AbstractRenderable[] = [];

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

        protected _defaultPPVertexBuffer: GLVertexBuffer = null;
        protected _defaultPPUVBuffer: GLVertexBuffer = null;
        protected _defaultPPIndexBuffer: GLIndexBuffer = null;
        protected _defaultPPShader: Shader = null;
        protected _defaultPPDefinesStack: ShaderDefinesStack = null;
        protected _defaultPPUniformsStack: ShaderUniformsStack = null;

        protected _renderingData: RenderingData;

        protected _appendRenderingObjectFn: (renderable: AbstractRenderable, material: Material, alternativeUniforms: ShaderUniforms) => void = null;

        constructor() {
            this._shaderDefines.setDefine(ShaderPredefined.LIGHTING_SPECULAR, ShaderPredefined.LIGHTING_SPECULAR_BLINN_PHONE);

            this._shaderUniforms.setNumbers(ShaderPredefined.u_AlphaTestCompareValue, 1);
            this._shaderUniforms.setNumbers(ShaderPredefined.u_LighitngSpecularShininess, 32);
            this._shaderUniforms.setNumbers(ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);
            this._shaderUniforms.setNumbers(ShaderPredefined.u_SpecularColor, 1, 1, 1, 1);
            this._shaderUniforms.setNumbers(ShaderPredefined.u_AmbientColor, 0.1, 0.1, 0.1);
            this._shaderUniforms.setNumbers(ShaderPredefined.u_ReflectionColor, 1, 1, 1, 1);

            this._renderingData = new RenderingData();

            this._renderingQueueCapacity = 100;
            for (let i = 0; i < this._renderingQueueCapacity; ++i) this._renderingQueue[i] = new RenderingObject();

            this._appendRenderingObjectFn = this.appendRenderingObject.bind(this);
        }

        public dispose(): void {
            if (this._defaultPPVertexBuffer) {
                this._defaultPPVertexBuffer.destroy();
                this._defaultPPVertexBuffer = null;

                this._defaultPPUVBuffer.destroy();
                this._defaultPPUVBuffer = null;

                this._defaultPPIndexBuffer.destroy();
                this._defaultPPIndexBuffer = null;

                this._defaultPPShader.destroy();
                this._defaultPPShader = null;

                this._defaultPPDefinesStack.clear();
                this._defaultPPDefinesStack = null;

                this._defaultPPUniformsStack.clear();
                this._defaultPPUniformsStack = null;
            }

            if (this._shaderDefines) {
                this._shaderDefines.destroy();
                this._shaderDefines = null;
            }

            if (this._shaderUniforms) {
                this._shaderUniforms.destroy();
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
                this._cameraWorldMatrix.identity();
                this._worldToViewMatrix.identity();
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

            if (this._renderingQueueLength > 0) {
                Sort.Merge.sort(this._renderingQueue, (a: RenderingObject, b: RenderingObject) => {
                    const sub = a.material.renderingPriority - b.material.renderingPriority;
                    if (sub < 0) {
                        return true;
                    } else if (sub === 0) {
                        const value = a.material.renderingSort - b.material.renderingSort;
                        if (value === 0) {
                            switch (a.material.renderingSort) {
                                case RenderingSort.FAR_TO_NEAR:
                                    return a.localToView.m32 >= b.localToView.m32;
                                case RenderingSort.NEAR_TO_FAR:
                                    return a.localToView.m32 <= b.localToView.m32;
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

        public useShader(material: Material, definesStack: ShaderDefinesStack, uniformsStack: ShaderUniformsStack, onShaderPreUse: () => void = null): GLProgram {
            definesStack.pushBack(this._shaderDefines);
            const b = material.ready(definesStack);
            definesStack.eraseTail();
            if (b) {
                if (onShaderPreUse) onShaderPreUse();

                uniformsStack.pushBack(this._shaderUniforms);
                const p = material.use(uniformsStack);
                uniformsStack.eraseTail();
                return p;
            }

            return null;
        }

        public draw(asset: MeshAsset, material: Material, count: uint = null, offset: uint = 0): void {
            this._draw(asset, material, material.shader.currentProgram, count, offset);
        }

        public useAndDraw(asset: MeshAsset, material: Material, definesStack: ShaderDefinesStack, uniformsStack: ShaderUniformsStack, onShaderPreUse: () => void = null, count: uint = null, offset: uint = 0): void {
            const p = this.useShader(material, definesStack, uniformsStack, onShaderPreUse);
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
                        console.log("draw not found attribute : " + att.name);
                        //p.gl.deactiveVertexAttrib(att.location);
                    }
                }

                if (valid) ib.draw(material.drawMode, count, offset);
            }
        }

        private _collectNode(node: Node, cullingMask: uint, replaceMaterials: Material[]): void {
            if (node.active) {
                if (node.layer & cullingMask) {
                    let num = node.getComponentsByType(AbstractRenderable, true, this._renderables);
                    for (let i = 0; i < num; ++i) {
                        let renderable = this._renderables[i];
                        if (renderable.renderer && renderable.checkRenderable()) {
                            renderable.renderer.collectRenderingObjects(renderable, replaceMaterials, this._appendRenderingObjectFn);
                        }
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
                        const useDefaultShader = pp.material.shader === null;
                        if (useDefaultShader) pp.material.shader = this._defaultPPShader;

                        const mat = pp.material;
                        this._defaultPPDefinesStack.pushBack(mat.defines);
                        const b = mat.ready(this._defaultPPDefinesStack);
                        this._defaultPPDefinesStack.clear();
                        if (b) {
                            this.begin(gl, pp);

                            this._defaultPPUniformsStack.pushBack(mat.uniforms).pushBack(this._shaderUniforms);
                            const p = mat.use(this._defaultPPUniformsStack);
                            this._defaultPPUniformsStack.clear();

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
                this._defaultPPVertexBuffer.upload([-1, -1, -1, 1, 1, 1, 1, -1], GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW);

                this._defaultPPUVBuffer = new GLVertexBuffer(gl);
                this._defaultPPUVBuffer.upload([0, 0, 0, 1, 1, 1, 1, 0], GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW);

                this._defaultPPIndexBuffer = new GLIndexBuffer(gl);
                this._defaultPPIndexBuffer.upload([0, 1, 2, 0, 2, 3], GLIndexDataType.UNSIGNED_BYTE, GLUsageType.STATIC_DRAW);

                this._defaultPPShader = new Shader(gl, new ShaderSource(BuiltinShader.PostProcess.Default.VERTEX), new ShaderSource(BuiltinShader.PostProcess.Default.FRAGMENT));

                this._defaultPPDefinesStack = new ShaderDataStack<ShaderDefines, ShaderDefines.Value>();
                this._defaultPPUniformsStack = new ShaderDataStack<ShaderUniforms, ShaderUniforms.Value>();
            }
        }
    }
}