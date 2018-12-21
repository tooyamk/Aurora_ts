///<reference path="../Mesh.ts"/>

namespace Aurora {
    export class SkinnedMesh extends Mesh {
        protected static readonly EMPTY_OFFSET_MATRICES: Matrix44[] = [];

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

                let preOffsetMatrices = this._asset.bonePreOffsetMatrices;
                if (!preOffsetMatrices) preOffsetMatrices = SkinnedMesh.EMPTY_OFFSET_MATRICES;
                let postOffsetMatrices = this._asset.bonePostOffsetMatrices;
                if (!postOffsetMatrices) postOffsetMatrices = SkinnedMesh.EMPTY_OFFSET_MATRICES;

                const rawBones = this._skeleton.bonesMap.raw;

                const boneNames = this._asset.boneNames;
                const numBones = boneNames.length;
                const finalMatrices = this._finalMatrices;
                if (numBones > finalMatrices.length) {
                    for (let i = this._finalMatrices.length; i < numBones; ++i) finalMatrices[i] = new Matrix44();
                }
                for (let i = 0; i < numBones; ++i) {
                    const bone = rawBones.get(boneNames[i]);
                    if (!bone) continue;

                    const mat = finalMatrices[i];

                    const preMat = preOffsetMatrices[i];
                    const postMat = postOffsetMatrices[i];

                    if (preMat) {
                        preMat.append34(bone.readonlyWorldMatrix, mat);
                        if (postMat) mat.append34(postMat);
                    } else {
                        if (postMat) {
                            bone.readonlyWorldMatrix.append34(postMat, mat);
                        } else {
                            mat.set34(bone.readonlyWorldMatrix);
                        }
                    }
                }

                this._skinningMethod.render(renderingData, this._asset, finalMatrices);
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