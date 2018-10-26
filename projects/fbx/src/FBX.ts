namespace Aurora.FBX {
    export function parse(data: ByteArray): ParseResult {
        data.position += 23;
        const ver = data.readUint32();

        const collections = new Collections();
        const root = new Node();

        while (data.bytesAvailable > 4) {
            if (data.readUint32() < data.length) {
                data.position -= 4;

                _parseNode(data, root, ver, collections);
            } else {
                break;
            }
        }

        return collections.parse();
    }

    function _parseNode(data: ByteArray, parentNode: Node, ver: number, collections: Collections): void {
        const endOffset = ver < 7500 ? data.readUint32() : parseInt(data.readUint64());
        const numProperties = ver < 7500 ? data.readUint32() : parseInt(data.readUint64());
        const propertyListLen = ver < 7500 ? data.readUint32() : parseInt(data.readUint64());
        const nameLen = data.readUint8();
        const name = data.readString(ByteArray.StringMode.END_MARK, nameLen);

        if (endOffset === 0) return;

        const startPos = data.position;

        let node: Node;

        switch (name) {
            case NodeName.ANIMATION_CURVE:
                node = new AnimationCurve();
                break;
            case NodeName.ANIMATION_CURVE_NODE:
                node = new AnimationCurveNode();
                break;
            case NodeName.ANIMATION_LAYER:
                node = new AnimationLayer();
                break;
            case NodeName.ANIMATION_STACK:
                node = new AnimationStack();
                break;
            case NodeName.C:
            case NodeName.CONNECTIONS:
                node = collections.addConnections(new Connection());
                break;
            case NodeName.DEFORMER:
                node = collections.addDeformer(new Deformer());
                break;
            case NodeName.GEOMETRY:
                node = collections.addGeometry(new Geometry());
                break;
            case NodeName.GLOBAL_SETTINGS:
                node = new GlobalSettings();
                break;
            case NodeName.MODEL:
                node = collections.addModel(new Model());
                break;
            case NodeName.POSE_NODE:
                node = new PoseNode();
                break;
            default:
                node = new Node();
                break;
        }
        
        node.name = name;
        parentNode.children.push(node);

        if (numProperties > 0) {
            const properties: NodeProperty[] = [];
            properties.length = numProperties;
            node.properties = properties;
            for (let i = 0; i < numProperties; ++i) properties[i] = _parseNodeProperty(data);
        }

        data.position = startPos + propertyListLen;

        while (data.position < endOffset) _parseNode(data, node, ver, collections);

        node.finish();
    }

    function _parseNodeProperty(data: ByteArray): NodeProperty {
        const property = new NodeProperty();

        const type = data.readUint8();
        switch (type) {
            case NodePropertyType.C: {
                property.type = NodePropertyValueType.BOOL;
                property.value = data.readBool();

                break;
            }
            case NodePropertyType.D: {
                property.type = NodePropertyValueType.NUMBER;
                property.value = data.readFloat64();

                break;
            }
            case NodePropertyType.F: {
                property.type = NodePropertyValueType.NUMBER;
                property.value = data.readFloat32();

                break;
            }
            case NodePropertyType.I: {
                property.type = NodePropertyValueType.INT;
                property.value = data.readInt32();

                break;
            }
            case NodePropertyType.L: {
                property.type = NodePropertyValueType.INT;
                property.value = parseInt(data.readInt64());

                break;
            }
            case NodePropertyType.R: {
                property.type = NodePropertyValueType.BYTES;
                property.value = data.readBytes(data.readUint32());

                break;
            }
            case NodePropertyType.S: {
                property.type = NodePropertyValueType.STRING;
                property.value = data.readString(ByteArray.StringMode.FIXED_LENGTH, data.readUint32());

                break;
            }
            case NodePropertyType.Y: {
                property.type = NodePropertyValueType.INT;
                property.value = data.readInt16();

                break;
            }
            case NodePropertyType.b:
            case NodePropertyType.c:
            case NodePropertyType.d:
            case NodePropertyType.f:
            case NodePropertyType.i:
            case NodePropertyType.l: {
                const arrLen = data.readUint32();
                const encoding = data.readUint32();
                const compressedLength = data.readUint32();

                let uncompressedData: ByteArray;

                if (encoding === 1) {
                    if (typeof Zlib === 'undefined') {
                        console.error('FBX parse error: need thirdparty library zlib.js, see https://github.com/imaya/zlib.js');
                        data.position += compressedLength;
                        break;
                    } else {
                        const inflate = new Zlib.Inflate(new Uint8Array(data.raw), { index: data.position, bufferSize: compressedLength });
                        data.position += compressedLength;
                        uncompressedData = new ByteArray(inflate.decompress().buffer);
                    }
                } else {
                    uncompressedData = data;
                }

                switch (type) {
                    case NodePropertyType.b:
                    case NodePropertyType.c: {
                        property.type = NodePropertyValueType.BOOL_ARRAY;
                        const arr: boolean[] = [];
                        arr.length = arrLen;
                        property.value = arr;
                        for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readBool();

                        break;
                    }
                    case NodePropertyType.d: {
                        property.type = NodePropertyValueType.NUMBER_ARRAY;
                        const arr: number[] = [];
                        arr.length = arrLen;
                        property.value = arr;
                        for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readFloat64();

                        break;
                    }
                    case NodePropertyType.f: {
                        property.type = NodePropertyValueType.NUMBER_ARRAY;
                        const arr: number[] = [];
                        arr.length = arrLen;
                        property.value = arr;
                        for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readFloat32();

                        break;
                    }
                    case NodePropertyType.i: {
                        property.type = NodePropertyValueType.INT_ARRAY;
                        const arr: int[] = [];
                        arr.length = arrLen;
                        property.value = arr;
                        for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readInt32();

                        break;
                    }
                    case NodePropertyType.l: {
                        property.type = NodePropertyValueType.INT_ARRAY;
                        const arr: int[] = [];
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