///<reference path="../Mesh.ts"/>

namespace Aurora {
    export class SkinnedMesh extends Mesh {
        protected static readonly TMP_MAT_EMPTY_ARR: Matrix44[] = [];

        protected _skinningMethod: SkinnedMesh.AbstractSkinningMethod = null;
        protected _skeleton: Skeleton = null;
        protected _finalMatrices: Matrix44[] = [];
        protected _isSkinningRender = false;

        constructor() {
            super();
        }

        public get skinningMethod(): SkinnedMesh.AbstractSkinningMethod {
            return this._skinningMethod;
        }

        public set skinningMethod(value: SkinnedMesh.AbstractSkinningMethod) {
            if (this._skinningMethod !== value) {
                if (value) value.retain();
                if (this._skinningMethod) this._skinningMethod.release();
                this._skinningMethod = value;
            }
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
            if (this._skeleton && this._skeleton.bones && this._asset.boneNames && this._skinningMethod) {
                this._isSkinningRender = true;

                let bindPreMatrices = this._asset.bonePreOffsetMatrices;
                if (!bindPreMatrices) bindPreMatrices = SkinnedMesh.TMP_MAT_EMPTY_ARR;
                let bindPostMatrices = this._asset.bonePostOffsetMatrices;
                if (!bindPostMatrices) bindPostMatrices = SkinnedMesh.TMP_MAT_EMPTY_ARR;

                const rawBones = this._skeleton.bonesMap.raw;

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
                        bindPreMat.append34(bone.readonlyWorldMatrix, mat);
                        if (bindPostMat) mat.append34(bindPostMat);
                    } else {
                        if (bindPostMat) {
                            bone.readonlyWorldMatrix.append34(bindPostMat, mat);
                        } else {
                            mat.set34(bone.readonlyWorldMatrix);
                        }
                    }
                }

                this._skinningMethod.render(renderingData, this._asset, this._finalMatrices);
            } else {
                this._isSkinningRender = false;

                super.render(renderingData);
            }
        }

        public postRender(): void {
            if (this._isSkinningRender) {
                if (this._skinningMethod) this._skinningMethod.postRender();
            } else {
                super.postRender();
            }
        }

        public destroy(): void {
            this.skeleton = null;
            this.skinningMethod = null;

            this._finalMatrices = null;

            super.destroy();
        }
    }

    export namespace SkinnedMesh {
        export abstract class AbstractSkinningMethod extends Ref {
            abstract render(renderingData: RenderingData, asset: MeshAsset, matrices: Matrix44[]): void;
            abstract postRender(): void;
            abstract destroy(): void;

            protected _refDestroy(): void {
                this.destroy();
            }
        }
    }
}