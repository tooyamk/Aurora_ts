namespace Aurora {
    export class SpriteRenderer extends AbstractRenderer {
        protected _maxVertexSize: uint = 65536;

        protected _gl: GL;
        protected _asset = new MeshAsset();
        protected _vertexSources: VertexSource[] = [];
        protected _reformats: uint[] = [];
        protected _reformatsLen: uint = 0;
        protected _numVertexSources: uint = 0;
        protected _numCombinedVertex: uint = 0;
        protected _numCombinedIndex: uint = 0;
        protected _numAllicatedVertex: uint = 0;
        protected _numAllicatedIndex = 0;

        protected _curMaterial: Material = null;
        protected _curProgramAtts: GLProgramAttribInfo[] = null;
        protected _curUniformInfos: GLProgramUniformInfo[] = null;
        protected _curShaderNumDefines: uint = 0;

        protected _definesList = new ShaderDataList<ShaderDefines, ShaderDefines.Value>();
        protected _activeUniformsList = new ShaderDataList<ShaderUniforms, ShaderUniforms.Value>();
        protected _compareUniformsList = new ShaderDataList<ShaderUniforms, ShaderUniforms.Value>();

        protected _defaultMaterial: Material;
        protected _defaultShader: Shader;

        protected _renderQueue: RenderingObject[] = null;
        protected _renderQueueStart: uint = 0;
        protected _renderQueueEnd: int = 0;

        protected _renderFn: (renderingData: RenderingData) => void = null;

        constructor(gl: GL) {
            super();
            
            this._gl = gl;

            this._asset.vertexSources = new Map();
            this._asset.vertexBuffers = new RefMap();

            this._numAllicatedVertex = 256;
            this._numAllicatedIndex = 256;

            this._asset.drawIndexSource = new DrawIndexSource(new Uint16Array(this._numAllicatedIndex));
            const ib = new GLIndexBuffer(gl);
            ib.allocate(this._numAllicatedIndex, GLIndexDataType.UNSIGNED_SHORT);
            this._asset.drawIndexBuffer = ib;

            const spriteDefault = BuiltinShader.Sprite.Default;
            this._defaultShader = new Shader(gl, new ShaderSource(spriteDefault.VERTEX), new ShaderSource(spriteDefault.FRAGMENT));
            this._defaultShader.retain();
            this._defaultMaterial = new Material(this._defaultShader);
            this._defaultMaterial.retain();
            this._defaultMaterial.blend = new GLBlend(null, new GLBlendFunc().set(GLBlendFactorValue.SRC_ALPHA, GLBlendFactorValue.ONE_MINUS_SRC_ALPHA));
            this._defaultMaterial.cullFace = GLCullFace.NONE;
            this._defaultMaterial.depthWrite = false;
            this._defaultMaterial.depthTest = GLDepthTest.NONE;

            this._renderFn = this._render.bind(this);
        }

        public get defaultMaterial(): Material {
            return this._defaultMaterial;
        }

        public get defaultShader(): Shader {
            return this._defaultShader;
        }

        public collect(renderable: AbstractRenderable, replaceMaterials: Material[], appendFn: AppendRenderingObjectFn): void {
            const mats = renderable.getMaterials();
            const rawMats = mats ? mats.raw : null;
            let len = rawMats ? rawMats.length : 1;
            if (len === 0) len = 1;

            if (replaceMaterials) {
                const len1 = replaceMaterials.length;
                if (len >= len1) {
                    for (let i = 0; i < len1; ++i) {
                        const m = rawMats ? rawMats[i] : null;
                        renderable.collect(replaceMaterials[i], m ? m : this._defaultMaterial, appendFn);
                    }
                } else if (len === 1) {
                    let m: Material;
                    if (rawMats) {
                        m = rawMats[0];
                        if (!m) m = this._defaultMaterial;
                    } else {
                        m = this._defaultMaterial;
                    }
                    for (let i = 0; i < len1; ++i) renderable.collect(replaceMaterials[i], m, appendFn);
                } else {
                    for (let i = 0; i < len; ++i) {
                        const m = rawMats ? rawMats[i] : null;
                        renderable.collect(replaceMaterials[i], m ? m : this._defaultMaterial, appendFn);
                    }
                }
            } else {
                for (let i = 0; i < len; ++i) {
                    const m = rawMats ? rawMats[i] : null;
                    renderable.collect(m ? m : this._defaultMaterial, this._defaultMaterial, appendFn);
                }
            }
        }

        protected _activeMaterial(material: Material, defineList: ShaderDefinesList, uniformsList: ShaderUniformsList, u1: ShaderUniforms): void {
            this._activeUniformsList.pushBackByList(uniformsList).pushBack(material.uniforms).pushBack(u1);
            this._definesList.pushBackByList(defineList).pushBack(material.defines);
            const p = this._renderingMgr.useShader(material, this._definesList, this._activeUniformsList);
            this._definesList.clear();
            if (p) {
                this._curMaterial = material;
                this._curProgramAtts = p.attributes;
                this._curUniformInfos = p.uniforms;
                this._curShaderNumDefines = material.shader.defines.length;
            } else {
                this._activeUniformsList.clear();
            }
        }

        public render(renderingData: RenderingData, renderingObjects: RenderingObject[], start: int, end: int): void {
            this._curMaterial = null;
            this._curProgramAtts = null;
            this._curUniformInfos = null;
            this._curShaderNumDefines = 0;

            this._renderQueue = renderingObjects;
            this._renderQueueStart = start;
            this._renderQueueEnd = start - 1;

            for (let i = start; i <= end; ++i) {
                const obj = renderingObjects[i];
                renderingData.in.renderingObject = obj;
                obj.callback(renderingData);
                renderingData.render(this._renderFn);
                this._renderQueueEnd = i;
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
            this._curShaderNumDefines = 0;
            this._renderQueue = null;
        }

        private _render(renderingData: RenderingData): void {
            const out = renderingData.out;
            const as = out.asset;
            if (as && as.drawIndexSource) {
                const drawIdxLen = as.drawIndexSource.getDataLength();
                if (drawIdxLen > 0) {
                    const obj = renderingData.in.renderingObject;

                    const mat = obj.material;
                    const definesList = out.definesList;
                    const uniformsList = out.uniformsList;

                    if (!this._curProgramAtts) this._activeMaterial(mat, definesList, uniformsList, obj.alternativeUniforms);

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
                            this._activeMaterial(mat, definesList, uniformsList, obj.alternativeUniforms);

                            for (let i = 0; i < this._reformatsLen; ++i) {
                                let idx = this._reformats[i];
                                const vs0 = this._vertexSources[idx];
                                const vs1 = this._vertexSources[++idx];
                                vs1.size = vs0.size;
                                vs1.type = vs0.type;
                                vs1.normalized = vs0.normalized;
                            }
                            this._reformatsLen = 0;
                        } else {
                            let canCombine = true;
                            if (Material.isEqual(this._curMaterial, mat)) {
                                let b = true;
                                if (this._curShaderNumDefines > 0) {
                                    this._definesList.pushBackByList(definesList).pushBack(mat.defines).pushBack(this._renderingMgr.shaderDefines);
                                    b = this._curMaterial.shader.isEqual(this._definesList);
                                    this._definesList.clear();
                                }
                                if (b) {
                                    if (this._curUniformInfos.length > 0) {
                                        this._compareUniformsList.pushBackByList(uniformsList).pushBack(mat.uniforms).pushBack(obj.alternativeUniforms).pushBack(this._renderingMgr.shaderUniforms);
                                        b = ShaderDataList.isUnifromsEqual(this._activeUniformsList, this._compareUniformsList, this._curUniformInfos);
                                        this._compareUniformsList.clear();
                                    }
                                    if (b) {
                                        if (this._numCombinedVertex + len > this._maxVertexSize) this.flush();
                                    } else {
                                        canCombine = false;
                                    }
                                } else {
                                    canCombine = false;
                                }
                            } else {
                                canCombine = false;
                            }

                            if (!canCombine) {
                                this.flush();
                                this._activeMaterial(mat, definesList, uniformsList, obj.alternativeUniforms);
                            }
                        }

                        this._combine(as.drawIndexSource, drawIdxLen);
                        this._numCombinedVertex += len;
                        while (this._numCombinedVertex > this._numAllicatedVertex) this._numAllicatedVertex <<= 1;
                    }
                }
            }
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
                        let vb = as.vertexBuffers.find(name);
                        if (vb) {
                            if (vb.memSize !== this._numAllicatedVertex * vs.size * GL.calcMemSize(vs.type)) {
                                vb.allocate(this._numAllicatedVertex * vs.size, vs.size, vs.type, vs.normalized, GLUsageType.DYNAMIC_DRAW);
                            } else {
                                vb.resetDataAttrib(vs.size, vs.type, vs.normalized);
                            }
                        } else {
                            vb = new GLVertexBuffer(this._gl);
                            vb.allocate(this._numAllicatedVertex * vs.size, vs.size, vs.type, vs.normalized, GLUsageType.DYNAMIC_DRAW);
                            as.vertexBuffers.insert(name, vb);
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
                this._activeUniformsList.clear();
            }
            
            if (this._renderQueue && this._renderQueueStart <= this._renderQueueEnd) {
                for (let i = this._renderQueueStart, n = this._renderQueueEnd; i <= n; ++i) this._renderQueue[i].renderable.postRender();
                this._renderQueueStart = this._renderQueueEnd + 1;
            }
        }

        public destroy(): void {
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

            if (this._definesList) {
                this._definesList.clear();
                this._defaultShader = null;
            }

            if (this._activeUniformsList) {
                this._activeUniformsList.clear();
                this._activeUniformsList = null;
            }

            if (this._compareUniformsList) {
                this._compareUniformsList.clear();
                this._compareUniformsList = null;
            }

            super.destroy();
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
            const idx2 = this._numCombinedIndex;
            let dst = this._asset.drawIndexSource.data;
            this._numCombinedIndex += drawIndexLen;
            if (this._numCombinedIndex > this._numAllicatedIndex) {
                do {
                    this._numAllicatedIndex <<= 1
                } while (this._numCombinedIndex > this._numAllicatedIndex);
                const now = new Uint16Array(this._numAllicatedIndex);
                for (let i = 0, n = dst.length; i < n; ++i) now[i] = dst[i];
                this._asset.drawIndexSource.data = now;
                dst = now;
            }

            const idx = this._numCombinedVertex;
            for (let i = 0; i < this._numVertexSources; ++i) {
                const vs = this._vertexSources[i];
                const src = vs.data;
                const dst = this._vertexSources[++i].data;

                for (let j = vs.getDataOffset(), n = vs.getDataLength(); j < n; ++j) dst[idx + j] = src[j];
            }

            const src = drawIndexSource.data;
            for (let i = drawIndexSource.getDataOffset(); i < drawIndexLen; ++i) dst[idx2 + i] = src[idx + i];
        }
    }
}