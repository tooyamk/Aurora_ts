namespace Aurora.XFile {
    export const Version = "0.1.0";

    const enum FormatType {
        TXT = "txt ",
        TZIP = "tzip",
        BIN = "bin ",
        BZIP = "bzip"
    }

    const enum TokenType {
        NAME = 1,
        STRING = 2,
        INTEGER = 3,
        GUID = 5,
        INTEGER_LIST = 6,
        FLOAT_LIST = 7,
        OBRACE = 10,//{
        CBRACE = 11,//}
        OPAREN = 12,//(
        CPAREN = 13,//)
        OBRACKET = 14,//[
        CBRACKET = 15,//]
        OANGLE = 16,//<
        CANGLE = 17,//>
        DOT = 18,//.
        COMMA = 19,//,
        SEMICOLON = 20,//;
        TEMPLATE = 31,
        WORD = 40,
        DWORD = 41,
        FLOAT = 42,
        DOUBLE = 43,
        CHAR = 44,
        UCHAR = 45,
        SWORD = 46,
        SDWORD = 47,
        VOID = 48,
        LPSTR = 49,
        UNICODE = 50,
        CSTRING = 51,
        ARRAY = 52
    }

    const enum TokenName {
        ANIMATION = 'Animation',
        ANIMATION_KEY = 'AnimationKey',
        ANIMATION_SET = 'AnimationSet',
        ANIM_TICKS_PRE_SECOND = 'AnimTicksPerSecond',
        FRAME = 'Frame',
        FRAME_TRANSFORM_MATRIX = 'FrameTransformMatrix',
        MATERIAL = 'Material',
        MESH = 'Mesh',
        MESH_MATERIAL_LIST = 'MeshMaterialList',
        MESH_NORMALS = 'MeshNormals',
        MESH_TEXTURE_COORDS = 'MeshTextureCoords',
        SKIN_WEIGHTS = 'SkinWeights',
        TEMPLATE = 'template',
        TEXTURE_FILE_NAME = 'TextureFilename',
        XSKIN_MESH_HEADER = 'XSkinMeshHeader',

        OBRACE = '{',
        CBRACE = '}',
        DOT = '.'
    }

    class Token {
        public type: TokenType = null;
        public value: string | int | uint[] | number[] = null;
    }

    class Frame {
        public root: Frame = null;
        public parent: Frame = null;
        public name: string = null;
        public children: Frame[] = [];
        public matrix: Matrix44 = null;

        public addChild(c: Frame): void {
            this.children[this.children.length] = c;
            c.root = this.root;
        }
    }

    class SkinWeights {
        public boneName: string = null;
        public indices: uint[] = null;
        public weights: number[] = null;
        public matrix: Matrix44 = null;
    }

    class SkinVertex {
        public indices: uint[] = [];
        public weights: number[] = [];
    }

    class ParsedData {
        private _rootFrames: Frame[] = [];
        private _frames: Frame[] = [];
        private _framesMap: { [key: string]: Frame } = {};

        private _skinWeightsMap: SkinWeights[][] = null;

        private _meshes: MeshAsset[] = null;

        public addFrame(frame: Frame, parent: Frame): void {
            if (parent) {
                frame.parent = parent;
                parent.addChild(frame);
            } else {
                frame.root = frame;
                this._rootFrames[this._rootFrames.length] = frame;
            }
            this._frames[this._frames.length] = frame;
            this._framesMap[frame.name] = frame;
        }

        public addMesh(mesh: MeshAsset): uint {
            if (!this._meshes) this._meshes = [];
            const idx = this._meshes.length;
            this._meshes[idx] = mesh;
            return idx;
        }

        public addSkinWeights(idx: uint, sw: SkinWeights): void {
            if (!this._skinWeightsMap) this._skinWeightsMap = [];
            let arr = this._skinWeightsMap[idx];
            if (!arr) {
                arr = [];
                this._skinWeightsMap[idx] = arr;
            }
            arr[arr.length] = sw;
        }

        public generate(data: Data): void {
            const excludeBones: { [key: string]: boolean } = {};
            const usedBones: { [key: string]: boolean } = {};

            if (this._meshes) {
                const n = this._meshes.length;
                if (n > 0) {
                    const meshes: MeshAsset[] = [];
                    meshes.length = n;
                    for (let i = 0; i < n; ++i) {
                        const asset = this._meshes[i];
                        meshes[i] = asset;

                        excludeBones[asset.name] = true;

                        if (!this._skinWeightsMap) continue;

                        const swArr = this._skinWeightsMap[i];
                        if (!swArr) continue;
                        
                        const vs = asset.getVertexSource(ShaderPredefined.a_Position0);
                        if (!vs || !vs.data) continue;

                        const numVertices = vs.getDataLength() / vs.size;

                        let numBones: uint = 0;
                        const bones: { [key: string]: uint } = {};
                        const boneNames: string[] = [];

                        const skinVertices: number[][] = [];
                        skinVertices.length = numVertices;
                        for (let i = 0; i < numVertices; ++i) skinVertices[i] = [];

                        let numDataPerElement: uint = 0;

                        const bindPreMatrices: Matrix44[] = [];

                        for (let i = 0, sw: SkinWeights; sw = swArr[i++];) {
                            usedBones[sw.boneName] = true;
                            let boneIdx: uint = bones[sw.boneName];
                            if (boneIdx === undefined) {
                                boneIdx = numBones;
                                bones[sw.boneName] = numBones++;
                                boneNames[boneIdx] = sw.boneName;

                                bindPreMatrices[boneIdx] = sw.matrix;
                            }

                            const indices = sw.indices;
                            for (let j = 0, n = indices.length; j < n; ++j) {
                                const vertIdx = indices[j];
                                const sv = skinVertices[vertIdx];
                                let n = sv.length;
                                if (n < 8) {
                                    if (numDataPerElement < n + 2) numDataPerElement = n + 2;
                                    sv[n] = boneIdx;
                                    sv[++n] = sw.weights[j];
                                }
                            }
                        }
                        numDataPerElement >>= 1;

                        asset.boneNames = boneNames;
                        asset.bindPreMatrices = bindPreMatrices;

                        const len = numVertices * numDataPerElement;
                        const boneIndices: number[] = [];
                        boneIndices.length = len; 
                        const boneWeights: number[] = [];
                        boneWeights.length = len;
                        for (let i = 0; i < numVertices; ++i) {
                            const idx = i * numDataPerElement;
                            const sv = skinVertices[i];
                            let n = sv.length >> 1;
                            let j = 0;
                            for (; j < n; ++j) {
                                const idx1 = idx + j;
                                let idx2 = j << 1;
                                boneIndices[idx1] = sv[idx2];
                                boneWeights[idx1] = sv[++idx2];
                            }

                            for (; j < numDataPerElement; ++j) {
                                const idx1 = idx + j;
                                boneIndices[idx1] = 0;
                                boneWeights[idx1] = 0;
                            }
                        }

                        asset.addVertexSource(new VertexSource(ShaderPredefined.a_BoneIndex0, boneIndices, numDataPerElement, GLVertexBufferDataType.UNSIGNED_SHORT, false, GLUsageType.STATIC_DRAW));
                        asset.addVertexSource(new VertexSource(ShaderPredefined.a_BoneWeight0, boneWeights, numDataPerElement, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
                    }
                    data.meshes = meshes;
                }
            }

            for (let name in usedBones) delete excludeBones[name];
            let numBones: uint = 0;
            const bonesSortedMap: { [key: string]: uint } = {};
            const rootBones: { [key: string]: boolean } = {};
            for (let i = 0, n = this._frames.length; i < n; ++i) {
                const f = this._frames[i];
                if (!excludeBones[f.name]) {
                    bonesSortedMap[bonesSortedMap.name] = numBones++;
                    rootBones[f.root.name] = true;
                }
            }

            if (numBones > 0) {
                const skeleton = new Skeleton();

                skeleton.bones.length = numBones;
                for (let name in bonesSortedMap) {
                    const bone = new Node();
                    bone.name = name;
                    skeleton.bones[bonesSortedMap[name]] = bone;
                }

                let num = 0;
                for (let name in rootBones) {
                    const idx = bonesSortedMap[name];
                    skeleton.rootBoneIndices[num++] = idx;

                    this._doBoneHierarchy(this._framesMap[name], skeleton.bones[idx], bonesSortedMap, skeleton.bones);
                }

                data.skeleton = skeleton;
            }
        }

        private _doBoneHierarchy(parentFrame: Frame, parentBone: Node, bonesSortedMap: { [key: string]: uint }, bones: Node[]): void {
            for (let i = 0, n = parentFrame.children.length; i < n; +i) {
                const f = parentFrame.children[i];
                const idx = bonesSortedMap[f.name];
                const b = bones[idx];
                parentBone.addChild(b);
                this._doBoneHierarchy(f, b, bonesSortedMap, bones);
            }
        }
    }

    export class Data {
        public meshes: MeshAsset[] = null;
        public skeleton: Skeleton = null;
        public animationClips: SkeletonAnimationClip[] = null;
    }

    export function parse(data: ByteArray): Data {
        const result = new Data();

        const magic = data.readUint32();
        if (magic === 0x20666F78) {
            const c0 = data.readUint8();
            const c1 = data.readUint8();
            const c2 = data.readUint8();
            const c3 = data.readUint8();
            const ver = ((c0 - 48) * 10 + (c1 - 48)) + "." + ((c2 - 48) * 10 + (c3 - 48));
            const fmt = data.readString(ByteArray.StringMode.FIXED_LENGTH, 4);

            if (fmt === FormatType.BIN) {
                const c0 = data.readUint8();
                const c1 = data.readUint8();
                const c2 = data.readUint8();
                const c3 = data.readUint8();
                const floatBits = (c0 - 48) * 1000 + (c1 - 48) * 100 + (c2 - 48) * 10 + (c3 - 48);

                const parsedData = new ParsedData();

                while (data.bytesAvailable > 1) {
                    const token = _parseNextToken(data, floatBits);
                    switch (token.value) {
                        case TokenName.TEMPLATE:
                            _parseTemplate(data, floatBits);
                            break;
                        case TokenName.FRAME:
                            _parseFrame(data, floatBits, parsedData, null);
                            break;
                        case TokenName.MATERIAL:
                            _parseMaterial(data, floatBits);
                            break;
                        default:
                            _parseUnknownData(data, floatBits);
                            break;
                    }
                }

                parsedData.generate(result);
            } else {

            }
        }

        return result;
    }

    function _parseFrame(data: ByteArray, floatBits: uint, parsedData: ParsedData, parent: Frame): void {
        const name =_parseHeadName(data, floatBits);

        const f = new Frame();
        f.name = name;
        parsedData.addFrame(f, parent);

        let running = true;
        do {
            const token = _parseNextToken(data, floatBits);
            switch (token.value) {
                case TokenName.CBRACE:
                    running = false;
                    break;
                case TokenName.FRAME:
                    _parseFrame(data, floatBits, parsedData, f);
                    break;
                case TokenName.FRAME_TRANSFORM_MATRIX:
                    _parseFrameTransformMatrix(data, floatBits, f);
                    break;
                case TokenName.MESH:
                    _parseMesh(data, floatBits, parsedData);
                    break;
                default:
                    _parseUnknownData(data, floatBits);
                    break;
            }
        } while(running);
    }

    function _parseMesh(data: ByteArray, floatBits: uint, parsedData: ParsedData): void {
        const name = _parseHeadName(data, floatBits);

        const asset: MeshAsset = new MeshAsset();
        asset.name = name;

        const idx = parsedData.addMesh(asset);

        const numToken = _parseNextToken(data, floatBits);
        const valuesToken = _parseNextToken(data, floatBits);
        const indicesToken = _parseNextToken(data, floatBits);

        asset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, <number[]>valuesToken.value, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));

        const rawIndices = <uint[]>indicesToken.value;
        const numDrawIdx: uint = rawIndices[0];

        const indices: uint[] = [];
        indices.length = numDrawIdx * 3;
        let idx0: uint = 0;
        let idx1: uint = 2;
        for (let i = 0; i < numDrawIdx; ++i) {
            indices[idx0++] = rawIndices[idx1++];
            indices[idx0++] = rawIndices[idx1++];
            indices[idx0++] = rawIndices[idx1];
            idx1 += 2;
        }
        asset.drawIndexSource = new DrawIndexSource(indices, GLIndexDataType.AUTO, GLUsageType.STATIC_DRAW);

        let running = true;
        do {
            const token = _parseNextToken(data, floatBits);
            switch (token.value) {
                case TokenName.CBRACE:
                    running = false;
                    break;
                case TokenName.MESH_NORMALS:
                    _parseMeshNormals(data, floatBits, asset);
                    break;
                case TokenName.MESH_TEXTURE_COORDS:
                    _parseMeshUVs(data, floatBits, asset);
                    break;
                case TokenName.XSKIN_MESH_HEADER:
                    _parseSkinMeshHeader(data, floatBits);
                    break;
                case TokenName.SKIN_WEIGHTS: {
                    const sw = _parseSkinWeights(data, floatBits);
                    if (sw) parsedData.addSkinWeights(idx, sw);

                    break;
                }
                case TokenName.MESH_MATERIAL_LIST:
                    _parseMeshMaterialList(data, floatBits);
                    break;
                default:
                    _parseUnknownData(data, floatBits);
                    break;
            }
        } while (running);
    }

    function _parseMeshNormals(data: ByteArray, floatBits: uint, asset: MeshAsset): void {
        _parseHeadName(data, floatBits);
        const numToken = _parseNextToken(data, floatBits);
        const valuesToken = _parseNextToken(data, floatBits);

        asset.addVertexSource(new VertexSource(ShaderPredefined.a_Normal0, <number[]>valuesToken.value, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));

        _checkForClosingBrace(data, floatBits);
    }

    function _parseMeshUVs(data: ByteArray, floatBits: uint, asset: MeshAsset): void {
        _parseHeadName(data, floatBits);
        const numToken = _parseNextToken(data, floatBits);
        const valuesToken = _parseNextToken(data, floatBits);

        asset.addVertexSource(new VertexSource(ShaderPredefined.a_UV0, <number[]>valuesToken.value, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
        
        _checkForClosingBrace(data, floatBits);
    }

    function _parseSkinMeshHeader(data: ByteArray, floatBits: uint): void {
        _parseHeadName(data, floatBits);
        _parseNextToken(data, floatBits);
        _checkForClosingBrace(data, floatBits);
    }

    function _parseSkinWeights(data: ByteArray, floatBits: uint): SkinWeights {
        _parseHeadName(data, floatBits);

        const boneNameToken = _parseNextToken(data, floatBits);
        const indicesToken = _parseNextToken(data, floatBits);
        const weightsToken = _parseNextToken(data, floatBits);

        const weights = <number[]>weightsToken.value;

        const sw = new SkinWeights();
        sw.boneName = <string>boneNameToken.value;
        sw.indices = (<uint[]>indicesToken.value).slice(1);
        sw.weights = weights.slice(0, sw.indices.length);
        sw.matrix = new Matrix44().set44FromArray(weights.slice(weights.length - 16));

        _checkForClosingBrace(data, floatBits);

        return sw;
    }

    function _parseMeshMaterialList(data: ByteArray, floatBits: uint): void {
        _parseHeadName(data, floatBits);

        const indexToken = _parseNextToken(data, floatBits);
        let indices = <uint[]>indexToken.value;
        const numUseMaterial: uint = indices[0];
        const numFaces: uint = indices[1];
        indices = indices.slice(2);

        let running = true;
        do {
            const token = _parseNextToken(data, floatBits);
            switch (token.value) {
                case TokenName.OBRACE:
                    _parseNextToken(data, floatBits);
                    _checkForClosingBrace(data, floatBits);
                    break;
                case TokenName.CBRACE:
                    running = false;
                    break;
                case TokenName.MATERIAL:
                    _parseMaterial(data, floatBits);
                    break;
                default:
                    _parseUnknownData(data, floatBits);
                    break;
            }
        } while (running);
    }

    function _parseNextToken(data: ByteArray, floatBits: uint): Token {
        const token = new Token();
        token.type = data.readUint16();

        switch (token.type) {
            case TokenType.NAME:
                token.value = data.readString(ByteArray.StringMode.FIXED_LENGTH, data.readUint32());
                break;
            case TokenType.STRING: {
                token.value = data.readString(ByteArray.StringMode.FIXED_LENGTH, data.readUint32());
                data.position += 2;

                break;
            }
            case TokenType.INTEGER:
                token.value = data.readInt32();
                break;
            case TokenType.GUID: {
                let guid = "";
                for (let i = 0; i < 16; ++i) {
                    const hex = data.readUint8().toString(16);
                    guid += hex.length === 1 ? "0" + hex : hex;
                }
                token.value = guid;

                break;
            }
            case TokenType.INTEGER_LIST: {
                const n = data.readUint32();
                const arr: uint[] = [];
                arr.length = n;
                for (let i = 0; i < n; ++i) arr[i] = data.readUint32();
                token.value = arr;

                break;
            }
            case TokenType.FLOAT_LIST: {
                const n = data.readUint32();
                const arr: number[] = [];
                arr.length = n;
                for (let i = 0; i < n; ++i) arr[i] = _parseFloat(data, floatBits);
                token.value = arr;

                break;
            }
            case TokenType.OBRACE:
                token.value = TokenName.OBRACE;
                break;
            case TokenType.CBRACE:
                token.value = TokenName.CBRACE;
                break;
            case TokenType.TEMPLATE:
                token.value = TokenName.TEMPLATE;
                break;
        }

        return token;
    }

    function _parseFloat(data: ByteArray, floatBits: uint): number {
        if (floatBits === 32) {
            return data.readFloat32();
        } else if (floatBits === 64) {
            return data.readFloat64();
        } else {
            data.position += floatBits / 8;
            return NaN;
        }
    }

    function _parseHeadName(data: ByteArray, floatBits: uint): string {
        let name: string = null;
        let token = _parseNextToken(data, floatBits);
        if (token.type != TokenType.OBRACE) {
            name = <string>token.value;
            token = _parseNextToken(data, floatBits);
            if (token.type != TokenType.OBRACE) console.warn();
        }

        return name;
    }

    function _parseMaterial(data: ByteArray, floatBits: uint): void {
        const name = _parseHeadName(data, floatBits);

        _parseNextToken(data, floatBits);//diffuse rgba, specularExponent, specular rgb, emissive rgb

        let running = true;
        do {
            const token = _parseNextToken(data, floatBits);
            switch (token.value) {
                case TokenName.CBRACE:
                    running = false;
                    break;
                case TokenName.TEXTURE_FILE_NAME:
                    _parseTextureFileName(data, floatBits);
                    break;
                default:
                    _parseUnknownData(data, floatBits);
                    break;
            }
        } while (running);
    }

    function _parseTextureFileName(data: ByteArray, floatBits: uint): void {
        _parseHeadName(data, floatBits);
        _parseNextToken(data, floatBits);
        _checkForClosingBrace(data, floatBits);
    }

    function _parseTemplate(data: ByteArray, floatBits: uint): void {
        while (_parseNextToken(data, floatBits).type != TokenType.CBRACE) {}
    }

    function _parseFrameTransformMatrix(data: ByteArray, floatBits: uint, frame: Frame): void {
        _parseHeadName(data, floatBits);

        const token = _parseNextToken(data, floatBits);
        if (frame && token.type === TokenType.FLOAT_LIST) frame.matrix = new Matrix44().set44FromArray(<number[]>token.value);

        _checkForClosingBrace(data, floatBits);
    }

    function _parseUnknownData(data: ByteArray, floatBits: uint): void {
        while (_parseNextToken(data, floatBits).type != TokenType.OBRACE) {}

        let count: uint = 1;

        do {
            const token = _parseNextToken(data, floatBits);
            if (token.type == TokenType.OBRACE) {
                count++;
            } else if (token.type == TokenType.CBRACE) {
                count--;
            }
        } while (count > 0);
    }

    function _checkForClosingBrace(data: ByteArray, floatBits: uint): void {
        if (_parseNextToken(data, floatBits).type != TokenType.CBRACE) console.warn();
    }
}