///<reference path="FBXNode.ts"/>

namespace Aurora {
    export class FBXGeometry extends FBXNode {
        public createMeshAsset(collections: FBXCollections): MeshAsset {
            let sourceIndices: uint[] = [];
            let faces: uint[] = [];
            let needTriangulate = false;
            let child = this.getChildByName(FBXNodeName.POLYGON_VERTEX_INDEX);
            if (child) needTriangulate = this._parsePolygonVertexIndex(child, sourceIndices, faces);

            if (sourceIndices.length > 0) {
                let asset = new MeshAsset();

                for (let i = 0, n = this.children.length; i < n; ++i) {
                    let child = this.children[i];
                    switch (child.name) {
                        case FBXNodeName.VERTICES:
                            this._parseVertices(child, sourceIndices, asset);
                            break;
                        case FBXNodeName.LAYER_ELEMENT_NORMAL:
                            this._parseNormals(child, sourceIndices, asset);
                            break;
                        case FBXNodeName.LAYER_ELEMENT_UV:
                            this._parseUVs(child, sourceIndices, asset);
                            break;
                        default:
                            break;
                    }
                }

                this._parseSkin(asset, collections);

                if (needTriangulate) asset.drawIndexSource.triangulate(faces);
                asset.drawIndexSource.invert();
                return asset;
            }
            return null;
        }

        private _parseSkin(asset: MeshAsset, collections: FBXCollections): void {
            let skins = collections.findChildren(this._id, FBXDeformer, FBXNodeAttribType.SKIN);
            if (skins) {
                for (let i = 0, n = skins.length; i < n; ++i) {
                    let clusters = collections.findChildren(skins[i].id, FBXDeformer, FBXNodeAttribType.CLUSTER);
                    if (clusters) {
                        for (let j = 0, m = clusters.length; j < m; ++j) this._parseCluster(asset, collections, clusters[j]);
                    }
                }
            }
        }

        private _parseCluster(asset: MeshAsset, collections: FBXCollections, cluster: FBXDeformer): void {
            for (let i = 0, n = cluster.children.length; i < n; ++i) {
                let child = cluster.children[i];
                let children = collections.getConnectionParents(child.id);
                switch (child.name) {
                    case FBXNodeName.TRANSFORM_LINK:
                        break;
                    default:
                        console.log(child.name);
                        break;
                }
            }
        }

        private _parseVertices(node: FBXNode, sourceIndices: number[], asset: MeshAsset): void {
            if (node.properties && node.properties.length > 0) {
                let p = node.properties[0];
                if (p.type === FBXNodePropertyValueType.NUMBER_ARRAY) {
                    let sourceVertices = <number[]>p.value;
                    let n = sourceIndices.length;

                    let indices: uint[] = [];
                    indices.length = n;

                    let vertices: number[] = [];
                    vertices.length = n * 3;

                    let vertIdx = 0;

                    for (let i = 0; i < n; ++i) {
                        let idx = sourceIndices[i] * 3;
                        vertices[vertIdx++]= sourceVertices[idx];
                        vertices[vertIdx++] = sourceVertices[idx + 2];
                        vertices[vertIdx++] = sourceVertices[idx + 1];

                        indices[i] = i;
                    }

                    asset.drawIndexSource = new DrawIndexSource(indices, GLIndexDataType.AUTO, GLUsageType.STATIC_DRAW);
                    asset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, vertices, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
                }
            }
        }

        private _getPropertyValue<T>(node: FBXNode, type: FBXNodePropertyValueType): T {
            if (node.properties.length > 0) {
                let p = node.properties[0];
                if (p.type === type) return <T><any>p.value;
            }
            return null;
        }

        private _parseVertexSource(values: number[], indices: uint[], refType: string, mappingType: string, sourceIndices: uint[], numDataPerVertex: uint): number[] {
            if (values) {
                let n = sourceIndices.length;
                if (mappingType === FBXNodePropertyType.BY_CONTROL_POINT) {
                    if (refType === FBXNodePropertyType.DIRECT) {
                        let vertices: number[] = [];
                        vertices.length = n * numDataPerVertex;
                        let vertIdx = 0;
                        for (let i = 0; i < n; ++i) {
                            let idx = sourceIndices[i] * numDataPerVertex;
                            for (let j = 0; j < numDataPerVertex; ++j) vertices[vertIdx++] = values[idx + j];
                        }
                        return vertices;
                    } else if (refType === FBXNodePropertyType.INDEX_TO_DIRECT) {
                        let vertices: number[] = [];
                        vertices.length = n * numDataPerVertex;
                        let vertIdx = 0;
                        for (let i = 0; i < n; ++i) {
                            let idx = indices[sourceIndices[i]] * numDataPerVertex;
                            for (let j = 0; j < numDataPerVertex; ++j) vertices[vertIdx++] = values[idx + j];
                        }
                        return vertices;
                    }
                } else if (mappingType === FBXNodePropertyType.BY_POLYGON_VERTEX) {
                    if (refType === FBXNodePropertyType.DIRECT) {
                        return values.concat();
                    } else if (refType === FBXNodePropertyType.INDEX_TO_DIRECT) {
                        let vertices: number[] = [];
                        vertices.length = n * numDataPerVertex;
                        let vertIdx = 0;
                        for (let i = 0; i < n; ++i) {
                            let idx = indices[i] * numDataPerVertex;
                            for (let j = 0; j < numDataPerVertex; ++j) vertices[vertIdx++] = values[idx + j];
                        }
                        return vertices;
                    }
                }
            }
            return null;
        }

        private _parseNormals(node: FBXNode, sourceIndices: uint[], asset: MeshAsset): void {
            let values: number[] = null;
            let refType: string = null;
            let mappingType: string = null;
            for (let i = 0, n = node.children.length; i < n; ++i) {
                let child = node.children[i];
                switch (child.name) {
                    case FBXNodeName.NORMALS:
                        values = this._getPropertyValue<number[]>(child, FBXNodePropertyValueType.NUMBER_ARRAY);
                        break;
                    case FBXNodeName.REFERENCE_INFORMATION_TYPE:
                        refType = this._getPropertyValue<string>(child, FBXNodePropertyValueType.STRING);
                        break;
                    case FBXNodeName.MAPPING_INFORMATION_TYPE:
                        mappingType = this._getPropertyValue<string>(child, FBXNodePropertyValueType.STRING);
                        break;
                    default:
                        break;
                }
            }

            let normals = this._parseVertexSource(values, null, refType, mappingType, sourceIndices, 3);
            if (normals) {
                for (let i = 1, n = normals.length; i < n; i += 3) {
                    let y = normals[i];
                    normals[i] = normals[i + 1];
                    normals[i + 1] = y;
                }
                asset.addVertexSource(new VertexSource(ShaderPredefined.a_Normal0, normals, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
            }
        }

        private _parseUVs(node: FBXNode, sourceIndices: uint[], asset: MeshAsset): void {
            let values: number[] = null;
            let indices: uint[] = null;
            let refType: string = null;
            let mappingType: string = null;
            for (let i = 0, n = node.children.length; i < n; ++i) {
                let child = node.children[i];
                switch (child.name) {
                    case FBXNodeName.UV:
                        values = this._getPropertyValue<number[]>(child, FBXNodePropertyValueType.NUMBER_ARRAY);
                        break;
                    case FBXNodeName.UV_INDEX:
                        indices = this._getPropertyValue<uint[]>(child, FBXNodePropertyValueType.INT_ARRAY);
                        break;
                    case FBXNodeName.REFERENCE_INFORMATION_TYPE:
                        refType = this._getPropertyValue<string>(child, FBXNodePropertyValueType.STRING);
                        break;
                    case FBXNodeName.MAPPING_INFORMATION_TYPE:
                        mappingType = this._getPropertyValue<string>(child, FBXNodePropertyValueType.STRING);
                        break;
                    default:
                        break;
                }
            }

            let uvs = this._parseVertexSource(values, indices, refType, mappingType, sourceIndices, 2);
            if (uvs) {
                for (let i = 1, n = uvs.length; i < n; i += 2) uvs[i] = 1 - uvs[i];
                asset.addVertexSource(new VertexSource(ShaderPredefined.a_TexCoord0, uvs, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
            }
        }

        private _parsePolygonVertexIndex(node: FBXNode, sourceIndices: uint[], faces: uint[]): boolean {
            let needTriangulate = false;

            if (node.properties && node.properties.length > 0) {
                let p = node.properties[0];
                if (p.type === FBXNodePropertyValueType.INT_ARRAY) {
                    let src = <int[]>p.value;
                    let len = src.length;

                    let numIdx = 0;
                    let numFaces = 0;
                    let start = 0;
                    for (let i = 0; i < len; ++i) {
                        let idx = src[i];
                        if (idx < 0) {
                            idx = ~idx;
                            let n = i - start + 1;
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