namespace Aurora {
    export class ARRFile {
        public static readonly FILE_HEADER = 0xBFC2D4F6;

        public static readonly CHUNK_HEAD = 0x0001;

        public static readonly CHUNK_MESH = 0x0002;
        public static readonly CHUNK_MESH_ATTRIB = 0x01;
        public static readonly CHUNK_MESH_VERT = 0x02;
        public static readonly CHUNK_MESH_UV = 0x03;
        public static readonly CHUNK_MESH_NRM = 0x04;
        public static readonly CHUNK_MESH_BIND_POSE = 0x05;
        public static readonly CHUNK_MESH_DRAW_IDX = 0x05;

        public static readonly CHUNK_SKELETON = 0x0003;

        public meshes: MeshAsset[] = null;
        public skeletons: Skeleton[] = null;

        private _version: uint = 0;

        public get version(): uint {
            return this._version;
        }

        public static parse(data: ByteArray): ARRFile {
            let file = new ARRFile();

            let pos = data.position;
            let endian = data.littleEndian;
            data.position = 0;
            data.littleEndian = true;

            if (data.readUint32() === ARRFile.FILE_HEADER) {
                while (data.bytesAvailable >= 2) {
                    let chunk = data.readUint16();
                    let length = ARRFile._parseLength(data, chunk);
                    chunk = chunk >> 2 & 0xFFFF;
                    let pos = data.position;
                    switch (chunk) {
                        case ARRFile.CHUNK_HEAD:
                            ARRFile._parseHead(data, length, file);
                            break;
                        case ARRFile.CHUNK_MESH:
                            ARRFile._parseMesh(data, length, file);
                            break;
                        case ARRFile.CHUNK_SKELETON:
                            ARRFile._parseSkeleton(data, length, file);
                            break;
                        default:
                            console.log(`Parse ARR file error : not define chunk (0x${chunk.toString(16)})`);
                            break;
                    }
                    data.position = pos + length;
                }
            }

            data.position = pos;
            data.littleEndian = endian;

            return file;
        }

        private static _parseLength(data: ByteArray, chunk: uint): uint {
            switch (chunk & 0b11) {
                case 1:
                    return data.readUint8();
                case 2:
                    return data.readUint16();
                case 3:
                    return data.readUint32();
                default:
                    return 0;
            }
        }

        private static _parseHead(data: ByteArray, length: uint, file: ARRFile): void {
            file._version = data.readUint24();
            let att = data.readUint8();
        }

        private static _parseMesh(data: ByteArray, length: uint, file: ARRFile): void {
            let as = new MeshAsset();
            if (file.meshes) {
                file.meshes.push(as);
            } else {
                file.meshes = [as];
            }

            let end = data.position + length;
            while (data.position < end) {
                let chunk = data.readUint8();
                let length = ARRFile._parseLength(data, chunk);
                chunk = chunk >> 2 & 0xFFFF;
                let pos = data.position;
                switch (chunk) {
                    case ARRFile.CHUNK_MESH_ATTRIB:
                        ARRFile._parseMeshAttrib(data, length, as);
                        break;
                    case ARRFile.CHUNK_MESH_VERT:
                        as.addVertexSource(ARRFile._parseMeshVertex(data, length, ShaderPredefined.a_Position0));
                        break;
                    case ARRFile.CHUNK_MESH_UV:
                        as.addVertexSource(ARRFile._parseMeshVertex(data, length, ShaderPredefined.a_UV0));
                        break;
                    case ARRFile.CHUNK_MESH_NRM:
                        as.addVertexSource(ARRFile._parseMeshVertex(data, length, ShaderPredefined.a_Normal0));
                        break;
                    case ARRFile.CHUNK_MESH_DRAW_IDX:
                        as.drawIndexSource = ARRFile._parseMeshDrawIndex(data, length);
                        break;
                    default:
                        console.log(`Parse ARR File error : not define mesh chunk (0x${chunk.toString(16)})`);
                        break;
                }
                data.position = pos + length;
            }
        }

        private static _parseMeshAttrib(data: ByteArray, length: uint, asset: MeshAsset): void {
            asset.name = data.readString(ByteArrayStringMode.DYNAMIC_LENGTH);
        }

        private static _parseMeshVertex(data: ByteArray, length: uint, name: string): VertexSource {
            let att = data.readUint8();
            let size = att & 0b11;
            let type: GLVertexBufferDataType;
            let vertices: number[] = [];
            --length;
            switch (att >> 2 & 0b111) {
                case 0: {
                    type = GLVertexBufferDataType.BYTE;
                    let n = length;
                    vertices.length = n;
                    for (let i = 0; i < n; ++i) vertices[i] = data.readInt8();

                    break;
                }
                case 1: {
                    type = GLVertexBufferDataType.UNSIGNED_BYTE;
                    let n = length;
                    vertices.length = n;
                    for (let i = 0; i < n; ++i) vertices[i] = data.readUint8();

                    break;
                }
                case 2: {
                    type = GLVertexBufferDataType.SHORT;
                    let n = length >> 1;
                    vertices.length = n;
                    for (let i = 0; i < n; ++i) vertices[i] = data.readInt16();

                    break;
                }
                case 3: {
                    type = GLVertexBufferDataType.UNSIGNED_SHORT;
                    let n = length >> 1;
                    vertices.length = n;
                    for (let i = 0; i < n; ++i) vertices[i] = data.readUint16();

                    break;
                }
                case 4: {
                    type = GLVertexBufferDataType.INT;
                    let n = length >> 2;
                    vertices.length = n;
                    for (let i = 0; i < n; ++i) vertices[i] = data.readInt32();

                    break;
                }
                case 5: {
                    type = GLVertexBufferDataType.UNSIGNED_INT;
                    let n = length >> 2;
                    vertices.length = n;
                    for (let i = 0; i < n; ++i) vertices[i] = data.readUint32();

                    break;
                }
                default: {
                    type = GLVertexBufferDataType.FLOAT;
                    let n = length >> 2;
                    vertices.length = n;
                    for (let i = 0; i < n; ++i) vertices[i] = data.readFloat32();

                    break;
                }
            }

            return new VertexSource(name, vertices, size, type, false, GLUsageType.STATIC_DRAW);
        }

        private static _parseMeshDrawIndex(data: ByteArray, length: uint): DrawIndexSource {
            let indices: number[] = [];
            
            let att = data.readUint8();
            let type: GLIndexDataType;
            --length;
            switch (att & 0b11) {
                case 1: {
                    type = GLIndexDataType.UNSIGNED_BYTE;
                    let n = length;
                    for (let i = 0; i < n; ++i) indices[i] = data.readUint8();

                    break;
                }
                case 2: {
                    type = GLIndexDataType.UNSIGNED_SHORT;
                    let n = length;
                    for (let i = 0; i < n; ++i) indices[i] = data.readUint16();

                    break;
                }
                case 3: {
                    type = GLIndexDataType.UNSIGNED_INT;
                    let n = length;
                    for (let i = 0; i < n; ++i) indices[i] = data.readUint32();

                    break;
                }
                default:
                    type = GLIndexDataType.UNSIGNED_SHORT;
                    break;
            }

            return new DrawIndexSource(indices, type, GLUsageType.STATIC_DRAW);
        }

        private static _parseSkeleton(data: ByteArray, length: uint, file: ARRFile): void {
            let numBones = data.readDynamicLength();
            if (numBones > 0) {
                let ske = new Skeleton();
                if (!file.skeletons) file.skeletons = [];
                file.skeletons.push(ske);

                let bones: Node3D[] = [];
                ske.bones = bones;

                for (let i = 0; i < numBones; ++i) {
                    let bone = new Node3D();
                    bone.name = data.readString(ByteArrayStringMode.DYNAMIC_LENGTH);
                    bones[i] = bone;
                }

                let numRootBones = data.readDynamicLength();
                
                let rootBones: Node3D[] = [];
                //ske.rootBones = rootBones;

                if (numBones <= 0xFF) {
                    for (let i = 0; i < numBones; ++i) rootBones[i] = bones[data.readUint8()];
                } else if (numBones <= 0xFFFF) {
                    for (let i = 0; i < numBones; ++i) rootBones[i] = bones[data.readUint16()];
                } else {
                    for (let i = 0; i < numBones; ++i) rootBones[i] = bones[data.readUint32()];
                }
            }
        }
    }
}