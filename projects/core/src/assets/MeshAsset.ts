///<reference path="DrawIndexSource.ts"/>

namespace Aurora {
    export class MeshAsset extends Ref {
        public name = "";

        public boneNames: string[] = null;

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

        protected _link: MeshAsset = null;

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

        public getVertexSource(name: string): VertexSource {
            return this.vertexSources ? this.vertexSources.get(name) : null;
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

        public addVertexSource(source: VertexSource): boolean {
            if (source && source.name) {
                if (!this.vertexSources) this.vertexSources = new Map();
                this.vertexSources.set(source.name, source);
                return true;
            }
            return false;
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
                        if (this.autoGenerateNormal && info.name === ShaderPredefined.a_Normal0) {
                            let vs = this.vertexSources.get(ShaderPredefined.a_Position0);
                            let is = this.drawIndexSource;

                            if (this._link) {
                                if ((!vs || !vs.data) && this._link.vertexSources) vs = this._link.vertexSources.get(ShaderPredefined.a_Position0);
                                if (!is || !is.data) is = this._link.drawIndexSource; 
                            }
                            
                            if (vs && vs.data && is && is.data) {
                                const ns = MeshAssetHelper.createNormals(is.data, vs.data);
                                if (this.addVertexSource(ns)) buffer = ns.createBuffer(gl);
                            }
                        }
                    }

                    if (buffer) {
                        if (!this._vertexBuffers) {
                            this._vertexBuffers = new RefMap();
                            this._vertexBuffers.retain();
                        }
                        this._vertexBuffers.insert(info.name, buffer);
                    }
                }

                if (!buffer) {
                    if (this.customGetVertexBufferFn) buffer = this.customGetVertexBufferFn(this, info);
                    if (!buffer && this._link) buffer = this._link.getVertexBuffer(gl, info);
                }

                if (buffer && this.vertexDirty) this.vertexDirty.delete(info.name);
            }

            return buffer;
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