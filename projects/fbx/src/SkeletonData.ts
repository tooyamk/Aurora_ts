namespace Aurora.FBX {
    export class SkeletonData {
        public bones: Aurora.Node[] = [];
        public rootBoneIndices: uint[] = [];

        private _numBones = 0;
        private _bonesByName: Map<string, uint> = new Map();
        private _bonesByID: Map<uint, uint> = new Map();

        private _boneIDs: uint[] = [];

        public addBone(bone: Aurora.Node, id: uint): void {
            this.bones[this._numBones] = bone;
            this._boneIDs[this._numBones] = id;
            this._bonesByName.set(bone.name, this._numBones);
            this._bonesByID.set(id, this._numBones);
            ++this._numBones;
        }

        public getIndexByName(name: string): int {
            return this._bonesByName.has(name) ? this._bonesByName.get(name) : -1;
        }

        public finish(collections: Collections): void {
            for (let i = 0, n = this._numBones; i < n; ++i) {
                const bone = this.bones[i];
                const m = collections.findParent(this._boneIDs[i], Model);
                if (m) {
                    this.bones[this._bonesByID.get(m.id)].addChild(bone);
                } else {
                    this.rootBoneIndices.push(i);
                }
            }
        }
    }
}