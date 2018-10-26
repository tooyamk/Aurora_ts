///<reference path="Node.ts"/>

namespace Aurora.FBX {
    export class Geometry extends Node {
        public createMeshAsset(collections: Collections, skeleton: SkeletonData): MeshAsset {
            const sourceIndices: uint[] = [];
            const faces: uint[] = [];
            let needTriangulate = false;
            const child = this.getChildByName(NodeName.POLYGON_VERTEX_INDEX);
            if (child) needTriangulate = this._parsePolygonVertexIndex(child, sourceIndices, faces);

            if (sourceIndices.length > 0) {
                const asset = new MeshAsset();
                let vertIdxMapping: uint[] = null;
                let numSourceVertices = 0;

                for (let i = 0, n = this.children.length; i < n; ++i) {
                    const child = this.children[i];
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

                this._parseSkin(asset, collections, skeleton, vertIdxMapping, numSourceVertices);

                if (needTriangulate) asset.drawIndexSource.triangulate(faces);
                asset.drawIndexSource.invert();
                return asset;
            }
            return null;
        }

        private _parseSkin(asset: MeshAsset, collections: Collections, skeleton: SkeletonData, vertIdxMapping: uint[], numSourceVertices: uint): void {
            const skins = collections.findChildren(this._id, Deformer, NodeAttribType.SKIN);
            if (skins) {
                const skinData: number[][] = [];
                skinData.length = numSourceVertices;
                for (let i = 0, n = skins.length; i < n; ++i) {
                    const clusters = collections.findChildren(skins[i].id, Deformer, NodeAttribType.CLUSTER);
                    if (clusters) {
                        for (let j = 0, m = clusters.length; j < m; ++j) this._parseCluster(asset, collections, clusters[j], skeleton, skinData);
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
                    if (data) {
                        let nn = data.length >> 1;
                        if (nn > 4) nn = 4;
                        let j = 0;
                        for (; j < nn; ++j) {
                            const idx1 = idx + j;
                            let idx2 = j << 1;
                            boneIndices[idx1] = data[idx2++];
                            boneWeights[idx1] = data[idx2];
                        }
                        for (; j < 4; ++j) {
                            const idx1 = idx + j;
                            boneIndices[idx1] = 0;
                            boneWeights[idx1] = 0;
                        }
                    } else {
                        boneIndices[idx] = 0;
                        boneIndices[idx + 1] = 0;
                        boneIndices[idx + 2] = 0;
                        boneIndices[idx + 3] = 0;

                        boneWeights[idx] = 0;
                        boneWeights[idx + 1] = 0;
                        boneWeights[idx + 2] = 0;
                        boneWeights[idx + 3] = 0;
                    }
                }

                asset.addVertexSource(new VertexSource(ShaderPredefined.a_BoneIndex0, boneIndices, GLVertexBufferSize.FOUR, GLVertexBufferDataType.UNSIGNED_SHORT, false, GLUsageType.STATIC_DRAW));
                asset.addVertexSource(new VertexSource(ShaderPredefined.a_BoneWeight0, boneWeights, GLVertexBufferSize.FOUR, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
            }
        }

        private _parseCluster(asset: MeshAsset, collections: Collections, cluster: Deformer, skeleton: SkeletonData, skinData: number[][]): void {
            const links = collections.getConnectionChildren(cluster.id);
            if (links) {
                const boneNode = collections.getNode(links[0]);
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

        private _getPropertyMatrix(node: Node): Matrix44 {
            if (node.properties.length > 0) {
                const p = node.properties[0];
                if (p.type === NodePropertyValueType.NUMBER_ARRAY) {
                    const values = <number[]>p.value;
                    const m = new Matrix44();
                    m.m00 = values[0];
                    m.m01 = values[2];
                    m.m02 = values[1];
                    m.m03 = values[3];

                    m.m10 = values[4];
                    m.m11 = values[6];
                    m.m12 = values[5];
                    m.m13 = values[7];

                    m.m20 = values[8];
                    m.m21 = values[10];
                    m.m22 = values[9];
                    m.m23 = values[11];

                    m.m30 = values[12];
                    m.m31 = values[14];
                    m.m32 = values[13];
                    m.m33 = values[15];
                    return m;
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

        private _parseNormals(node: Node, sourceIndices: uint[], asset: MeshAsset): void {
            let values: number[] = null;
            let refType: string = null;
            let mappingType: string = null;
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
            let values: number[] = null;
            let indices: uint[] = null;
            let refType: string = null;
            let mappingType: string = null;
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

                    let numIdx = 0;
                    let numFaces = 0;
                    let start = 0;
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