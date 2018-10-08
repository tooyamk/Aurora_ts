namespace Aurora {
    export class SpriteRenderer extends AbstractRenderer {
        protected _maxVertexSize = 65536;

        protected _gl: GL;
        protected _assetStore: AssetStore = new AssetStore();
        protected _vertexSources: VertexSource[] = [];
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

            this._assetStore.vertexSources = new Map();

            this._numAllicatedVertex = 256;
            this._numAllicatedIndex = 256;

            this._assetStore.drawIndexSource = new DrawIndexSource([]);
            let ib = new GLIndexBuffer(gl);
            ib.allocate(this._numAllicatedIndex, GLIndexDataType.UNSIGNED_SHORT);
            this._assetStore.drawIndexBuffer = ib;

            this._defaultShader = new Shader(gl, null, null);
            this._defaultMaterial = new Material(this._defaultShader);
        }

        public get defaultMaterial(): Material {
            return this._defaultMaterial;
        }

        public get defaultShader(): Shader {
            return this._defaultShader;
        }

        public collectRenderingObjects(renderable: AbstractRenderable, replaceMaterials: Material[], createFn: (renderable: AbstractRenderable, material: Material, alternativeUniforms: ShaderUniforms) => void): void {
            let mats = renderable.materials;
            let len = mats ? mats.length : 1;
            if (len === 0) len = 1;

            if (replaceMaterials) {
                let len1 = replaceMaterials.length;
                if (len >= len1) {
                    for (let i = 0; i < len1; ++i) {
                        let m = mats[i];
                        createFn(renderable, replaceMaterials[i], m ? m.uniforms : this._defaultMaterial.uniforms);
                    }
                } else if (len === 1) {
                    let m = mats[0];
                    let u = m ? m.uniforms : this._defaultMaterial.uniforms;
                    for (let i = 0; i < len1; ++i) {
                        createFn(renderable, replaceMaterials[i], u);
                    }
                } else {
                    for (let i = 0; i < len; ++i) {
                        let m = mats[i];
                        createFn(renderable, replaceMaterials[i], m ? m.uniforms : this._defaultMaterial.uniforms);
                    }
                }
            } else {
                for (let i = 0; i < len; ++i) {
                    let m = mats[i];
                    createFn(renderable, m ? m : this._defaultMaterial, this._defaultMaterial.uniforms);
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
                let obj = renderingObjects[i];
                renderingData.in.renderingObject = obj;
                obj.renderable.visit(renderingData);
                let as = renderingData.out.assetStore;
                if (as && as.drawIndexSource) {
                    let mat = obj.material;
                    let uniforms = renderingData.out.uniforms;

                    if (!atts) {
                        activeMaterialFn(mat, uniforms, obj.alternativeUniforms);
                    }
                    
                    let len = -1;
                    if (atts) {
                        this._numVertexSources = 0;
                        for (let i = 0, n = atts.length; i < n; ++i) {
                            let att = atts[i];
                            let vs = as.getVertexSource(att.name);
                            if (vs) {
                                if (len < 0) {
                                    len = vs.data.length;
                                } else if (len !== vs.data.length) {
                                    len = -1;
                                    break;
                                }
                                this._vertexSources[this._numVertexSources++] = vs;
                                this._vertexSources[this._numVertexSources++] = this._getOrCreateVertexSource(name);
                            } else {
                                len = -1;
                                break;
                            }
                        }
                    }

                    if (len > 0 && len <= this._maxVertexSize) {
                        if (!Material.canCombine(this._curMaterial, mat) || !ShaderUniforms.isEqual(curShaderUniforms, uniforms)) {
                            this.flush();

                            activeMaterialFn(mat, uniforms, obj.alternativeUniforms);
                        } else if (this._numCombinedVertex + len > this._maxVertexSize) {
                            this.flush();
                        }

                        this._combine(as.drawIndexSource);
                        this._numCombinedVertex += len;
                        while (this._numCombinedVertex > this._numAllicatedVertex) {
                            this._numAllicatedVertex <<= 2;
                        }
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
                let p = this._curMaterial.shader.currentProgram;
                if (p) {
                    let atts = p.attributes;
                    for (let i = 0, n = atts.length; i < n; ++i) {
                        let name = atts[i].name;
                        let vs = this._assetStore.vertexSources.get(name);
                        let vb = this._assetStore.vertexBuffers.get(name);
                        if (vb) {
                            if (vb.numElements !== this._numAllicatedVertex) {
                                vb.reCreate();
                                vb.allocate(this._numAllicatedVertex, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW);
                            }
                        } else {
                            vb = new GLVertexBuffer(this._gl);
                            vb.allocate(this._numAllicatedVertex, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW);
                            this._assetStore.vertexBuffers.set(name, vb);
                        }

                        vb.uploadSub(vs.data, 0);
                    }

                    while (this._numCombinedIndex > this._numAllicatedIndex) {
                        this._numAllicatedIndex <<= 2;
                    }
                    let ib = this._assetStore.drawIndexBuffer;
                    if (ib.numElements !== this._numAllicatedIndex) {
                        ib.reCreate();
                        ib.allocate(this._numAllicatedIndex, GLIndexDataType.UNSIGNED_SHORT, GLUsageType.DYNAMIC_DRAW);
                    }
                    ib.uploadSub(this._assetStore.drawIndexSource.data, 0);
                }

                this.draw(this._assetStore, this._curMaterial);

                this._numCombinedVertex = 0;
                this._numCombinedIndex = 0;
            }
        }

        public destroy(): void {
            super.destroy();

            if (this._assetStore) {
                this._assetStore.destroy();
                this._assetStore = null;
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

        private _getOrCreateVertexSource(name: string): VertexSource {
            let vs = this._assetStore.vertexSources.get(name);
            if (!vs) {
                vs = new VertexSource(name, []);
                this._assetStore.vertexSources.set(name, vs);
            }
            return vs;
        }

        private _combine(drawIndexSource: DrawIndexSource): void {
            let idx = this._numCombinedVertex;
            for (let i = 0; i < this._numVertexSources; i += 2) {
                let src = this._vertexSources[i].data;
                let dst = this._vertexSources[i + 1].data;

                for (let j = 0, n = src.length; j < n; ++j) {
                    dst[idx + j] = src[j];
                }
            }

            let idx2 = this._numCombinedIndex;
            let src = drawIndexSource.data;
            let dst = this._assetStore.drawIndexSource.data;
            for (let i = 0, n = src.length; i < n; ++i) {
                dst[idx2 + i] = src[idx + i];
            }
        }
    }
}