namespace Aurora.FbxFile {
    export const enum NodePropertyValue {
        C = 0x43,
        D = 0x44,
        F = 0x46,
        I = 0x49,
        L = 0x4C,
        R = 0x52,
        S = 0x53,
        Y = 0x59,
        b = 0x62,
        c = 0x63,
        d = 0x64,
        f = 0x66,
        i = 0x69,
        l = 0x6C,
        UP_AXIS = "UpAxis",
        DIRECT = "Direct",
        INDEX_TO_DIRECT = "IndexToDirect",
        BY_CONTROL_POINT = "ByControlVertex",
        BY_POLYGON_VERTEX = "ByPolygonVertex",
        D_X = "d|X",
        D_Y = "d|Y",
        D_Z = "d|Z",
        GEOMETRIC_TRANSLATION = "GeometricTranslation",
        GEOMETRIC_ROTATION = "GeometricRotation",
        GEOMETRIC_SCALING = "GeometricScaling",
        PPE_ROTATION = "PreRotation",
        ROTATION_ACTIVE = "RotationActive",
        INHERIT_TYPE = "InheritType",
        SCALING_MAX = "ScalingMax",
        DEFAULT_ATTRIBULE_INDEX = "DefaultAttributeIndex",
        LCL_TRANSLATION = "Lcl Translation",
        LCL_ROTATION = "Lcl Rotation",
        LCL_SCALING = "Lcl Scaling",
        MAX_HANDLE = "MaxHandle"
    }

    export const enum NodePropertyValueType {
        UNKNOW,
        BOOL,
        INT,
        NUMBER,
        STRING,
        BOOL_ARRAY,
        INT_ARRAY,
        NUMBER_ARRAY,
        BYTES
    }

    export class NodeProperty {
        public type = NodePropertyValueType.UNKNOW;
        public value: boolean | long | number | string | boolean[] | long[] | number[] | ByteArray = null;
    }

    export const enum NodeAttribValue {
        CLUSTER = "Cluster",
        LIMB_NODE = "LimbNode",
        ROOT = "Root",
        NULL = "Null",
        MESH = "Mesh",
        SKIN = "Skin",
        T = "T",
        R = "R",
        S = "S"
    }

    export const enum NodeName {
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

    export class Node {
        public readonly name: string;
        public readonly id: int = null;
        public readonly attribType: string = null;
        public readonly attribName: string = null;

        public readonly properties: NodeProperty[] = null;
        public readonly children: Node[] = [];

        constructor(name: string, properties: NodeProperty[]) {
            this.name = name;
            this.properties = properties;

            if (this.properties) {
                const len = this.properties.length;
                if (len > 0 && this.properties[0].type === NodePropertyValueType.INT) this.id = <int>this.properties[0].value;
                if (len > 1 && this.properties[1].type === NodePropertyValueType.STRING) this.attribName = <string>this.properties[1].value;
                if (len > 2 && this.properties[2].type === NodePropertyValueType.STRING) this.attribType = <string>this.properties[2].value;
            }
        }

        public getChildByName(name: string): Node {
            for (let i = 0, n = this.children.length; i < n; ++i) {
                if (this.children[i].name === name) return this.children[i];
            }
            return null;
        }
    }
}