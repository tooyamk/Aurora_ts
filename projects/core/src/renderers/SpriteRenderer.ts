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
        }

        public render(renderingObjects: RenderingObject[], start: int, end: int): void {
            this._curMaterial = null;
            let atts: GLProgramAttribInfo[] = null;
            let curShaderUniforms: ShaderUniforms = null;

            let activeMaterialFn = (material: Material, shaderUniforms: ShaderUniforms) => {
                if (material.ready(this._shaderDefines)) {
                    let su: ShaderUniforms;
                    let oldNext: ShaderUniforms = null;
                    if (shaderUniforms) {
                        su = shaderUniforms;
                        oldNext = su.next;
                        su.next = this._shaderUniforms;
                    } else {
                        su = this._shaderUniforms;
                    }
                    let p = material.use(this._shaderUniforms);
                    if (shaderUniforms) {
                        su.next = oldNext;
                    }
                    if (p) {
                        this._curMaterial = material;
                        atts = p.attributes;
                        curShaderUniforms = shaderUniforms;
                    }
                }
            };

            for (let i = start; i <= end; ++i) {
                let obj = renderingObjects[i];

                let as = obj.renderable.visit(obj);
                if (as && as.drawIndexSource) {
                    let mat = obj.material;

                    if (!atts) {
                        activeMaterialFn(mat, as.shaderUniforms);
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
                        if (!Material.canCombine(this._curMaterial, mat) || !ShaderUniforms.isEqual(curShaderUniforms, as.shaderUniforms)) {
                            this.flush();

                            activeMaterialFn(mat, as.shaderUniforms);
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