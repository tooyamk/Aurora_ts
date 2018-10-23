namespace Aurora {
    export const enum FBXNodeName {
        ANIMATION_CURVE = "AnimationCurve",
        ANIMATION_CURVE_NODE = "AnimationCurveNode",
        ANIMATION_LAYER = "AnimationLayer",
        ANIMATION_STACK = "AnimationStack",
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
        public name: String;
        public properties: FBXNodeProperty[] = null;
        public children: FBXNode[] = [];

        public get id(): int {
            return this._id;
        }

        public getChildByName(name: string): FBXNode {
            for (let i = 0, n = this.children.length; i < n; ++i) {
                if (this.children[i].name === name) return this.children[i];
            }
            return null;
        }

        public parse(): void {}
    }
}