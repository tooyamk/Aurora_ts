namespace Aurora.FBX {
    export class Collections {
        private _geometries: Geometry[] = [];
        private _deformers: Deformer[] = [];
        private _models: Model[] = [];
        private _connections: Connection[] = [];

        private _objects: Map<uint, Node> = new Map();
        private _parentsMap: Map<uint, uint[]> = new Map();
        private _childrenMap: Map<uint, uint[]> = new Map();

        public addGeometry(g: Geometry): Geometry {
            this._geometries.push(g);
            return g;
        }

        public addDeformer(d: Deformer): Deformer {
            this._deformers.push(d);
            return d;
        }

        public addModel(m: Model): Model {
            this._models.push(m);
            return m;
        }

        public addConnections(c: Connection): Connection {
            this._connections.push(c);
            return c;
        }

        public getNode(id: uint): Node {
            const node = this._objects.get(id);
            return node ? node : null;
        }

        public getConnectionChildren(id: uint): uint[] {
            const children = this._childrenMap.get(id);
            return children ? children : null;
        }

        public getConnectionParents(id: uint): uint[] {
            const parents = this._parentsMap.get(id);
            return parents ? parents : null;
        }

        public parse(): ParseResult {
            const result = new ParseResult();

            for (let i = 0, n = this._connections.length; i < n; ++i) {
                const c = this._connections[i];
                if (c.currentID !== 0) {
                    const children: uint[] = this._childrenMap.get(c.parentID);
                    if (children) {
                        children.push(c.currentID);
                    } else {
                        this._childrenMap.set(c.parentID, [c.currentID]);
                    }

                    const parents: uint[] = this._parentsMap.get(c.currentID);
                    if (parents) {
                        parents.push(c.parentID);
                    } else {
                        this._parentsMap.set(c.currentID, [c.parentID]);
                    }
                }
            }

            for (let i = 0, n = this._models.length; i < n; ++i) {
                const m = this._models[i];
                this._objects.set(m.id, m);
            }

            for (let i = 0, n = this._deformers.length; i < n; ++i) {
                const d = this._deformers[i];
                this._objects.set(d.id, d);
            }

            for (let i = 0, n = this._geometries.length; i < n; ++i) {
                const g = this._geometries[i];
                this._objects.set(g.id, g);
            }

            let meshes: Model[] = null;
            let skeleton: SkeletonData = null;

            for (let i = 0, n = this._models.length; i < n; ++i) {
                const m = this._models[i];

                switch (m.attribType) {
                    case NodeAttribType.MESH: {
                        if (meshes) {
                            meshes.push(m);
                        } else {
                            meshes = [m];
                        }

                        break;
                    }
                    case NodeAttribType.LIMB_NODE: {
                        const bone = new Aurora.Node();
                        bone.name = m.attribName;
                        if (!skeleton) skeleton = new SkeletonData();
                        skeleton.addBone(bone, m.id);

                        break;
                    }
                    default:
                        break;
                }
            }

            if (skeleton) {
                skeleton.finish(this);

                const ske = new Skeleton();
                ske.bones = skeleton.bones;
                ske.rootBoneIndices = skeleton.rootBoneIndices;
                result.skeleton = ske;
            }

            if (meshes) {
                for (let i = 0, n = meshes.length; i < n; ++i) {
                    const m = meshes[i];
                    const g = this.findChild(m.id, Geometry);
                    if (g) {
                        const asset = g.createMeshAsset(this, skeleton);
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

        public findChild<T extends Node>(id: uint, c: new() => T, attribType: string = null): T {
            const children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const o = this._objects.get(children[i]);
                    if (o && o instanceof c && (!attribType || attribType === o.attribType)) return <T>o;
                }
            }
            return null;
        }

        public findChildren<T extends Node>(id: uint, c: new () => T, attribType: string = null): T[] {
            let arr: T[] = null;
            const children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const o = this._objects.get(children[i]);
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

        public findParent<T extends Node>(id: uint, c: new () => T): T {
            const parents = this._parentsMap.get(id);
            if (parents) {
                for (let i = 0, n = parents.length; i < n; ++i) {
                    const o = this._objects.get(parents[i]);
                    if (o && o instanceof c) return <T>o;
                }
            }
            return null;
        }
    }
}