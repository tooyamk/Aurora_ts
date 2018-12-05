namespace Aurora.FbxFile {
    export const Version = "0.2.0";

    export function parse(data: ByteArray): Data {
        const collections = new Collections();

        const magic = data.readString(ByteArray.StringMode.FIXED_LENGTH, 21);
        if (magic === "Kaydara FBX Binary  ") {
            data.position += 2;
            const ver = data.readUint32();

            const root = new Node("", null);

            while (data.bytesAvailable > 4) {
                if (data.readUint32() < data.length) {
                    data.position -= 4;

                    _parseNode(data, root, ver, collections);
                } else {
                    break;
                }
            }
        } else if (magic.indexOf("FBX") >= 0) {
            console.error("parse fbx file error: this is a text format, only support bin format.");
        } else {
            console.error("parse fbx file error: unknow format.");
        }

        return collections.parse();
    }

    function _parseNode(data: ByteArray, parentNode: Node, ver: number, collections: Collections): void {
        const endOffset = ver < 7500 ? data.readUint32() : data.readUnsafeUint64();
        const numProperties = ver < 7500 ? data.readUint32() : data.readUnsafeUint64();
        const propertyListLen = ver < 7500 ? data.readUint32() : data.readUnsafeUint64();
        const nameLen = data.readUint8();
        const name = data.readString(ByteArray.StringMode.END_MARK, nameLen);

        if (endOffset === 0) return;

        const startPos = data.position;

        let properties: NodeProperty[] = null;
        if (numProperties > 0) {
            properties = [];
            properties.length = numProperties;
            for (let i = 0; i < numProperties; ++i) properties[i] = _parseNodeProperty(data);
        }

        const node = new Node(name, properties);
        parentNode.children.push(node);
        collections.addNode(node);

        data.position = startPos + propertyListLen;

        while (data.position < endOffset) _parseNode(data, node, ver, collections);
    }

    function _parseNodeProperty(data: ByteArray): NodeProperty {
        const property = new NodeProperty();

        const type = data.readUint8();
        switch (type) {
            case NodePropertyValue.C: {
                property.type = NodePropertyValueType.BOOL;
                property.value = data.readBool();

                break;
            }
            case NodePropertyValue.D: {
                property.type = NodePropertyValueType.NUMBER;
                property.value = data.readFloat64();

                break;
            }
            case NodePropertyValue.F: {
                property.type = NodePropertyValueType.NUMBER;
                property.value = data.readFloat32();

                break;
            }
            case NodePropertyValue.I: {
                property.type = NodePropertyValueType.INT;
                property.value = data.readInt32();

                break;
            }
            case NodePropertyValue.L: {
                property.type = NodePropertyValueType.INT;
                property.value = data.readUnsafeInt64();

                break;
            }
            case NodePropertyValue.R: {
                property.type = NodePropertyValueType.BYTES;
                property.value = data.readBytes(data.readUint32());

                break;
            }
            case NodePropertyValue.S: {
                property.type = NodePropertyValueType.STRING;
                property.value = data.readString(ByteArray.StringMode.FIXED_LENGTH, data.readUint32());

                break;
            }
            case NodePropertyValue.Y: {
                property.type = NodePropertyValueType.INT;
                property.value = data.readInt16();

                break;
            }
            case NodePropertyValue.b:
            case NodePropertyValue.c:
            case NodePropertyValue.d:
            case NodePropertyValue.f:
            case NodePropertyValue.i:
            case NodePropertyValue.l: {
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
                        const inflate = new Zlib.Inflate(new Uint8Array(data.readBytes(compressedLength).raw));
                        uncompressedData = new ByteArray(inflate.decompress().buffer);
                        //const inflate = new Zlib.Inflate(new Uint8Array(data.raw), { index: data.position, bufferSize: compressedLength });
                        //data.position += compressedLength;
                        //uncompressedData = new ByteArray(inflate.decompress().buffer);
                    }
                } else {
                    uncompressedData = data;
                }

                switch (type) {
                    case NodePropertyValue.b:
                    case NodePropertyValue.c: {
                        property.type = NodePropertyValueType.BOOL_ARRAY;
                        const arr: boolean[] = [];
                        arr.length = arrLen;
                        property.value = arr;
                        for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readBool();

                        break;
                    }
                    case NodePropertyValue.d: {
                        property.type = NodePropertyValueType.NUMBER_ARRAY;
                        const arr: number[] = [];
                        arr.length = arrLen;
                        property.value = arr;
                        for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readFloat64();

                        break;
                    }
                    case NodePropertyValue.f: {
                        property.type = NodePropertyValueType.NUMBER_ARRAY;
                        const arr: number[] = [];
                        arr.length = arrLen;
                        property.value = arr;
                        for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readFloat32();

                        break;
                    }
                    case NodePropertyValue.i: {
                        property.type = NodePropertyValueType.INT_ARRAY;
                        const arr: long[] = [];
                        arr.length = arrLen;
                        property.value = arr;
                        for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readInt32();

                        break;
                    }
                    case NodePropertyValue.l: {
                        property.type = NodePropertyValueType.INT_ARRAY;
                        const arr: long[] = [];
                        arr.length = arrLen;
                        property.value = arr;
                        for (let i = 0; i < arrLen; ++i) arr[i] = uncompressedData.readUnsafeInt64();

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