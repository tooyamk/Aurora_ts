///<reference path="FBXNode.ts"/>

namespace Aurora {
    export class FBXGeometry extends FBXNode {
        public asset: MeshAsset = null;

        private _numVertexPerPolygon: uint = 0;

        public parse(): void {
            super.parse();

            this._id = <int>this.properties[0].value;

            let child = this.getChildByName(FBXNodeName.POLYGON_VERTEX_INDEX);
            if (child) this._parsePolygonVertexIndex(child);

            for (let i = 0, n = this.children.length; i < n; ++i) {
                let child = this.children[i];
                switch (child.name) {
                    case FBXNodeName.VERTICES:
                        this._parseVertices(child);
                        break;
                    case FBXNodeName.LAYER_ELEMENT_NORMAL:
                        this._parseLayerElementNormal(child);
                        break;
                    case FBXNodeName.LAYER_ELEMENT_UV:
                        this._parseLayerElementNormal(child);
                        break;
                    default:
                        break;
                }
            }
        }

        private _getOrCreateAsset(): MeshAsset {
            if (!this.asset) this.asset = new MeshAsset();
            return this.asset;
        }

        private _parseVertices(node: FBXNode): void {
            if (node.properties && node.properties.length > 0) {
                let p = node.properties[0];
                if (p.type === FBXNodePropertyValueType.NUMBER_ARRAY) {
                    this._getOrCreateAsset().addVertexSource(new VertexSource(ShaderPredefined.a_Position0, <number[]>p.value, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
                }
            }
        }

        private _parseLayerElementNormal(node: FBXNode): void {
            for (let i = 0, n = node.children.length; i < n; ++i) {
                let child = node.children[i];
                switch (child.name) {
                    case FBXNodeName.NORMALS:
                        //this._parseVertices(child);
                        break;
                    case FBXNodeName.REFERENCE_INFORMATION_TYPE:
                        //this._parseLayerElementNormal(child);
                        break;
                    default:
                        break;
                }
            }
        }

        private _parseLayerElementUV(node: FBXNode): void {
            for (let i = 0, n = node.children.length; i < n; ++i) {
                let child = node.children[i];
                switch (child.name) {
                    case FBXNodeName.UV:
                        break;
                    case FBXNodeName.UV_INDEX:
                        break;
                    case FBXNodeName.REFERENCE_INFORMATION_TYPE:
                        break;
                    default:
                        break;
                }
            }
        }

        private _parsePolygonVertexIndex(node: FBXNode): void {
            if (node.properties && node.properties.length > 0) {
                let p = node.properties[0];
                if (p.type === FBXNodePropertyValueType.INT_ARRAY) {
                    let src = <int[]>p.value;
                    let len = src.length;
                    
                    for (let i = 0; i < len; ++i) {
                        if (src[i] < 0) {
                            this._numVertexPerPolygon = i + 1;
                            break;
                        }
                    }
                }
            }
        }
    }
}