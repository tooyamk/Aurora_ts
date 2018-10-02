///<reference path="DrawIndexSource.ts" />

namespace Aurora {
    export class AssetStore {
        public vertexSources: Map<string, VertexSource> = null;
        public drawIndexSource: DrawIndexSource = null;

        public vertexBuffers: Map<string, GLVertexBuffer> = null;
        public drawIndexBuffer: GLIndexBuffer = null;

        public customGetVertexBufferFn: (assetStore: AssetStore, info: GLProgramAttribInfo) => GLVertexBuffer = null;
        public customGetDrawIndexBufferFn: (assetStore: AssetStore) => GLIndexBuffer = null;

        constructor(vertexBuffers: Map<string, GLVertexBuffer> = null) {
            this.vertexBuffers = vertexBuffers || new Map();
        }

        public addVertexSource(source: VertexSource): boolean {
            if (source && source.name && source.name.length > 0) {
                if (!this.vertexSources) this.vertexSources = new Map();
                this.vertexSources.set(source.name, source);
                return true;
            }
            return false;
        }

        public getVertexBuffer(gl: GL, info: GLProgramAttribInfo): GLVertexBuffer {
            let buffer: GLVertexBuffer = this.vertexBuffers ? this.vertexBuffers.get(info.name) : null;
            if (!buffer && this.vertexSources) {
                let src = this.vertexSources.get(info.name);
                if (src) {
                    buffer = src.createBuffer(gl);
                } else {
                    if (info.name === ShaderPredefined.a_Normal0) {
                        let vs = this.vertexSources.get(ShaderPredefined.a_Position0);
                        if (vs && vs.data && this.drawIndexSource && this.drawIndexSource.data) {
                            let ns = MeshAssetHelper.createNormals(this.drawIndexSource.data, vs.data);
                            if (this.addVertexSource(ns)) buffer = ns.createBuffer(gl);
                        }
                    }
                }

                if (buffer) {
                    if (!this.vertexBuffers) this.vertexBuffers = new Map();
                    this.vertexBuffers.set(info.name, buffer);
                }
            }

            if (!buffer && this.customGetVertexBufferFn) buffer = this.customGetVertexBufferFn(this, info);
            return buffer;
        }

        public getDrawIndexBuffer(gl: GL): GLIndexBuffer {
            let buffer = this.drawIndexBuffer;
            if (!buffer && this.drawIndexSource) {
                buffer = this.drawIndexSource.createBuffer(gl);
                if (buffer) this.drawIndexBuffer = buffer;
            }
            if (!buffer && this.customGetDrawIndexBufferFn) buffer = this.customGetDrawIndexBufferFn(this);
            return buffer;
        }
    }
}