////<reference path="../Ref.ts"/>

namespace Aurora {
    export class Skeleton extends Ref {
        protected _bones: RefVector<Node> = null;
        protected _bonesMap: RefMap<string, Node> = null;
        protected _mapping: Map<string, uint> = null;
        
        public rootBoneNames: string[] = [];

        constructor() {
            super();

            this._bones = new RefVector();
            this._bones.retain();
            this._bonesMap = new RefMap();
            this._bonesMap.retain();
            this._mapping = new Map();
        }

        public get bones(): RefVector<Node> {
            return this._bones;
        }

        public get bonesMap(): RefMap<string, Node> {
            return this._bonesMap;
        }

        public get mapping(): Map<string, uint> {
            return this._mapping;
        }

        public addBone(bone: Node): void {
            const idx = this._bones.size;
            this._mapping.set(bone.name, idx);
            this._bones.pushBackOne(bone);
            this._bonesMap.insert(bone.name, bone);
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
            if (this._bones) {
                this._bones.release();
                this._bones = null;
            }

            if (this._bonesMap) {
                this._bonesMap.release();
                this._bonesMap = null;
            }

            this._mapping = null;
            this.rootBoneNames = null;
        }

        protected _refDestroy(): void {
            this.destroy();
        }
    }
}