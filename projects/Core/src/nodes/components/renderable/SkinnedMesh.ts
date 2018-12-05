///<reference path="Mesh.ts"/>

namespace Aurora {
    export class SkinnedMesh extends Mesh {
        protected static readonly TMP_VEC3 = new Vector3();
        protected static readonly TMP_MAT = new Matrix44();
        protected static readonly TMP_MAT_EMPTY_ARR: Matrix44[] = [];

        protected _skeleton: Skeleton = null;

        protected _convertedAsset: MeshAsset;

        protected _finalMatrices: Matrix44[] = [];

        constructor() {
            super();

            this._convertedAsset = new MeshAsset();
            this._convertedAsset.retain();

            this._convertedAsset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, [], GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));
        }

        protected _changedAsset(): void {
            this._convertedAsset.link = this._asset;
        }

        public get skeleton(): Skeleton {
            return this._skeleton;
        }

        public set skeleton(ske: Skeleton) {
            if (this._skeleton !== ske) {
                if (ske) ske.retain();
                if (this._skeleton) this._skeleton.release();
                this._skeleton = ske;
            }
        }

        public checkRenderable(): boolean {
            return !!this._asset;
        }

        public render(renderingData: RenderingData): void {
            if (this._skeleton && this._skeleton.bones && this._asset.boneNames) {
                const boneIndicesSource = this._asset.getVertexSource(ShaderPredefined.a_BoneIndex0);
                const boneWeightsSource = this._asset.getVertexSource(ShaderPredefined.a_BoneWeight0);
                if (boneIndicesSource && boneWeightsSource && boneIndicesSource.size === boneWeightsSource.size) {
                    const boneIndices = boneIndicesSource.data;
                    const boneWeights = boneWeightsSource.data;
                    if (boneIndices && boneWeights) {
                        let bindPreMatrices = this._asset.bonePreOffsetMatrices;
                        if (!bindPreMatrices) bindPreMatrices = SkinnedMesh.TMP_MAT_EMPTY_ARR;
                        let bindPostMatrices = this._asset.bonePostOffsetMatrices;
                        if (!bindPostMatrices) bindPostMatrices = SkinnedMesh.TMP_MAT_EMPTY_ARR;

                        const rawBones = this._skeleton.bones.raw;
 
                        const boneNames = this._asset.boneNames;
                        const numBones = boneNames.length;
                        if (numBones > this._finalMatrices.length) {
                            for (let i = this._finalMatrices.length; i < numBones; ++i) this._finalMatrices[i] = new Matrix44();
                        }
                        for (let i = 0; i < numBones; ++i) {
                            const bone = rawBones.get(this._asset.boneNames[i]);
                            if (!bone) continue;

                            const mat = this._finalMatrices[i];

                            const bindPreMat = bindPreMatrices[i];
                            const bindPostMat = bindPostMatrices[i];

                            if (bindPreMat) {
                                bindPreMat.append44(bone.readonlyWorldMatrix, mat);
                                if (bindPostMat) mat.append44(bindPostMat);
                            } else {
                                if (bindPostMat) {
                                    bone.readonlyWorldMatrix.append44(bindPostMat, mat);
                                } else {
                                    mat.set44(bone.readonlyWorldMatrix);
                                }
                            }
                        }

                        const numBonesPerElement = boneIndicesSource.size;
                        this._updateVertices(ShaderPredefined.a_Position0, boneIndices, boneWeights, numBonesPerElement, false);
                        this._updateVertices(ShaderPredefined.a_Normal0, boneIndices, boneWeights, numBonesPerElement, true);

                        renderingData.out.asset = this._convertedAsset;
                    }
                }
            } else {
                super.render(renderingData);
            }
        }

        protected _updateVertices(name: string, boneIndices: uint[], boneWeights: number[], numBonesPerElement: uint, onlyRotation: boolean): void {
            const srcSource = this._asset.getVertexSource(name);
            if (srcSource) {
                const srcData = srcSource.data;
                if (srcData) {
                    const srcOffset = srcSource.getDataOffset();
                    const srcLength = srcSource.getDataLength();

                    const srcSize = srcSource.size;

                    const numVertices: uint = (srcLength / srcSize) | 0;

                    let dstSource = this._convertedAsset.getVertexSource(name);
                    let dstData: number[];
                    if (dstSource) {
                        dstData = dstSource.data;
                        if (dstData) {
                            if (dstData.length < srcLength) dstData.length = srcLength;
                        } else {
                            dstData = [];
                            dstData.length = srcLength;
                            dstSource.data = dstData;
                        }

                        dstSource.size = srcSource.size;
                        dstSource.type = srcSource.type;
                        dstSource.normalized = srcSource.normalized;
                    } else {
                        dstData = [];
                        dstData.length = srcLength;
                        dstSource = new VertexSource(name, dstData, srcSource.size, srcSource.type, srcSource.normalized, GLUsageType.DYNAMIC_DRAW);
                        this._convertedAsset.addVertexSource(dstSource);
                    }

                    dstSource.length = srcLength;

                    this._convertedAsset.setVertexDirty(name, true);

                    const vec3 = SkinnedMesh.TMP_VEC3;
                    const mat = SkinnedMesh.TMP_MAT;

                    const boneNames = this._asset.boneNames;
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
                                    this._finalMatrices[boneIdx].transform33XYZ(sx, sy, sz, vec3);
                                } else {
                                    this._finalMatrices[boneIdx].transform44XYZ(sx, sy, sz, vec3);
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
            this.skeleton = null;

            if (this._convertedAsset) {
                this._convertedAsset.release();
                this._convertedAsset = null;
            }

            this._finalMatrices = null;

            super.destroy();
        }
    }
}