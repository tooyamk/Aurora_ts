///<reference path="Mesh.ts"/>

namespace Aurora {
    export class SkinnedMesh extends Mesh {
        public skeleton: Skeleton = null;

        protected _convertedAsset: MeshAsset;

        constructor() {
            super();

            this._convertedAsset = new MeshAsset();
            this._convertedAsset.retain();

            this._convertedAsset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, [], GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));
        }

        public set asset(value: MeshAsset) {
            if (this._asset !== value) {
                if (value) value.retain();
                if (this._asset) this._asset.release();
                this._asset = value;

                this._convertedAsset.link = value;
            }
        }

        public checkRenderable(): boolean {
            return !!this._asset;
        }

        public render(renderingData: RenderingData): void {
            if (this.skeleton) {
                const verticesSource = this._asset.getVertexSource(ShaderPredefined.a_Position0);
                const boneIndicesSource = this._asset.getVertexSource(ShaderPredefined.a_BoneIndex0);
                const boneWeightsSource = this._asset.getVertexSource(ShaderPredefined.a_BoneWeight0);
                if (verticesSource && boneIndicesSource && boneWeightsSource && boneIndicesSource.size === boneWeightsSource.size) {
                    const vertices = verticesSource.data;
                    const boneIndices = boneIndicesSource.data;
                    const boneWeights = boneWeightsSource.data;
                    if (vertices && boneIndices && boneWeights) {
                        const verticesLength = verticesSource.getDataLength();
                        const verticesOffset = verticesSource.getDataOffset();
                        const boneIndicesOffset = boneIndicesSource.getDataOffset();
                        const boneIndicesLength = boneIndicesSource.getDataLength();
                        const boneWeightsOffset = boneWeightsSource.getDataOffset();
                        const boneWeightsLength = boneWeightsSource.getDataLength();

                        const verticesSize = verticesSource.size;
                        const size = boneIndicesSource.size;

                        const numVertices = verticesLength / verticesSize;

                        const vs = this._convertedAsset.getVertexSource(ShaderPredefined.a_Position0);
                        vs.size = verticesSize;
                        vs.type = verticesSource.type;
                        vs.normalized = verticesSource.normalized;

                        vs.offset = 0;
                        vs.length = verticesSource.length;

                        const data = vs.data;
                        
                        if (data.length < verticesLength) data.length = verticesLength;
                        this._convertedAsset.setVertexDirty(ShaderPredefined.a_Position0, true);

                        for (let i = 0; i < verticesLength; i += 3) {
                            let idx = verticesOffset + i;

                            let x = vertices[idx];
                            let y = vertices[idx + 1];
                            let z = vertices[idx + 2];

                            for (let j = 0; j < size; ++j) {

                            }

                            data[i] = x;
                            data[i + 1] = y;
                            data[i + 2] = z;
                        }

                        renderingData.out.asset = this._convertedAsset;
                    }
                }
            } else {
                super.render(renderingData);
            }
        }

        public destroy(): void {
            this.skeleton = null;

            if (this._convertedAsset) {
                this._convertedAsset.release();
                this._convertedAsset = null;
            }

            super.destroy();
        }
    }
}