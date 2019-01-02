///<reference path="DrawIndexSource.ts"/>

namespace Aurora {
    export class MeshAsset extends Ref {
        private static _idGenerator = 0;

        protected _id: int;

        public name = "";

        public boneNames: string[] = null;
        protected _boneNamesUpdateHash: uint;
        protected _boneNamesUpdateCount: uint = 0;

        public bonePreOffsetMatrices: Matrix44[] = null;
        public bonePostOffsetMatrices: Matrix44[] = null;

        public vertexSources: Map<string, VertexSource> = null;
        public drawIndexSource: DrawIndexSource = null;

        protected _vertexBuffers: RefMap<string, GLVertexBuffer> = null;
        protected _drawIndexBuffer: GLIndexBuffer = null;

        public vertexDirty: Set<string> = null;
        public drawIndexDirty = false;

        public customGetVertexBufferFn: (asset: MeshAsset, info: GLProgramAttribInfo) => GLVertexBuffer = null;
        public customGetDrawIndexBufferFn: (asset: MeshAsset) => GLIndexBuffer = null;

        public autoGenerateNormal = true;
        public autoGenerateTangent = true;
        public autoGenerateBinormal = true;

        protected _link: MeshAsset = null;

        protected _updateHashBase: uint;

        constructor() {
            super();

            this._id = ++MeshAsset._idGenerator;

            this._updateHashBase = CRC32.calcUintStep(0xFFFFFFFF, this._id);
            this._boneNamesUpdateHash = CRC32.calcFinish(CRC32.calcUintStep(this._updateHashBase, this._boneNamesUpdateCount));
        }

        public get id(): int {
            return this._id;
        }

        public get link(): MeshAsset {
            return this._link;
        }

        public set link(value: MeshAsset) {
            if (this._link !== value) {
                if (value) value.retain();
                if (this._link) this._link.release();
                this._link = value;
            }
        }

        public get vertexBuffers(): RefMap<string, GLVertexBuffer> {
            return this._vertexBuffers;
        }

        public set vertexBuffers(bufs: RefMap<string, GLVertexBuffer>) {
            if (this._vertexBuffers !== bufs) {
                if (bufs) bufs.retain();
                if (this._vertexBuffers) this._vertexBuffers.release();
                this._vertexBuffers = bufs;
            }
        }

        public get drawIndexBuffer(): GLIndexBuffer {
            return this._drawIndexBuffer;
        }

        public set drawIndexBuffer(buf: GLIndexBuffer) {
            if (this._drawIndexBuffer !== buf) {
                if (buf) buf.retain();
                if (this._drawIndexBuffer) this._drawIndexBuffer.release();
                this._drawIndexBuffer = buf;
            }
        }

        public get boneNamesUpdateHash(): uint {
            return this._boneNamesUpdateHash;
        }

        public boneNamesUpdated(): void {
            this._boneNamesUpdateHash = CRC32.calcFinish(CRC32.calcUintStep(this._updateHashBase, ++this._boneNamesUpdateCount));
        }

        public getVertexSource(name: string, checkLink: boolean = true): VertexSource {
            let vs: VertexSource = null;
            if (this.vertexSources) vs = this.vertexSources.get(name);
            if (!vs && checkLink && this._link) vs = this._link.getVertexSource(name);

            return vs;
        }

        public addVertexSource(source: VertexSource): boolean {
            if (source && source.name) {
                if (!this.vertexSources) this.vertexSources = new Map();
                this.vertexSources.set(source.name, source);
                return true;
            }
            return false;
        }

        public setVertexDirty(name: string, dirty: boolean = true): void {
            if (name) {
                if (dirty) {
                    if (!this.vertexDirty) this.vertexDirty = new Set();
                    this.vertexDirty.add(name);
                } else if (this.vertexDirty) {
                    this.vertexDirty.delete(name);
                }
            }
        }

        public getDrawIndexSource(checkLink: boolean = true): DrawIndexSource {
            let is = this.drawIndexSource;
            if (!is && checkLink && this._link) is = this._link.getDrawIndexSource();
            return is;
        }

        public getVertexBuffer(gl: GL, info: GLProgramAttribInfo): GLVertexBuffer {
            let buffer: GLVertexBuffer = this._vertexBuffers ? this._vertexBuffers.find(info.name) : null;
            if (buffer) {
                if (this.vertexSources && this.vertexDirty && this.vertexDirty.has(info.name)) {
                    const src = this.vertexSources.get(info.name);
                    if (src) {
                        buffer.upload(src.data, src.offset, src.length, src.size, src.type, src.normalized, src.usage);
                        this.vertexDirty.delete(info.name);
                    }
                }
            } else {
                if (this.vertexSources) {
                    const src = this.vertexSources.get(info.name);
                    if (src) {
                        buffer = src.createBuffer(gl);
                    } else {
                        switch (info.name) {
                            case ShaderPredefined.a_Normal0: {
                                if (this.autoGenerateNormal) {
                                    const vs = this.createNormals();
                                    if (vs) buffer = vs.createBuffer(gl);
                                }

                                break;
                            }
                            case ShaderPredefined.a_Tangent0: {
                                if (this.autoGenerateTangent) {
                                    const vs = this.createTangents();
                                    if (vs) buffer = vs.createBuffer(gl);
                                }

                                break;
                            }
                            case ShaderPredefined.a_Binormal0: {
                                if (this.autoGenerateBinormal) {
                                    const vs = this.createBinormals();
                                    if (vs) buffer = vs.createBuffer(gl);
                                }

                                break;
                            }
                            default:
                                break;
                        }
                    }

                    this.addVertexBuffer(info.name, buffer);
                }

                if (!buffer) {
                    if (this.customGetVertexBufferFn) buffer = this.customGetVertexBufferFn(this, info);
                    if (!buffer && this._link) buffer = this._link.getVertexBuffer(gl, info);
                }

                if (buffer && this.vertexDirty) this.vertexDirty.delete(info.name);
            }

            return buffer;
        }

        public setSkinNunBonesPerVertex(n: uint): void {
            if (n >= 1 && n <= 4) {
                const indices = this.getVertexSource(ShaderPredefined.a_BoneIndex0);
                const weights = this.getVertexSource(ShaderPredefined.a_BoneWeight0);
                if (indices && weights && indices.size === weights.size && indices.size !== n) {
                    const len = indices.getDataLength();
                    if (len === weights.getDataLength()) {
                        const indexData = indices.data;
                        const weightData = weights.data;
                        if (indexData && weightData) {
                            const oldSize = indices.size;
                            if (oldSize < n) {

                            } else {

                            }
                        }
                    }
                }
            }
        }

        public addVertexBuffer(name: string, buffer: GLVertexBuffer): void {
            if (name && buffer) {
                if (!this._vertexBuffers) {
                    this._vertexBuffers = new RefMap();
                    this._vertexBuffers.retain();
                }
                this._vertexBuffers.insert(name, buffer);
            }
        }

        public createNormals(): VertexSource {
            let vs: VertexSource = null;

            let pos = this.getVertexSource(ShaderPredefined.a_Position0);
            let idx = this.getDrawIndexSource();

            if (pos && pos.data && idx && idx.data) {
                vs = MeshAssetHelper.createNormals(idx.data, pos.data);
                this.addVertexSource(vs);
            }

            return vs;
        }

        public createTangents(): VertexSource {
            let vs: VertexSource = null;

            let pos = this.getVertexSource(ShaderPredefined.a_Position0);
            let uv = this.getVertexSource(ShaderPredefined.a_UV0);
            let idx = this.getDrawIndexSource();

            if (pos && pos.data && uv && uv.data && idx && idx.data) {
                vs = MeshAssetHelper.createTangents(idx.data, pos.data, uv.data);
                this.addVertexSource(vs)
            }

            return vs;
        }

        public createBinormals(): VertexSource {
            let vs: VertexSource = null;

            let nrm = this.getVertexSource(ShaderPredefined.a_Normal0);
            let tan = this.getVertexSource(ShaderPredefined.a_Tangent0);
            let idx = this.getDrawIndexSource();

            if (!nrm) nrm = this.createNormals();
            if (!tan) tan = this.createTangents();

            if (nrm && nrm.data && tan && tan.data && idx && idx.data) {
                vs = MeshAssetHelper.createBinormals(nrm.data, tan.data);
                this.addVertexSource(vs)
            }

            return vs;
        }

        public getDrawIndexBuffer(gl: GL): GLIndexBuffer {
            let buffer = this._drawIndexBuffer;
            if (!buffer) {
                if (this.drawIndexSource) {
                    buffer = this.drawIndexSource.createBuffer(gl);
                    if (buffer) {
                        this._drawIndexBuffer = buffer;
                        this._drawIndexBuffer.retain();
                    }
                }

                if (!buffer) {
                    if (this.customGetDrawIndexBufferFn) buffer = this.customGetDrawIndexBufferFn(this);
                    if (!buffer && this._link) buffer = this._link.getDrawIndexBuffer(gl);
                }
            }
            
            return buffer;
        }

        public destroy(): void {
            this.vertexSources = null;
            this.drawIndexSource = null;

            this.vertexBuffers = null;
            this.drawIndexBuffer = null;

            this.vertexDirty = null;

            this.customGetVertexBufferFn = null;
            this.customGetDrawIndexBufferFn = null;

            this.link = null;
        }

        protected _refDestroy(): void {
            this.destroy();
        }
    }
}