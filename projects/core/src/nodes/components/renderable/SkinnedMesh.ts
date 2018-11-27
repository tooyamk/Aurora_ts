///<reference path="Mesh.ts"/>

namespace Aurora {
    export class SkinnedMesh extends Mesh {
        protected static readonly TMP_VEC3 = new Vector3();
        protected static readonly TMP_MAT = new Matrix44();

        public skeleton: Skeleton = null;

        protected _convertedAsset: MeshAsset;

        constructor() {
            super();

            this._convertedAsset = new MeshAsset();
            this._convertedAsset.retain();

            this._convertedAsset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, [], GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));
        }

        protected _chanedAsset(): void {
            this._convertedAsset.link = this._asset;
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

                        const numVertices: uint = (verticesLength / verticesSize) | 0;

                        const vs = this._convertedAsset.getVertexSource(ShaderPredefined.a_Position0);
                        vs.size = verticesSize;
                        vs.type = verticesSource.type;
                        vs.normalized = verticesSource.normalized;

                        vs.offset = 0;
                        vs.length = verticesSource.length;

                        const data = vs.data;
                        
                        if (data.length < verticesLength) data.length = verticesLength;
                        this._convertedAsset.setVertexDirty(ShaderPredefined.a_Position0, true);

                        const vec3 = SkinnedMesh.TMP_VEC3;
                        const mat = SkinnedMesh.TMP_MAT;

                        let bindPreMatrices = this._asset.bindPreMatrices;
                        if (!bindPreMatrices) bindPreMatrices = [];
                        let bindPostMatrices = this._asset.bindPostMatrices;
                        if (!bindPostMatrices) bindPostMatrices = [];

                        //const m = new Matrix44();

                        for (let i = 0; i < numVertices; ++i) {
                            const idx0 = i * verticesSize;
                            const idx1 = verticesOffset + idx0;

                            let sx = vertices[idx1];
                            let sy = vertices[idx1 + 1];
                            let sz = vertices[idx1 + 2];

                            let dx = 0, dy = 0, dz = 0;

                            const idx2 = i * size;
                            for (let j = 0; j < size; ++j) {
                                const idx3 = idx2 + j;
                                const weight = boneWeights[idx3];

                                if (weight !== 0) {
                                    const boneIdx = boneIndices[idx3];
                                    const bone = this.skeleton.bones[boneIdx];
                                    if (!bone) continue;

                                    const bindMat = bindPreMatrices[boneIdx];
                                    const bindPostMat = bindPostMatrices[boneIdx];

                                    if (bindMat) {
                                        bindMat.append34(bone.readonlyWorldMatrix, mat);
                                        if (bindPostMat) mat.append34(bindPostMat);
                                        mat.transform34XYZ(sx, sy, sz, vec3);
                                    } else {
                                        if (bindPostMat) {
                                            bone.readonlyWorldMatrix.append34(bindPostMat, mat);
                                            mat.transform34XYZ(sx, sy, sz, vec3);
                                        } else {
                                            bone.readonlyWorldMatrix.transform34XYZ(sx, sy, sz, vec3);
                                        }
                                    }
                                    
                                    dx += vec3.x * weight;
                                    dy += vec3.y * weight;
                                    dz += vec3.z * weight;
                                }
                            }

                            data[idx0] = dx;
                            data[idx0 + 1] = dy;
                            data[idx0 + 2] = dz;
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