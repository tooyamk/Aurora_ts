namespace Aurora {
    export abstract class FBX {
        public static parse(data: ByteArray): void {
            data.position += 23;
            let ver = data.readUint32();

            let root = new FBXNode();

            while (data.bytesAvailable > 4) {
                if (data.readUint32() < data.length) {
                    data.position -= 4;

                    FBX._parseNode(data, root, ver);
                } else {
                    break;
                }
            }

            let a = 1;
        }

        private static _parseNode(data: ByteArray, parentNode: FBXNode, ver: number): void {
            let endOffset = ver < 7500 ? data.readUint32() : parseInt(data.readUint64());
            let numProperties = ver < 7500 ? data.readUint32() : parseInt(data.readUint64());
            let propertyListLen = ver < 7500 ? data.readUint32() : parseInt(data.readUint64());
            let nameLen = data.readUint8();
            let name = data.readString(ByteArrayStringMode.END_MARK, nameLen);
            //console.log(name);

            if (endOffset === 0) return;

            let startPos = data.position;

            let node: FBXNode;

            switch (name) {
                case FBXNodeName.ANIMATION_CURVE:
                    node = new FBXAnimationCurve();
                    break;
                case FBXNodeName.ANIMATION_CURVE_NODE:
                    node = new FBXAnimationCurveNode();
                    break;
                case FBXNodeName.ANIMATION_LAYER:
                    node = new FBXAnimationLayer();
                    break;
                case FBXNodeName.ANIMATION_STACK:
                    node = new FBXAnimationStack();
                    break;
                case FBXNodeName.C:
                    node = new FBXSubConnection();
                    break;
                case FBXNodeName.DEFORMER:
                    node = new FBXDeformer();
                    break;
                case FBXNodeName.GEOMETRY:
                    node = new FBXGeometry();
                    break;
                case FBXNodeName.GLOBAL_SETTINGS:
                    node = new FBXGlobalSettings();
                    break;
                case FBXNodeName.MODEL:
                    node = new FBXModel();
                    break;
                default:
                    node = new FBXNode();
                    break;
            }
            
            node.name = name;
            parentNode.children.push(node);

            if (numProperties > 0) {
                let properties: FBXNodeProperty[] = [];
                properties.length = numProperties;
                node.properties = properties;
                for (let i = 0; i < numProperties; ++i) properties[i] = FBX._parseNodeProperty(data);
            }

            data.position = startPos + propertyListLen;

            while (data.position < endOffset) FBX._parseNode(data, node, ver);

            node.parse();
        }

        private static _parseNodeProperty(data: ByteArray): FBXNodeProperty {
            let property = new FBXNodeProperty();

            let type = data.readUint8();
            switch (type) {
                case FBXNodePropertyType.C: {
                    property.type = FBXNodePropertyValueType.BOOL;
                    property.value = data.readBool();

                    break;
                }
                case FBXNodePropertyType.D: {
                    property.type = FBXNodePropertyValueType.NUMBER;
                    property.value = data.readFloat64();

                    break;
                }
                case FBXNodePropertyType.F: {
                    property.type = FBXNodePropertyValueType.NUMBER;
                    property.value = data.readFloat32();

                    break;
                }
                case FBXNodePropertyType.I: {
                    property.type = FBXNodePropertyValueType.INT;
                    property.value = data.readInt32();

                    break;
                }
                case FBXNodePropertyType.L: {
                    property.type = FBXNodePropertyValueType.INT;
                    property.value = parseInt(data.readInt64());

                    break;
                }
                case FBXNodePropertyType.R: {
                    property.type = FBXNodePropertyValueType.BYTES;
                    property.value = data.readBytes(data.readUint32());

                    break;
                }
                case FBXNodePropertyType.S: {
                    property.type = FBXNodePropertyValueType.STRING;
                    property.value = data.readString(ByteArrayStringMode.FIXED_LENGTH, data.readUint32());

                    break;
                }
                case FBXNodePropertyType.Y: {
                    property.type = FBXNodePropertyValueType.INT;
                    property.value = data.readInt16();

                    break;
                }
                case FBXNodePropertyType.b:
                case FBXNodePropertyType.c:
                case FBXNodePropertyType.d:
                case FBXNodePropertyType.f:
                case FBXNodePropertyType.i:
                case FBXNodePropertyType.l: {
                    let arrLen = data.readUint32();
                    let encoding = data.readUint32();
                    let compressedLength = data.readUint32();

                    let uncompressedData: ByteArray;

                    if (encoding === 1) {
                        if (typeof Zlib === 'undefined') {
                            data.position += compressedLength;
                            break;
                        } else {
                            let inflate = new Zlib.Inflate(new Uint8Array(data.raw.slice(data.position, compressedLength)));
                            data.position += compressedLength;
                            uncompressedData = new ByteArray(inflate.decompress().buffer);
                        }
                    } else {
                        uncompressedData = data;
                    }

                    switch (type) {
                        case FBXNodePropertyType.b:
                        case FBXNodePropertyType.c: {
                            property.type = FBXNodePropertyValueType.BOOL_ARRAY;
                            let arr: boolean[] = [];
                            arr.length = arrLen;
                            property.value = arr;
                            for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readBool();

                            break;
                        }
                        case FBXNodePropertyType.d: {
                            property.type = FBXNodePropertyValueType.NUMBER_ARRAY;
                            let arr: number[] = [];
                            arr.length = arrLen;
                            property.value = arr;
                            for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readFloat64();

                            break;
                        }
                        case FBXNodePropertyType.f: {
                            property.type = FBXNodePropertyValueType.NUMBER_ARRAY;
                            let arr: number[] = [];
                            arr.length = arrLen;
                            property.value = arr;
                            for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readFloat32();

                            break;
                        }
                        case FBXNodePropertyType.i: {
                            property.type = FBXNodePropertyValueType.INT_ARRAY;
                            let arr: int[] = [];
                            arr.length = arrLen;
                            property.value = arr;
                            for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readInt32();

                            break;
                        }
                        case FBXNodePropertyType.l: {
                            property.type = FBXNodePropertyValueType.INT_ARRAY;
                            let arr: int[] = [];
                            arr.length = arrLen;
                            property.value = arr;
                            for (let i = 0; i < arrLen; ++i) arr[i] = parseInt(uncompressedData.readInt64());

                            break;
                        }
                        default:
                            break;
                    }

                    break;
                }
                default:
                    throw new Error("FBX parse: Unknown property type " + type);
                    break;
            }

            return property;
        }
    }
}