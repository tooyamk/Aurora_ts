namespace Aurora.FBX {
    export class ParseResult {
        public meshes: MeshAsset[] = null;
        public skeleton: Skeleton = null;
    }

    class SkeletonData {
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
                const m = collections.findConnectionParent(this._boneIDs[i], NodeName.MODEL);
                if (m) {
                    this.bones[this._bonesByID.get(m.id)].addChild(bone);
                } else {
                    this.rootBoneIndices.push(i);
                }
            }
        }
    }

    export class Collections {
        private _animationStacks: Node[] = null;
        private _deformers: Node[] = [];
        private _geometries: Node[] = null;
        private _models: Node[] = [];

        private _objects: Map<uint, Node> = new Map();
        private _parentsMap: Map<uint, uint[]> = new Map();
        private _childrenMap: Map<uint, uint[]> = new Map();

        public addNode(node: Node): void {
            switch (node.name) {
                case NodeName.ANIMATION_STACK: {
                    this._objects.set(node.id, node);
                    (this._animationStacks || (this._animationStacks = [])).push(node);

                    break;
                }
                case NodeName.GEOMETRY: {
                    this._objects.set(node.id, node);
                    (this._geometries || (this._geometries = [])).push(node);

                    break;
                }
                case NodeName.DEFORMER: {
                    this._objects.set(node.id, node);
                    this._deformers.push(node);

                    break;
                }
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

                            const children: uint[] = this._childrenMap.get(parentID);
                            if (children) {
                                children.push(curID);
                            } else {
                                this._childrenMap.set(parentID, [curID]);
                            }

                            const parents: uint[] = this._parentsMap.get(curID);
                            if (parents) {
                                parents.push(parentID);
                            } else {
                                this._parentsMap.set(curID, [parentID]);
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

            if (this._animationStacks) {
                for (let i = 0, n = this._animationStacks.length; i < n; ++i) {
                    const a = this._animationStacks[i];
                    let b = 1;
                }
            }

            let meshes: Node[] = null;
            let skeleton: SkeletonData = null;

            for (let i = 0, n = this._models.length; i < n; ++i) {
                const m = this._models[i];

                switch (m.attribType) {
                    case NodeAttribType.MESH:
                        (meshes || (meshes = [])).push(m);
                        break;
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
                    const g = this.findConnectionChild(m.id, NodeName.GEOMETRY);
                    if (g) {
                        const asset = this._createMeshAsset(g, skeleton);
                        if (asset) {
                            asset.name = m.attribName;
                            (result.meshes || (result.meshes = [])).push(asset);
                        }
                    }
                }
            }

            return result;
        }

        public findConnectionChild(id: uint, name: NodeName, attribType: string = null): Node {
            const children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const o = this._objects.get(children[i]);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) return o;
                }
            }
            return null;
        }

        public findConnectionChildren(id: uint, name: NodeName, attribType: string = null): Node[] {
            let arr: Node[] = null;
            const children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const o = this._objects.get(children[i]);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) (arr || (arr = [])).push(o);
                }
            }
            return arr;
        }

        public findConnectionParent(id: uint, name: NodeName): Node {
            const parents = this._parentsMap.get(id);
            if (parents) {
                for (let i = 0, n = parents.length; i < n; ++i) {
                    const o = this._objects.get(parents[i]);
                    if (o && o.name === name) return o;
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
                        values[4], values[6], values[5], values[7],
                        values[8], values[10], values[9], values[11],
                        values[12], values[14], values[13], values[15]
                    );
                }
            }
            return null;
        }

        private _createMeshAsset(geometry: Node, skeleton: SkeletonData): MeshAsset {
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
            const skins = this.findConnectionChildren(geometry.id, NodeName.DEFORMER, NodeAttribType.SKIN);
            if (skins) {
                const skinData: number[][] = [];
                skinData.length = numSourceVertices;
                for (let i = 0, n = skins.length; i < n; ++i) {
                    const clusters = this.findConnectionChildren(skins[i].id, NodeName.DEFORMER, NodeAttribType.CLUSTER);
                    if (clusters) {
                        for (let j = 0, m = clusters.length; j < m; ++j) this._parseCluster(asset, clusters[j], skeleton, skinData);
                    }
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
                const boneNode = this.getNode(links[0]);
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
                            const n = skeleton.bones.length;
                            asset.bindMatrices.length = n;
                            for (let i = 0; i < n; ++i) asset.bindMatrices[i] = new Matrix44();
                        }

                        for (let i = 0, n = indices.length; i < n; ++i) {
                            const idx = indices[i];
                            let arr = skinData[idx];
                            if (!arr) {
                                arr = [];
                                skinData[idx] = arr;
                            }
                            arr.push(boneIdx, weights[i]);
                        }

                        transLinkMat.invert(asset.bindMatrices[boneIdx]).append44(transMat);
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