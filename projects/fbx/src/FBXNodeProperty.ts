namespace Aurora {
    export const enum FBXNodePropertyType {
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
        DIRECT = "Direct",
        INDEX_TO_DIRECT = "IndexToDirect",
        BY_CONTROL_POINT = "ByControlVertex",
        BY_POLYGON_VERTEX = "ByPolygonVertex"
    }

    export const enum FBXNodePropertyValueType {
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

    export class FBXNodeProperty {
        public type = FBXNodePropertyValueType.UNKNOW;
        public value: boolean | int | number | string | boolean[] | int[] | number[] | ByteArray = null;
    }
}