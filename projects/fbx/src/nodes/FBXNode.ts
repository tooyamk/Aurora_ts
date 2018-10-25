namespace Aurora {
    export const enum FBXNodeAttribType {
        CLUSTER = "Cluster",
        LIMB_NODE = "LimbNode",
        MESH = "Mesh",
        SKIN = "Skin"
    }

    export const enum FBXNodeName {
        ANIMATION_CURVE = "AnimationCurve",
        ANIMATION_CURVE_NODE = "AnimationCurveNode",
        ANIMATION_LAYER = "AnimationLayer",
        ANIMATION_STACK = "AnimationStack",
        BLEND_WEIGHTS = "BlendWeights",
        C = "C",
        CONNECTIONS = "Connections",
        DEFORMER = "Deformer",
        GEOMETRY = "Geometry",
        GLOBAL_SETTINGS = "GlobalSettings",
        INDEXES = "Indexes",
        KEY_TIME = "KeyTime",
        KEY_VALUE_FLOAT = "KeyValueFloat",
        LAYER_ELEMENT_NORMAL = "LayerElementNormal",
        LAYER_ELEMENT_UV = "LayerElementUV",
        MAPPING_INFORMATION_TYPE = "MappingInformationType",
        MATRIX = "Matrix",
        MODEL = "Model",
        NODE = "Node",
        NORMALS = "Normals",
        OBJECTS = "Objects",
        P = "P",
        POLYGON_VERTEX_INDEX = "PolygonVertexIndex",
        POSE = "Pose",
        POSE_NODE = "PoseNode",
        PROPERTIES70 = "Properties70",
        REFERENCE_INFORMATION_TYPE = "ReferenceInformationType",
        TRANSFORM = "Transform",
        TRANSFORM_LINK = "TransformLink",
        UV = "UV",
        UV_INDEX = "UVIndex",
        VERTICES = "Vertices",
        WEIGHTS = "Weights"
    }

    export class FBXNode {
        protected _id: int = null;
        protected _attribType: string = null;
        protected _attribName: string = null;

        public name: String;
        public properties: FBXNodeProperty[] = null;
        public children: FBXNode[] = [];

        public get id(): int {
            return this._id;
        }

        public get attribName(): string {
            return this._attribName;
        }

        public get attribType(): string {
            return this._attribType;
        }

        public getChildByName(name: string): FBXNode {
            for (let i = 0, n = this.children.length; i < n; ++i) {
                if (this.children[i].name === name) return this.children[i];
            }
            return null;
        }

        public finish(): void {
            if (this.properties) {
                let len = this.properties.length;
                if (len > 0 && this.properties[0].type === FBXNodePropertyValueType.INT) this._id = <int>this.properties[0].value;
                if (len > 1 && this.properties[1].type === FBXNodePropertyValueType.STRING) this._attribName = <string>this.properties[1].value;
                if (len > 2 && this.properties[2].type === FBXNodePropertyValueType.STRING) this._attribType = <string>this.properties[2].value;

                if (this._id === 1433315232) {
                    let a = 1;
                }
            }
        }
    }
}