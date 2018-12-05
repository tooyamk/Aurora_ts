////<reference path="../Ref.ts"/>

namespace Aurora {
    export class Skeleton extends Ref {
        protected _bones: RefMap<string, Node> = null;
        
        public rootBoneNames: string[] = [];

        public get bones(): RefMap<string, Node> {
            return this._bones;
        }

        public set bones(bones: RefMap<string, Node>) {
            if (this._bones !== bones) {
                if (bones) bones.retain();
                if (this._bones) this._bones.release();
                this._bones = bones;
            }
        }

        public setPose(matrices: Map<string, Matrix44>): void {
            if (this._bones && matrices) {
                const raw = this._bones.raw;
                for (let itr of raw) {
                    const b = itr[1];
                    if (b) {
                        const m = matrices.get(itr[0]);
                        if (m) b.setLocalMatrix(m);
                    }
                }
            }
        }

        public destroy(): void {
            this.bones = null;
            this.rootBoneNames = null;
        }

        protected _refDestroy(): void {
            this.destroy();
        }
    }
}