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

        public render(renderingData: RenderingData, renderingObjects: RenderingObject[], start: int, end: int): void {
            this._curMaterial = null;
            let atts: GLProgramAttribInfo[] = null;
            let curShaderUniforms: ShaderUniforms = null;

            let activeMaterialFn = (material: Material, u0: ShaderUniforms, u1: ShaderUniforms) => {
                let su: ShaderUniforms;
                let tail: ShaderUniforms = null;
                if (u0) {
                    su = u0;
                    tail = su.tail;
                    tail.next = u1;
                } else {
                    su = u1;
                }
                let p = this.useShader(material, su);
                if (tail) tail.next = null;
                if (p) {
                    this._curMaterial = material;
                    atts = p.attributes;
                    curShaderUniforms = u0;
                }
            };

            for (let i = start; i <= end; ++i) {
                const obj = renderingObjects[i];
                renderingData.in.renderingObject = obj;
                obj.renderable.visit(renderingData);
                const as = renderingData.out.asset;
                if (as && as.drawIndexSource) {
                    const mat = obj.material;
                    const uniforms = renderingData.out.uniforms;

                    if (!atts) activeMaterialFn(mat, uniforms, obj.alternativeUniforms);
                    
                    let len = -1;
                    let needFlush = false;
                    if (atts) {
                        this._numVertexSources = 0;
                        for (let i = 0, n = atts.length; i < n; ++i) {
                            const att = atts[i];
                            const vs = as.getVertexSource(att.name);
                            if (vs) {
                                const numElements = vs.data.length / vs.size;
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
                            activeMaterialFn(mat, uniforms, obj.alternativeUniforms);

                            for (let i = 0; i < this._reformatsLen; ++i) {
                                let idx = this._reformats[i];
                                const vs0 = this._vertexSources[idx++];
                                const vs1 = this._vertexSources[idx];
                                vs1.size = vs0.size;
                                vs1.type = vs0.type;
                                vs1.normalized = vs0.normalized;
                            }
                            this._reformatsLen = 0;
                        } else if (!Material.canCombine(this._curMaterial, mat) || !ShaderUniforms.isEqual(curShaderUniforms, uniforms)) {
                            this.flush();
                            activeMaterialFn(mat, uniforms, obj.alternativeUniforms);
                        } else if (this._numCombinedVertex + len > this._maxVertexSize) {
                            this.flush();
                        }

                        this._combine(as.drawIndexSource);
                        this._numCombinedVertex += len;
                        this._numCombinedIndex += as.drawIndexSource.data.length;
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
                            if (vb.memSize !== this._numAllicatedVertex * vs.size * GLVertexBuffer.calcSizePerElement(vs.type)) {
                                vb.reCreate();
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
                    if (ib.numElements !== this._numAllicatedIndex) {
                        ib.reCreate();
                        ib.allocate(this._numAllicatedIndex, GLIndexDataType.UNSIGNED_SHORT, GLUsageType.DYNAMIC_DRAW);
                    }
                    ib.uploadSub(is.data);
                }

                this.draw(this._asset, this._curMaterial, this._numCombinedIndex);

                this._numCombinedVertex = 0;
                this._numCombinedIndex = 0;
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
                this._defaultMaterial.destroy(false);
                this._defaultMaterial = null;
            }

            if (this._defaultShader) {
                this._defaultShader.destroy();
                this._defaultShader = null;
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

        private _combine(drawIndexSource: DrawIndexSource): void {
            const idx = this._numCombinedVertex;
            for (let i = 0; i < this._numVertexSources; i += 2) {
                const vs = this._vertexSources[i];
                const src = vs.data;
                const dst = this._vertexSources[i + 1].data;

                const offset = idx * vs.size;
                for (let j = 0, n = src.length; j < n; ++j) dst[idx + j] = src[j];
            }

            const idx2 = this._numCombinedIndex;
            const src = drawIndexSource.data;
            const dst = this._asset.drawIndexSource.data;
            for (let i = 0, n = src.length; i < n; ++i) dst[idx2 + i] = src[idx + i];
        }
    }
}