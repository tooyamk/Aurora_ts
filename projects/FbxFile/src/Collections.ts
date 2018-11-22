namespace Aurora.FbxFile {
    export class Data {
        public meshes: MeshAsset[] = null;
        public skeleton: Skeleton = null;
        public animationClips: SkeletonAnimationClip[] = null;
    }

    class SkeletonData {
        public bones: Aurora.Node[] = [];
        public rootBoneIndices: uint[] = [];

        private _numBones = 0;
        private _bonesByName = new Map<string, uint>();
        private _bonesByID = new Map<uint, uint>();

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
                const m = collections.findConnectionParent(this._boneIDs[i], NodeName.MODEL);
                if (m) {
                    this.bones[this._bonesByID.get(m.id)].addChild(bone);
                } else {
                    this.rootBoneIndices.push(i);
                }
            }
        }
    }

    class Connection {
        public readonly id: uint;
        public readonly relationship: string;

        constructor(id: uint, relationship: string) {
            this.id = id;
            this.relationship = relationship === undefined ? null : relationship;
        }
    }

    export class Collections {
        private _animationStacks: Node[] = null;
        private _models: Node[] = [];

        private _objects = new Map<uint, Node>();
        private _parentsMap = new Map<uint, Connection[]>();
        private _childrenMap = new Map<uint, Connection[]>();

        public addNode(node: Node): void {
            switch (node.name) {
                case NodeName.ANIMATION_STACK: {
                    this._objects.set(node.id, node);
                    (this._animationStacks || (this._animationStacks = [])).push(node);

                    break;
                }
                case NodeName.ANIMATION_LAYER:
                case NodeName.ANIMATION_CURVE_NODE:
                case NodeName.ANIMATION_CURVE:
                case NodeName.GEOMETRY:
                case NodeName.DEFORMER: 
                    this._objects.set(node.id, node);
                    break;
                case NodeName.MODEL: {
                    this._objects.set(node.id, node);
                    this._models.push(node);
                    
                    break;
                }
                case NodeName.C:
                case NodeName.CONNECTIONS: {
                    const properties = node.properties;
                    if (properties && properties.length > 2) {
                        const curID = <int>properties[1].value;
                        if (curID !== 0) {
                            const parentID = <int>properties[2].value;

                            let relationship: string = null;
                            if (properties.length > 3) {
                                const p = properties[3];
                                if (p.type === NodePropertyValueType.STRING) relationship = <string>p.value;
                            }

                            let c = new Connection(curID, relationship);
                            const children: Connection[] = this._childrenMap.get(parentID);
                            if (children) {
                                children.push(c);
                            } else {
                                this._childrenMap.set(parentID, [c]);
                            }

                            c = new Connection(parentID, relationship);
                            const parents: Connection[] = this._parentsMap.get(curID);
                            if (parents) {
                                parents.push(c);
                            } else {
                                this._parentsMap.set(curID, [c]);
                            }
                        }
                    }
                    
                    break;
                }
                default:
                    break;
            }
        }

        public getNode(id: uint): Node {
            const node = this._objects.get(id);
            return node ? node : null;
        }

        public getConnectionChildren(id: uint): Connection[] {
            const children = this._childrenMap.get(id);
            return children ? children : null;
        }

        public getConnectionParents(id: uint): Connection[] {
            const parents = this._parentsMap.get(id);
            return parents ? parents : null;
        }

        public parse(): Data {
            const result = new Data();

            let meshes: Node[] = null;
            let skeleton: SkeletonData = null;

            for (let i = 0, n = this._models.length; i < n; ++i) {
                const m = this._models[i];

                switch (m.attribType) {
                    case NodeAttribType.MESH:
                        (meshes || (meshes = [])).push(m);
                        break;
                    case NodeAttribType.LIMB_NODE:
                    case NodeAttribType.ROOT: {
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

                result.animationClips = this._parseAnimations(skeleton);
            }

            if (meshes) {
                for (let i = 0, n = meshes.length; i < n; ++i) {
                    const m = meshes[i];
                    const g = this.findConnectionChildNode(m.id, NodeName.GEOMETRY);
                    if (g) {
                        const asset = this._parseGeometry(g, skeleton);
                        if (asset) {
                            asset.name = m.attribName;
                            (result.meshes || (result.meshes = [])).push(asset);
                        }
                    }
                }
            }

            return result;
        }

        public findConnectionChild(id: uint, name: NodeName, attribType: string = null): Connection {
            const children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const c = children[i];
                    const o = this._objects.get(c.id);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) return c;
                }
            }
            return null;
        }

        public findConnectionChildNode(id: uint, name: NodeName, attribType: string = null): Node {
            const children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const o = this._objects.get(children[i].id);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) return o;
                }
            }
            return null;
        }

        public findConnectionChildren(id: uint, name: NodeName, attribType: string = null): Connection[] {
            let arr: Connection[] = null;
            const children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const c = children[i];
                    const o = this._objects.get(c.id);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) (arr || (arr = [])).push(c);
                }
            }
            return arr;
        }

        public findConnectionChildrenNodes(id: uint, name: NodeName, attribType: string = null): Node[] {
            let arr: Node[] = null;
            const children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const o = this._objects.get(children[i].id);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) (arr || (arr = [])).push(o);
                }
            }
            return arr;
        }

        public findConnectionParent(id: uint, name: NodeName, attribType: string = null): Connection {
            const parents = this._parentsMap.get(id);
            if (parents) {
                for (let i = 0, n = parents.length; i < n; ++i) {
                    const c = parents[i];
                    const o = this._objects.get(c.id);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) return c;
                }
            }
            return null;
        }

        public findConnectionParentNode(id: uint, name: NodeName, attribType: string = null): Node {
            const parents = this._parentsMap.get(id);
            if (parents) {
                for (let i = 0, n = parents.length; i < n; ++i) {
                    const o = this._objects.get(parents[i].id);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) return o;
                }
            }
            return null;
        }

        private _getPropertyValue<T>(node: Node, type: NodePropertyValueType): T {
            if (node.properties.length > 0) {
                const p = node.properties[0];
                if (p.type === type) return <T><any>p.value;
            }
            return null;
        }

        private _getPropertyMatrix(node: Node): Matrix44 {
            if (node.properties.length > 0) {
                const p = node.properties[0];
                if (p.type === NodePropertyValueType.NUMBER_ARRAY) {
                    const values = <number[]>p.value;
                    return new Matrix44(
                        values[0], values[2], values[1], values[3],
                        values[8], values[10], values[9], values[11],
                        values[4], values[6], values[5], values[7],
                        values[12], values[14], values[13], values[15]
                    );
                }
            }
            return null;
        }

        private _getOrCreateBoneData(map: Map<number, SkeletonAnimationClip.Frame>, time: number, boneIdx: uint): SkeletonAnimationClip.BoneData {
            let frame = map.get(time);
            if (!frame) {
                frame = new SkeletonAnimationClip.Frame();
                frame.time = time;
                frame.data = [];
                map.set(time, frame);
            }
            let bd = frame.data[boneIdx];
            if (!bd) {
                bd = new SkeletonAnimationClip.BoneData();
                frame.data[boneIdx] = bd;
            }
            return bd;
        }

        private _parseAnimations(skeleton: SkeletonData): SkeletonAnimationClip[]  {
            let clips: SkeletonAnimationClip[] = null;

            if (this._animationStacks) {
                const framesMap = new Map<number, SkeletonAnimationClip.Frame>();
                const rots: Quaternion[] = [];
                let numRots: uint = 0;

                for (let i0 = 0, n0 = this._animationStacks.length; i0 < n0; ++i0) {
                    const stack = this._animationStacks[i0];

                    const clip = new SkeletonAnimationClip();
                    const frames: SkeletonAnimationClip.Frame[] = [];
                    clip.name = stack.attribName;
                    (clips || (clips = [])).push(clip);

                    const layers = this.findConnectionChildrenNodes(stack.id, NodeName.ANIMATION_LAYER);
                    if (!layers) continue;

                    for (let i1 = 0, n1 = layers.length; i1 < n1; ++i1) {
                        const layer = layers[i1];
                        const curveNodes = this.findConnectionChildrenNodes(layer.id, NodeName.ANIMATION_CURVE_NODE);
                        if (!curveNodes) continue;

                        for (let i2 = 0, n2 = curveNodes.length; i2 < n2; ++i2) {
                            const curveNode = curveNodes[i2];
                            const attribName = curveNode.attribName;//R,T,S,DeformPercent?
                            const bone = this.findConnectionParentNode(curveNode.id, NodeName.MODEL, NodeAttribType.LIMB_NODE);
                            if (!bone) continue;
                            
                            const curves = this.findConnectionChildren(curveNode.id, NodeName.ANIMATION_CURVE);
                            if (!curves) continue;

                            for (let i3 = 0, n3 = curves.length; i3 < n3; ++i3) {
                                const c = curves[i3];
                                const curve = this._objects.get(c.id);

                                const relationship = c.relationship;
                                if (!relationship) continue;

                                let times: number[] = null;
                                let values: number[] = null;
                                for (let i = 0, n = curve.children.length; i < n; ++i) {
                                    const child = curve.children[i];
                                    switch (child.name) {
                                        case NodeName.KEY_TIME:
                                            times = this._getPropertyValue<uint[]>(child, NodePropertyValueType.INT_ARRAY);
                                            break;
                                        case NodeName.KEY_VALUE_FLOAT:
                                            values = this._getPropertyValue<number[]>(child, NodePropertyValueType.NUMBER_ARRAY);
                                            break;
                                        default:
                                            break;
                                    }
                                }

                                if (times && values) {
                                    times = times.concat();
                                    for (let j = 0, m = times.length; j < m; ++j) times[j] /= 46186158000;

                                    const boneIdx = skeleton.getIndexByName(bone.attribName);
                                    if (boneIdx >= 0) {
                                        switch (attribName) {
                                            case NodeAttribType.T: {
                                                switch (relationship) {
                                                    case NodePropertyType.D_X: {
                                                        for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                            const bd = this._getOrCreateBoneData(framesMap, times[k], boneIdx);
                                                            if (!bd.translation) bd.translation = Vector3.Zero;
                                                            bd.translation.x = values[k];
                                                        }

                                                        break;
                                                    }
                                                    case NodePropertyType.D_Y: {
                                                        for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                            const bd = this._getOrCreateBoneData(framesMap, times[k], boneIdx);
                                                            if (!bd.translation) bd.translation = Vector3.Zero;
                                                            bd.translation.z = values[k];
                                                        }

                                                        break;
                                                    }
                                                    case NodePropertyType.D_Z: {
                                                        for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                            const bd = this._getOrCreateBoneData(framesMap, times[k], boneIdx);
                                                            if (!bd.translation) bd.translation = Vector3.Zero;
                                                            bd.translation.y = values[k];
                                                        }

                                                        break;
                                                    }
                                                    default:
                                                        break;
                                                }

                                                break;
                                            }
                                            case NodeAttribType.R: {
                                                switch (relationship) {
                                                    case NodePropertyType.D_X: {
                                                        for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                            const bd = this._getOrCreateBoneData(framesMap, times[k], boneIdx);
                                                            if (!bd.rotation) {
                                                                const q = new Quaternion();
                                                                bd.rotation = q;
                                                                rots[numRots++] = q;
                                                            }
                                                            bd.rotation.x = values[k] * MathUtils.DEG_2_RAD;
                                                        }

                                                        break;
                                                    }
                                                    case NodePropertyType.D_Y: {
                                                        for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                            const bd = this._getOrCreateBoneData(framesMap, times[k], boneIdx);
                                                            if (!bd.rotation) {
                                                                const q = new Quaternion();
                                                                bd.rotation = q;
                                                                rots[numRots++] = q;
                                                            }
                                                            bd.rotation.z = values[k] * MathUtils.DEG_2_RAD;
                                                        }

                                                        break;
                                                    }
                                                    case NodePropertyType.D_Z: {
                                                        for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                            const bd = this._getOrCreateBoneData(framesMap, times[k], boneIdx);
                                                            if (!bd.rotation) {
                                                                const q = new Quaternion();
                                                                bd.rotation = q;
                                                                rots[numRots++] = q;
                                                            }
                                                            bd.rotation.y = values[k] * MathUtils.DEG_2_RAD;
                                                        }

                                                        break;
                                                    }
                                                    default:
                                                        break;
                                                }

                                                break;
                                            }
                                            case NodeAttribType.S: {
                                                switch (relationship) {
                                                    case NodePropertyType.D_X: {
                                                        for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                            const bd = this._getOrCreateBoneData(framesMap, times[k], boneIdx);
                                                            if (!bd.scale) bd.scale = Vector3.One;
                                                            bd.scale.x = values[k];
                                                        }

                                                        break;
                                                    }
                                                    case NodePropertyType.D_Y: {
                                                        for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                            const bd = this._getOrCreateBoneData(framesMap, times[k], boneIdx);
                                                            if (!bd.scale) bd.scale = Vector3.One;
                                                            bd.scale.z = values[k];
                                                        }

                                                        break;
                                                    }
                                                    case NodePropertyType.D_Z: {
                                                        for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                            const bd = this._getOrCreateBoneData(framesMap, times[k], boneIdx);
                                                            if (!bd.scale) bd.scale = Vector3.One;
                                                            bd.scale.y = values[k];
                                                        }

                                                        break;
                                                    }
                                                    default:
                                                        break;
                                                }

                                                break;
                                            }
                                            default:
                                                break;
                                        }
                                    }
                                    //console.log(bone.attribName + "    " + attribName + "    " + relationship);
                                    //console.log(values);
                                }
                            }
                        }
                    }

                    for (let kv of framesMap) frames.push(kv[1]);
                    for (let i = 0, q: Quaternion; q = rots[i++];) Quaternion.createFromEulerXYZ(q.x, q.y, q.z, q);
                    framesMap.clear();
                    rots.length = 0;
                    Sort.Merge.sort(frames, (f0: SkeletonAnimationClip.Frame, f1: SkeletonAnimationClip.Frame) => {
                        return f0.time < f1.time;
                    });

                    clip.frames = frames;
                }
            }

            return clips;
        }

        private _parseGeometry(geometry: Node, skeleton: SkeletonData): MeshAsset {
            const sourceIndices: uint[] = [], faces: uint[] = [];
            let needTriangulate = false;
            const child = geometry.getChildByName(NodeName.POLYGON_VERTEX_INDEX);
            if (child) needTriangulate = this._parsePolygonVertexIndex(child, sourceIndices, faces);

            if (sourceIndices.length > 0) {
                const asset = new MeshAsset();
                let vertIdxMapping: uint[] = null;
                let numSourceVertices = 0;

                for (let i = 0, n = geometry.children.length; i < n; ++i) {
                    const child = geometry.children[i];
                    switch (child.name) {
                        case NodeName.VERTICES: {
                            const rst = this._parseVertices(child, sourceIndices, asset);
                            if (rst) {
                                vertIdxMapping = rst[0];
                                numSourceVertices = rst[1];
                            }

                            break;
                        }
                        case NodeName.LAYER_ELEMENT_NORMAL:
                            this._parseNormals(child, sourceIndices, asset);
                            break;
                        case NodeName.LAYER_ELEMENT_UV:
                            this._parseUVs(child, sourceIndices, asset);
                            break;
                        default:
                            break;
                    }
                }

                this._parseSkin(geometry, asset, skeleton, vertIdxMapping, numSourceVertices);

                if (needTriangulate) asset.drawIndexSource.triangulate(faces);
                asset.drawIndexSource.invert();
                return asset;
            }
            return null;
        }

        private _parseSkin(geometry: Node, asset: MeshAsset, skeleton: SkeletonData, vertIdxMapping: uint[], numSourceVertices: uint): void {
            const skins = this.findConnectionChildrenNodes(geometry.id, NodeName.DEFORMER, NodeAttribType.SKIN);
            if (skins) {
                const skinData: number[][] = [];
                skinData.length = numSourceVertices;
                for (let i = 0, n = skins.length; i < n; ++i) {
                    const clusters = this.findConnectionChildrenNodes(skins[i].id, NodeName.DEFORMER, NodeAttribType.CLUSTER);
                    if (!clusters) continue;
                    for (let j = 0, m = clusters.length; j < m; ++j) this._parseCluster(asset, clusters[j], skeleton, skinData);
                }

                const n = vertIdxMapping.length;
                const len = n << 2;
                const boneIndices: uint[] = [];
                boneIndices.length = len;
                const boneWeights: number[] = [];
                boneWeights.length = len;

                for (let i = 0; i < n; ++i) {
                    const idx = i << 2;
                    const data = skinData[vertIdxMapping[i]];
                    let j = 0;
                    if (data) {
                        let nn = data.length >> 1;
                        if (nn > 4) nn = 4;
                        for (; j < nn; ++j) {
                            const idx1 = idx + j;
                            let idx2 = j << 1;
                            boneIndices[idx1] = data[idx2++];
                            boneWeights[idx1] = data[idx2];
                        }
                    }

                    for (; j < 4; ++j) {
                        const idx1 = idx + j;
                        boneIndices[idx1] = 0;
                        boneWeights[idx1] = 0;
                    }
                }

                asset.addVertexSource(new VertexSource(ShaderPredefined.a_BoneIndex0, boneIndices, GLVertexBufferSize.FOUR, GLVertexBufferDataType.UNSIGNED_SHORT, false, GLUsageType.STATIC_DRAW));
                asset.addVertexSource(new VertexSource(ShaderPredefined.a_BoneWeight0, boneWeights, GLVertexBufferSize.FOUR, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
            }
        }

        private _parseCluster(asset: MeshAsset, cluster: Node, skeleton: SkeletonData, skinData: number[][]): void {
            const links = this.getConnectionChildren(cluster.id);
            if (links) {
                const boneNode = this._objects.get(links[0].id);
                if (boneNode) {
                    const boneIdx = skeleton.getIndexByName(boneNode.attribName);
                    if (boneIdx >= 0) {
                        let transMat: Matrix44 = null, transLinkMat: Matrix44 = null;
                        let indices: uint[] = null, weights: number[] = null;
                        for (let i = 0, n = cluster.children.length; i < n; ++i) {
                            const child = cluster.children[i];
                            switch (child.name) {
                                case NodeName.TRANSFORM:
                                    transMat = this._getPropertyMatrix(child);
                                    break;
                                case NodeName.TRANSFORM_LINK:
                                    transLinkMat = this._getPropertyMatrix(child);
                                    break;
                                case NodeName.INDEXES:
                                    indices = this._getPropertyValue(child, NodePropertyValueType.INT_ARRAY);
                                    break;
                                case NodeName.WEIGHTS:
                                    weights = this._getPropertyValue(child, NodePropertyValueType.NUMBER_ARRAY);
                                    break;
                                default:
                                    break;
                            }
                        }

                        if (!asset.bindMatrices) {
                            asset.bindMatrices = [];
                            asset.bindPostMatrices = [];
                            const n = skeleton.bones.length;
                            asset.bindMatrices.length = n;
                            asset.bindPostMatrices.length = n;
                            for (let i = 0; i < n; ++i) {
                                asset.bindMatrices[i] = new Matrix44();
                                asset.bindPostMatrices[i] = new Matrix44();
                            }
                        }

                        if (indices) {
                            for (let i = 0, n = indices.length; i < n; ++i) {
                                const idx = indices[i];
                                let arr = skinData[idx];
                                if (!arr) {
                                    arr = [];
                                    skinData[idx] = arr;
                                }
                                arr.push(boneIdx, weights[i]);
                            }
                        }

                        if (boneIdx === 1) {
                            let a = 1;
                        }

                        transMat.invert(asset.bindMatrices[boneIdx]);
                        transLinkMat.invert(asset.bindPostMatrices[boneIdx]).append44(transMat);
                        //asset.bindMatrices[boneIdx].set34(transMat);
                        //transLinkMat.invert(asset.bindPostMatrices[boneIdx]);
                        //transMat.append34(transLinkMat.invert(asset.bindMatrices[boneIdx]), asset.bindMatrices[boneIdx]);
                        //transMat.append44(transLinkMat, asset.bindMatrices[boneIdx]);
                        //transLinkMat.invert(asset.bindMatrices[boneIdx]).append44(transMat);
                    }
                }
            }
        }

        private _parseVertexSource(values: number[], indices: uint[], refType: string, mappingType: string, sourceIndices: uint[], numDataPerVertex: uint): number[] {
            if (values) {
                const n = sourceIndices.length;
                if (mappingType === NodePropertyType.BY_CONTROL_POINT) {
                    if (refType === NodePropertyType.DIRECT) {
                        const vertices: number[] = [];
                        vertices.length = n * numDataPerVertex;
                        let vertIdx = 0;
                        for (let i = 0; i < n; ++i) {
                            const idx = sourceIndices[i] * numDataPerVertex;
                            for (let j = 0; j < numDataPerVertex; ++j) vertices[vertIdx++] = values[idx + j];
                        }
                        return vertices;
                    } else if (refType === NodePropertyType.INDEX_TO_DIRECT) {
                        const vertices: number[] = [];
                        vertices.length = n * numDataPerVertex;
                        let vertIdx = 0;
                        for (let i = 0; i < n; ++i) {
                            const idx = indices[sourceIndices[i]] * numDataPerVertex;
                            for (let j = 0; j < numDataPerVertex; ++j) vertices[vertIdx++] = values[idx + j];
                        }
                        return vertices;
                    }
                } else if (mappingType === NodePropertyType.BY_POLYGON_VERTEX) {
                    if (refType === NodePropertyType.DIRECT) {
                        return values.concat();
                    } else if (refType === NodePropertyType.INDEX_TO_DIRECT) {
                        const vertices: number[] = [];
                        vertices.length = n * numDataPerVertex;
                        let vertIdx = 0;
                        for (let i = 0; i < n; ++i) {
                            const idx = indices[i] * numDataPerVertex;
                            for (let j = 0; j < numDataPerVertex; ++j) vertices[vertIdx++] = values[idx + j];
                        }
                        return vertices;
                    }
                }
            }
            return null;
        }

        private _parseVertices(node: Node, sourceIndices: number[], asset: MeshAsset): [uint[], uint] {
            if (node.properties && node.properties.length > 0) {
                const p = node.properties[0];
                if (p.type === NodePropertyValueType.NUMBER_ARRAY) {
                    const sourceVertices = <number[]>p.value;
                    const n = sourceIndices.length;

                    const indices: uint[] = [];
                    indices.length = n;

                    const vertices: number[] = [];
                    vertices.length = n * 3;

                    const vertIdxMapping: uint[] = [];
                    vertIdxMapping.length - n;

                    let vertIdx = 0;

                    for (let i = 0; i < n; ++i) {
                        const idx = sourceIndices[i] * 3;
                        vertices[vertIdx++] = sourceVertices[idx];
                        vertices[vertIdx++] = sourceVertices[idx + 2];
                        vertices[vertIdx++] = sourceVertices[idx + 1];

                        vertIdxMapping[i] = idx;
                        indices[i] = i;
                    }

                    asset.drawIndexSource = new DrawIndexSource(indices, GLIndexDataType.AUTO, GLUsageType.STATIC_DRAW);
                    asset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, vertices, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));

                    return [vertIdxMapping, (n / 3) | 0];
                }
            }

            return null;
        }

        private _parseNormals(node: Node, sourceIndices: uint[], asset: MeshAsset): void {
            let values: number[] = null, refType: string = null, mappingType: string = null;

            for (let i = 0, n = node.children.length; i < n; ++i) {
                const child = node.children[i];
                switch (child.name) {
                    case NodeName.NORMALS:
                        values = this._getPropertyValue<number[]>(child, NodePropertyValueType.NUMBER_ARRAY);
                        break;
                    case NodeName.REFERENCE_INFORMATION_TYPE:
                        refType = this._getPropertyValue<string>(child, NodePropertyValueType.STRING);
                        break;
                    case NodeName.MAPPING_INFORMATION_TYPE:
                        mappingType = this._getPropertyValue<string>(child, NodePropertyValueType.STRING);
                        break;
                    default:
                        break;
                }
            }

            const normals = this._parseVertexSource(values, null, refType, mappingType, sourceIndices, 3);
            if (normals) {
                for (let i = 1, n = normals.length; i < n; i += 3) {
                    const y = normals[i];
                    normals[i] = normals[i + 1];
                    normals[i + 1] = y;
                }
                asset.addVertexSource(new VertexSource(ShaderPredefined.a_Normal0, normals, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
            }
        }

        private _parseUVs(node: Node, sourceIndices: uint[], asset: MeshAsset): void {
            let values: number[] = null, indices: uint[] = null, refType: string = null, mappingType: string = null;

            for (let i = 0, n = node.children.length; i < n; ++i) {
                const child = node.children[i];
                switch (child.name) {
                    case NodeName.UV:
                        values = this._getPropertyValue<number[]>(child, NodePropertyValueType.NUMBER_ARRAY);
                        break;
                    case NodeName.UV_INDEX:
                        indices = this._getPropertyValue<uint[]>(child, NodePropertyValueType.INT_ARRAY);
                        break;
                    case NodeName.REFERENCE_INFORMATION_TYPE:
                        refType = this._getPropertyValue<string>(child, NodePropertyValueType.STRING);
                        break;
                    case NodeName.MAPPING_INFORMATION_TYPE:
                        mappingType = this._getPropertyValue<string>(child, NodePropertyValueType.STRING);
                        break;
                    default:
                        break;
                }
            }

            const uvs = this._parseVertexSource(values, indices, refType, mappingType, sourceIndices, 2);
            if (uvs) {
                for (let i = 1, n = uvs.length; i < n; i += 2) uvs[i] = 1 - uvs[i];
                asset.addVertexSource(new VertexSource(ShaderPredefined.a_UV0, uvs, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
            }
        }

        private _parsePolygonVertexIndex(node: Node, sourceIndices: uint[], faces: uint[]): boolean {
            let needTriangulate = false;

            if (node.properties && node.properties.length > 0) {
                const p = node.properties[0];
                if (p.type === NodePropertyValueType.INT_ARRAY) {
                    const src = <int[]>p.value;
                    const len = src.length;

                    let numIdx = 0, numFaces = 0, start = 0;
                    for (let i = 0; i < len; ++i) {
                        let idx = src[i];
                        if (idx < 0) {
                            idx = ~idx;
                            const n = i - start + 1;
                            if (n > 3) needTriangulate = true;
                            faces[numFaces++] = n;
                            start = i + 1;
                        }

                        sourceIndices[numIdx++] = idx;
                    }
                }
            }

            return needTriangulate;
        }
    }
}