namespace Aurora {
    export class SkinnedMeshCPUSkinningMethod extends SkinnedMesh.AbstractSkinningMethod {
        protected static readonly TMP_VEC3 = new Vector3();
        protected static readonly TMP_MAT = new Matrix44();

        protected _convertedAsset: MeshAsset;

        constructor() {
            super();
            this._convertedAsset = new MeshAsset();
            this._convertedAsset.retain();
        }

        public render(renderingData: RenderingData, asset: MeshAsset, matrices: Matrix44[]): void {
            const boneIndicesSource = asset.getVertexSource(ShaderPredefined.a_BoneIndex0);
            const boneWeightsSource = asset.getVertexSource(ShaderPredefined.a_BoneWeight0);
            if (boneIndicesSource && boneWeightsSource && boneIndicesSource.size === boneWeightsSource.size) {
                const boneIndices = boneIndicesSource.data;
                const boneWeights = boneWeightsSource.data;
                if (boneIndices && boneWeights) {
                    this._convertedAsset.link = asset;

                    const numBonesPerElement = boneIndicesSource.size;
                    const boneNames = asset.boneNames;
                    this._updateVertices(asset, ShaderPredefined.a_Position0, boneIndices, boneWeights, numBonesPerElement, boneNames, matrices, false);
                    this._updateVertices(asset, ShaderPredefined.a_Normal0, boneIndices, boneWeights, numBonesPerElement, boneNames, matrices, true);
                    this._updateVertices(asset, ShaderPredefined.a_Tangent0, boneIndices, boneWeights, numBonesPerElement, boneNames, matrices, true);
                    this._updateVertices(asset, ShaderPredefined.a_Binormal0, boneIndices, boneWeights, numBonesPerElement, boneNames, matrices, true);

                    renderingData.out.asset = this._convertedAsset;
                }
            }
        }

        public postRender(): void {
            this._convertedAsset.link = null;
        }

        protected _updateVertices(asset: MeshAsset, name: string, boneIndices: VertexSourceData, boneWeights: VertexSourceData, numBonesPerElement: uint, boneNames: string[], matrices: Matrix44[], onlyRotation: boolean): void {
            const srcSource: VertexSource = asset.getVertexSource(name);
            if (srcSource) {
                const srcData = srcSource.data;
                if (srcData) {
                    const srcOffset = srcSource.getDataOffset();
                    const srcLength = srcSource.getDataLength();

                    const srcSize = srcSource.size;

                    const numVertices: uint = (srcLength / srcSize) | 0;

                    let dstSource = this._convertedAsset.getVertexSource(name, false);
                    let dstData: VertexSourceData;
                    if (dstSource) {
                        dstData = dstSource.data;
                        if (dstData) {
                            if (dstData.length < srcLength) {
                                dstData = MeshAssetHelper.createVertexSourceData(dstData, srcLength);
                                dstSource.data = dstData;
                            }
                        } else {
                            dstData = MeshAssetHelper.createVertexSourceData(boneWeights, srcLength);
                            dstSource.data = dstData;
                        }

                        dstSource.size = srcSource.size;
                        dstSource.type = srcSource.type;
                        dstSource.normalized = srcSource.normalized;
                    } else {
                        dstData = MeshAssetHelper.createVertexSourceData(boneWeights, srcLength);
                        dstSource = new VertexSource(name, dstData, srcSource.size, srcSource.type, srcSource.normalized, GLUsageType.DYNAMIC_DRAW);
                        this._convertedAsset.addVertexSource(dstSource);
                    }

                    dstSource.length = srcLength;

                    this._convertedAsset.setVertexDirty(name, true);

                    const vec3 = SkinnedMeshCPUSkinningMethod.TMP_VEC3;
                    const mat = SkinnedMeshCPUSkinningMethod.TMP_MAT;

                    const numBones = boneNames.length;

                    for (let i = 0; i < numVertices; ++i) {
                        const idx0 = i * srcSize;
                        const idx1 = srcOffset + idx0;

                        let sx = srcData[idx1];
                        let sy = srcData[idx1 + 1];
                        let sz = srcData[idx1 + 2];

                        let dx = 0, dy = 0, dz = 0;

                        const idx2 = i * numBonesPerElement;
                        for (let j = 0; j < numBonesPerElement; ++j) {
                            const idx3 = idx2 + j;
                            const weight = boneWeights[idx3];

                            if (weight !== 0) {
                                const boneIdx = boneIndices[idx3];
                                if (onlyRotation) {
                                    matrices[boneIdx].transform33XYZ(sx, sy, sz, vec3);
                                } else {
                                    matrices[boneIdx].transform34XYZ(sx, sy, sz, vec3);
                                }

                                dx += vec3.x * weight;
                                dy += vec3.y * weight;
                                dz += vec3.z * weight;
                            }
                        }

                        dstData[idx0] = dx;
                        dstData[idx0 + 1] = dy;
                        dstData[idx0 + 2] = dz;
                    }
                }
            }
        }

        public destroy(): void {
            if (this._convertedAsset) {
                this._convertedAsset.release();
                this._convertedAsset = null;
            }
        }
    }
}