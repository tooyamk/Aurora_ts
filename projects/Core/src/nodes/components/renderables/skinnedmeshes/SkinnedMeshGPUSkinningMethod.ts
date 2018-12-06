namespace Aurora {
    export class SkinnedMeshGPUSkinningMethod extends SkinnedMesh.AbstractSkinningMethod {
        protected static readonly TMP_VEC3 = new Vector3();
        protected static readonly TMP_MAT = new Matrix44();

        protected _matrices: number[];
        protected _uniforms: ShaderUniforms;

        constructor() {
            super();

            this._matrices = [];

            this._uniforms = new ShaderUniforms();
            this._uniforms.retain();

            this._uniforms.setNumberArray(ShaderPredefined.u_SkinningMatrices, this._matrices);
        }

        public render(renderingData: RenderingData, asset: MeshAsset, matrices: Matrix44[]): void {
            const data = this._matrices;
            const n = matrices.length;
            const maxData = n * 12;
            if (data.length < maxData) data.length = maxData;

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

            renderingData.out.uniformsList.pushBack(this._uniforms);
            renderingData.out.asset = asset;
        }

        public postRender(): void {
        }

        public destroy(): void {
            if (this._uniforms) {
                this._uniforms.delete(ShaderPredefined.u_SkinningMatrices);
                this._uniforms.release();
                this._uniforms = null;
            }
        }
    }
}