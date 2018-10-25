namespace Aurora {
    export class FBXCollections {
        private _geometries: FBXGeometry[] = [];
        private _deformers: FBXDeformer[] = [];
        private _models: FBXModel[] = [];
        private _connections: FBXConnection[] = [];

        private _objects: Map<uint, FBXNode> = new Map();
        private _parentsMap: Map<uint, uint[]> = new Map();
        private _childrenMap: Map<uint, uint[]> = new Map();

        public addGeometry(g: FBXGeometry): FBXGeometry {
            this._geometries.push(g);
            return g;
        }

        public addDeformer(d: FBXDeformer): FBXDeformer {
            this._deformers.push(d);
            return d;
        }

        public addModel(m: FBXModel): FBXModel {
            this._models.push(m);
            return m;
        }

        public addConnections(c: FBXConnection): FBXConnection {
            this._connections.push(c);
            return c;
        }

        public getNode(id: uint): FBXNode {
            let node = this._objects.get(id);
            return node ? node : null;
        }

        public getConnectionChildren(id: uint): uint[] {
            let children = this._childrenMap.get(id);
            return children ? children : null;
        }

        public getConnectionParents(id: uint): uint[] {
            let parents = this._parentsMap.get(id);
            return parents ? parents : null;
        }

        public parse(): FBXParseResult {
            let result = new FBXParseResult();

            for (let i = 0, n = this._connections.length; i < n; ++i) {
                let c = this._connections[i];
                if (c.currentID !== 0) {
                    let children: uint[] = this._childrenMap.get(c.parentID);
                    if (children) {
                        children.push(c.currentID);
                    } else {
                        this._childrenMap.set(c.parentID, [c.currentID]);
                    }

                    let parents: uint[] = this._parentsMap.get(c.currentID);
                    if (parents) {
                        parents.push(c.parentID);
                    } else {
                        this._parentsMap.set(c.currentID, [c.parentID]);
                    }
                }
            }

            for (let i = 0, n = this._models.length; i < n; ++i) {
                let m = this._models[i];
                this._objects.set(m.id, m);
            }

            for (let i = 0, n = this._deformers.length; i < n; ++i) {
                let d = this._deformers[i];
                this._objects.set(d.id, d);
            }

            for (let i = 0, n = this._geometries.length; i < n; ++i) {
                let g = this._geometries[i];
                this._objects.set(g.id, g);
            }

            let meshes: FBXModel[] = null;
            let skeleton: FBXSkeleton = null;

            for (let i = 0, n = this._models.length; i < n; ++i) {
                let m = this._models[i];

                switch (m.attribType) {
                    case FBXNodeAttribType.MESH: {
                        if (meshes) {
                            meshes.push(m);
                        } else {
                            meshes = [m];
                        }

                        break;
                    }
                    case FBXNodeAttribType.LIMB_NODE: {
                        let bone = new Node3D();
                        bone.name = m.attribName;
                        if (!skeleton) skeleton = new FBXSkeleton();
                        skeleton.addBone(bone, m.id);

                        break;
                    }
                    default:
                        break;
                }
            }

            if (skeleton) {
                skeleton.finish(this);

                let ske = new Skeleton();
                ske.bones = skeleton.bones;
                ske.rootBoneIndices = skeleton.rootBoneIndices;
                result.skeleton = ske;
            }

            if (meshes) {
                for (let i = 0, n = meshes.length; i < n; ++i) {
                    let m = meshes[i];
                    let g = this.findChild(m.id, FBXGeometry);
                    if (g) {
                        let asset = g.createMeshAsset(this, skeleton);
                        if (asset) {
                            asset.name = m.attribName;

                            if (!result.meshes) result.meshes = [];
                            result.meshes.push(asset);
                        }
                    }
                }
            }

            return result;
        }

        public findChild<T extends FBXNode>(id: uint, c: new() => T, attribType: string = null): T {
            let children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    let o = this._objects.get(children[i]);
                    if (o && o instanceof c && (!attribType || attribType === o.attribType)) return <T>o;
                }
            }
            return null;
        }

        public findChildren<T extends FBXNode>(id: uint, c: new () => T, attribType: string = null): T[] {
            let arr: T[] = null;
            let children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    let o = this._objects.get(children[i]);
                    if (o && o instanceof c && (!attribType || attribType === o.attribType)) {
                        if (!arr) {
                            arr = [o];
                        } else {
                            arr.push(o);
                        }
                    }
                }
            }
            return arr;
        }

        public findParent<T extends FBXNode>(id: uint, c: new () => T): T {
            let parents = this._parentsMap.get(id);
            if (parents) {
                for (let i = 0, n = parents.length; i < n; ++i) {
                    let o = this._objects.get(parents[i]);
                    if (o && o instanceof c) return <T>o;
                }
            }
            return null;
        }
    }
}