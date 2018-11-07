namespace Aurora {
    export class SpriteRenderer extends AbstractRenderer {
        protected _maxVertexSize = 65536;

        protected _gl: GL;
        protected _asset: MeshAsset = new MeshAsset();
        protected _vertexSources: VertexSource[] = [];
        protected _reformats: uint[] = [];
        protected _reformatsLen = 0;
        protected _numVertexSources = 0;
        protected _numCombinedVertex = 0;
        protected _numCombinedIndex = 0;
        protected _numAllicatedVertex = 0;
        protected _numAllicatedIndex = 0;

        protected _curMaterial: Material = null;
        protected _curProgramAtts: GLProgramAttribInfo[] = null;
        protected _curUniformInfos: GLProgramUniformInfo[] = null;

        protected _definesStack = new ShaderDataStack<ShaderDefines, ShaderDefines.Value>();
        protected _activeUniformsStack = new ShaderDataStack<ShaderUniforms, ShaderUniforms.Value>();
        protected _compareUniformsStack = new ShaderDataStack<ShaderUniforms, ShaderUniforms.Value>();

        protected _defaultMaterial: Material;
        protected _defaultShader: Shader;

        constructor(gl: GL) {
            super();
            
            this._gl = gl;

            this._asset.vertexSources = new Map();
            this._asset.vertexBuffers = new Map();

            this._numAllicatedVertex = 256;
            this._numAllicatedIndex = 256;

            this._asset.drawIndexSource = new DrawIndexSource([]);
            const ib = new GLIndexBuffer(gl);
            ib.allocate(this._numAllicatedIndex, GLIndexDataType.UNSIGNED_SHORT);
            this._asset.drawIndexBuffer = ib;

            this._defaultShader = new Shader(gl, new ShaderSource(BuiltinShader.DefaultSprite.VERTEX), new ShaderSource(BuiltinShader.DefaultSprite.FRAGMENT));
            this._defaultShader.retain();
            this._defaultMaterial = new Material(this._defaultShader);
            this._defaultMaterial.blend = new GLBlend(null, new GLBlendFunc().set(GLBlendFactorValue.SRC_ALPHA, GLBlendFactorValue.ONE_MINUS_SRC_ALPHA));
            this._defaultMaterial.cullFace = GLCullFace.NONE;
            this._defaultMaterial.depthWrite = false;
            this._defaultMaterial.depthTest = GLDepthTest.NONE;
        }

        public get defaultMaterial(): Material {
            return this._defaultMaterial;
        }

        public get defaultShader(): Shader {
            return this._defaultShader;
        }

        public collectRenderingObjects(renderable: AbstractRenderable, replaceMaterials: Material[], appendFn: AppendRenderingObjectFn): void {
            const mats = renderable.materials;
            let len = mats ? mats.length : 1;
            if (len === 0) len = 1;

            if (replaceMaterials) {
                const len1 = replaceMaterials.length;
                if (len >= len1) {
                    for (let i = 0; i < len1; ++i) {
                        const m = mats ? mats[i] : null;
                        appendFn(renderable, replaceMaterials[i], m ? m.uniforms : this._defaultMaterial.uniforms);
                    }
                } else if (len === 1) {
                    let u: ShaderUniforms;
                    if (mats) {
                        const m = mats[0];
                        u = m ? m.uniforms : this._defaultMaterial.uniforms;
                    } else {
                        u = this._defaultMaterial.uniforms;
                    }
                    for (let i = 0; i < len1; ++i) appendFn(renderable, replaceMaterials[i], u);
                } else {
                    for (let i = 0; i < len; ++i) {
                        const m = mats ? mats[i] : null;
                        appendFn(renderable, replaceMaterials[i], m ? m.uniforms : this._defaultMaterial.uniforms);
                    }
                }
            } else {
                for (let i = 0; i < len; ++i) {
                    const m = mats ? mats[i] : null;
                    appendFn(renderable, m ? m : this._defaultMaterial, this._defaultMaterial.uniforms);
                }
            }
        }

        protected _activeMaterial(material: Material, stack: ShaderUniformsStack, u1: ShaderUniforms): void {
            this._activeUniformsStack.pushBackByStack(stack).pushBack(material.uniforms).pushBack(u1);
            this._definesStack.pushBack(material.defines);
            const p = this._renderingMgr.useShader(material, this._definesStack, this._activeUniformsStack);
            this._definesStack.clear();
            if (p) {
                this._curMaterial = material;
                this._curProgramAtts = p.attributes;
                this._curUniformInfos = p.uniforms;
            } else {
                this._activeUniformsStack.clear();
            }
        }

        public render(renderingData: RenderingData, renderingObjects: RenderingObject[], start: int, end: int): void {
            this._curMaterial = null;
            this._curProgramAtts = null;
            this._curUniformInfos = null;

            for (let i = start; i <= end; ++i) {
                const obj = renderingObjects[i];
                renderingData.in.renderingObject = obj;
                obj.renderable.visit(renderingData);
                const as = renderingData.out.asset;
                if (as && as.drawIndexSource) {
                    const drawIdxLen = as.drawIndexSource.getDataLength();
                    if (!drawIdxLen) continue;

                    const mat = obj.material;
                    const uniformsStack = renderingData.out.uniformsStack;

                    if (!this._curProgramAtts) this._activeMaterial(mat, uniformsStack, obj.alternativeUniforms);
                    
                    let len = -1;
                    let needFlush = false;
                    if (this._curProgramAtts) {
                        this._numVertexSources = 0;
                        for (let i = 0, n = this._curProgramAtts.length; i < n; ++i) {
                            const att = this._curProgramAtts[i];
                            const vs = as.getVertexSource(att.name);
                            if (vs) {
                                const numElements = vs.getDataLength() / vs.size;
                                if (len < 0) {
                                    len = numElements;
                                } else if (len !== numElements) {
                                    len = -1;
                                    break;
                                }

                                if (this._pushVertexSource(att.name, vs)) needFlush = true;
                            } else {
                                len = -1;
                                break;
                            }
                        }
                    }

                    if (len > 0 && len <= this._maxVertexSize) {
                        if (needFlush) {
                            this.flush();
                            this._activeMaterial(mat, uniformsStack, obj.alternativeUniforms);

                            for (let i = 0; i < this._reformatsLen; ++i) {
                                let idx = this._reformats[i];
                                const vs0 = this._vertexSources[idx++];
                                const vs1 = this._vertexSources[idx];
                                vs1.size = vs0.size;
                                vs1.type = vs0.type;
                                vs1.normalized = vs0.normalized;
                            }
                            this._reformatsLen = 0;
                        } else {
                            if (Material.canCombine(this._curMaterial, mat)) {
                                this._compareUniformsStack.pushBackByStack(uniformsStack).pushBack(mat.uniforms).pushBack(obj.alternativeUniforms);
                                const b = ShaderDataStack.isUnifromsEqual(this._activeUniformsStack, this._compareUniformsStack, this._curUniformInfos);
                                this._compareUniformsStack.clear();
                                if (b) {
                                    if (this._numCombinedVertex + len > this._maxVertexSize) this.flush();
                                } else {
                                    this.flush();
                                    this._activeMaterial(mat, uniformsStack, obj.alternativeUniforms);
                                }
                            } else {
                                this.flush();
                                this._activeMaterial(mat, uniformsStack, obj.alternativeUniforms);
                            }
                        }

                        this._combine(as.drawIndexSource, drawIdxLen);
                        this._numCombinedVertex += len;
                        this._numCombinedIndex += drawIdxLen;
                        while (this._numCombinedVertex > this._numAllicatedVertex) this._numAllicatedVertex <<= 1;
                        while (this._numCombinedIndex > this._numAllicatedIndex) this._numAllicatedIndex <<= 1;
                    }
                }
                renderingData.out.clear();
            }

            this.flush();

            for (let i = 0, n = this._vertexSources.length; i < n; ++i) {
                if (this._vertexSources[i]) {
                    this._vertexSources[i] = null;
                } else {
                    break;
                }
            }
            this._numVertexSources = 0;
            this._curMaterial = null;
            this._curProgramAtts = null;
            this._curUniformInfos = null;
        }

        public flush(): void {
            if (this._numCombinedVertex > 0) {
                const p = this._curMaterial.shader.currentProgram;
                if (p) {
                    const as = this._asset;
                    const atts = p.attributes;
                    for (let i = 0, n = atts.length; i < n; ++i) {
                        const name = atts[i].name;
                        const vs = as.vertexSources.get(name);
                        let vb = as.vertexBuffers.get(name);
                        if (vb) {
                            if (vb.memSize !== this._numAllicatedVertex * vs.size * GL.calcMemSize(vs.type)) {
                                vb.allocate(this._numAllicatedVertex * vs.size, vs.size, vs.type, vs.normalized, GLUsageType.DYNAMIC_DRAW);
                            } else {
                                vb.resetDataAttrib(vs.size, vs.type, vs.normalized);
                            }
                        } else {
                            vb = new GLVertexBuffer(this._gl);
                            vb.allocate(this._numAllicatedVertex * vs.size, vs.size, vs.type, vs.normalized, GLUsageType.DYNAMIC_DRAW);
                            as.vertexBuffers.set(name, vb);
                        }

                        vb.uploadSub(vs.data);
                    }

                    const is = as.drawIndexSource;
                    const ib = as.drawIndexBuffer;
                    if (ib.numElements !== this._numAllicatedIndex) ib.allocate(this._numAllicatedIndex, GLIndexDataType.UNSIGNED_SHORT, GLUsageType.DYNAMIC_DRAW);
                    ib.uploadSub(is.data);
                }

                this._renderingMgr.draw(this._asset, this._curMaterial, this._numCombinedIndex);

                this._numCombinedVertex = 0;
                this._numCombinedIndex = 0;
                this._activeUniformsStack.clear();
            }
        }

        public destroy(): void {
            super.destroy();

            if (this._asset) {
                this._asset.destroy();
                this._asset = null;
            }

            this._vertexSources = null;
            this._curMaterial = null;
            this._gl = null;

            if (this._defaultMaterial) {
                this._defaultMaterial.destroy();
                this._defaultMaterial = null;
            }

            if (this._defaultShader) {
                this._defaultShader.release();
                this._defaultShader = null;
            }

            if (this._definesStack) {
                this._definesStack.clear();
                this._defaultShader = null;
            }

            if (this._activeUniformsStack) {
                this._activeUniformsStack.clear();
                this._activeUniformsStack = null;
            }

            if (this._compareUniformsStack) {
                this._compareUniformsStack.clear();
                this._compareUniformsStack = null;
            }
        }

        private _pushVertexSource(name: string, reference: VertexSource): boolean {
            let needFlush = false;
            let vs = this._asset.vertexSources.get(name);
            if (vs) {
                if (vs.size !== reference.size || vs.type !== reference.type || vs.normalized !== reference.normalized) {
                    if (this._numCombinedVertex === 0) {
                        vs.size = reference.size;
                        vs.type = reference.type;
                        vs.normalized = reference.normalized;
                    } else {
                        this._reformats[this._reformatsLen++] = this._numVertexSources;
                        needFlush = true;
                    }
                }
            } else {
                vs = new VertexSource(name, [], reference.size, reference.type, reference.normalized, reference.usage);
                this._asset.vertexSources.set(name, vs);
            }

            this._vertexSources[this._numVertexSources++] = reference;
            this._vertexSources[this._numVertexSources++] = vs;

            return needFlush;
        }

        private _combine(drawIndexSource: DrawIndexSource, drawIndexLen: uint): void {
            const idx = this._numCombinedVertex;
            for (let i = 0; i < this._numVertexSources; ++i) {
                const vs = this._vertexSources[i];
                const src = vs.data;
                const dst = this._vertexSources[++i].data;

                for (let j = vs.getDataOffset(), n = vs.getDataLength(); j < n; ++j) dst[idx + j] = src[j];
            }

            const idx2 = this._numCombinedIndex;
            const src = drawIndexSource.data;
            const dst = this._asset.drawIndexSource.data;
            for (let i = drawIndexSource.getDataOffset(); i < drawIndexLen; ++i) dst[idx2 + i] = src[idx + i];
        }
    }
}