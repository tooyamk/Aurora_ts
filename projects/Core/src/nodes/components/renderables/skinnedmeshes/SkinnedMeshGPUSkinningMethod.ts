namespace Aurora {
    export class SkinnedMeshGPUSkinningMethod extends SkinnedMesh.AbstractSkinningMethod {
        protected static readonly TMP_VEC3 = new Vector3();
        protected static readonly TMP_MAT = new Matrix44();

        protected _matrices: Float32Array;
        protected _defines: ShaderDefines;
        protected _uniforms: ShaderUniforms;

        constructor() {
            super();

            this._matrices = new Float32Array(180);

            this._defines = new ShaderDefines();
            this._defines.retain();

            this._uniforms = new ShaderUniforms();
            this._uniforms.retain();

            this._uniforms.setNumberArray(ShaderPredefined.u_SkinningMatrices, this._matrices);
        }

        public render(renderingData: RenderingData, asset: MeshAsset, matrices: Matrix44[]): void {
            const boneIndicesSource = asset.getVertexSource(ShaderPredefined.a_BoneIndex0);
            const boneWeightsSource = asset.getVertexSource(ShaderPredefined.a_BoneWeight0);
            if (boneIndicesSource && boneWeightsSource && boneIndicesSource.size === boneWeightsSource.size) {
                const boneIndices = boneIndicesSource.data;
                const boneWeights = boneWeightsSource.data;
                if (boneIndices && boneWeights) {
                    const numBonesPerElement = boneIndicesSource.size;

                    let data = this._matrices;
                    const n = matrices.length;
                    const maxData = n * 12;
                    if (data.length < maxData) {
                        data = new Float32Array(maxData);
                        this._matrices = data;
                        this._uniforms.setNumberArray(ShaderPredefined.u_SkinningMatrices, this._matrices);
                    }

                    let idx = 0;
                    for (let i = 0; i < n; ++i) {
                        const m = matrices[i];
                        data[idx++] = m.m00;
                        data[idx++] = m.m10;
                        data[idx++] = m.m20;
                        data[idx++] = m.m30;

                        data[idx++] = m.m01;
                        data[idx++] = m.m11;
                        data[idx++] = m.m21;
                        data[idx++] = m.m31;

                        data[idx++] = m.m02;
                        data[idx++] = m.m12;
                        data[idx++] = m.m22;
                        data[idx++] = m.m32;
                    }

                    const out = renderingData.out;
                    this._defines.set(ShaderPredefined.NUM_BONES_PER_VERTEX, numBonesPerElement);
                    out.definesList.pushBack(this._defines);
                    out.uniformsList.pushBack(this._uniforms);
                    out.asset = asset;
                }
            }
        }

        public postRender(): void {
        }

        public destroy(): void {
            if (this._defines) {
                this._defines.delete(ShaderPredefined.NUM_BONES_PER_VERTEX);
                this._defines.release();
                this._defines = null;
            }

            if (this._uniforms) {
                this._uniforms.delete(ShaderPredefined.u_SkinningMatrices);
                this._uniforms.release();
                this._uniforms = null;
            }
        }
    }
}