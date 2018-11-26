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

                const templates: { [key: string]: Template } = {};

                while (data.bytesAvailable > 1) {
                    const token = _parseNextToken(data, floatBits);
                    switch (token.value) {
                        case TokenName.TEMPLATE:
                            _parseTemplate(data, floatBits, templates);
                            break;
                        case TokenName.FRAME:
                            _parseFrame(data, floatBits);
                            break;
                        case TokenName.MATERIAL:
                            _parseMaterial(data, floatBits);
                            break;
                        default:
                            _parseUnknownData(data, floatBits);
                            break;
                    }
                }
            } else {

            }
        }

        return result;
    }

    function _parseFrame(data: ByteArray, floatBits: uint): void {
        _parseHead(data, floatBits);

        let running = true;
        do {
            const token = _parseNextToken(data, floatBits);
            switch (token.value) {
                case TokenName.CBRACE:
                    running = false;
                    break;
                case TokenName.FRAME:
                    _parseFrame(data, floatBits);
                    break;
                case TokenName.FRAME_TRANSFORM_MATRIX:
                    _parseFrameTransformMatrix(data, floatBits);
                    break;
                case TokenName.MESH:
                    _parseMesh(data, floatBits);
                    break;
                default:
                    _parseUnknownData(data, floatBits);
                    break;
            }
        } while(running);
    }

    function _parseMesh(data: ByteArray, floatBits: uint): void {
        const name = _parseHead(data, floatBits);

        const asset: MeshAsset = new MeshAsset();
        asset.name = name;

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
                case TokenName.MESH_TEXTURE_COORDS:
                    _parseMeshUVs(data, floatBits, asset);
                    break;
                case TokenName.XSKIN_MESH_HEADER:
                    _parseSkinMeshHeader(data, floatBits);
                    break;
                case TokenName.SKIN_WEIGHTS:
                    _parseSkinWeights(data, floatBits, asset);
                    break;
                case TokenName.MESH_MATERIAL_LIST:
                    _parseMeshMaterialList(data, floatBits);
                    break;
                default:
                    _parseUnknownData(data, floatBits);
                    break;
            }
        } while (running);
    }

    function _parseMeshUVs(data: ByteArray, floatBits: uint, asset: MeshAsset): void {
        _parseHead(data, floatBits);
        const numToken = _parseNextToken(data, floatBits);
        const valuesToken = _parseNextToken(data, floatBits);

        asset.addVertexSource(new VertexSource(ShaderPredefined.a_UV0, <number[]>valuesToken.value, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
        
        _checkForClosingBrace(data, floatBits);
    }

    function _parseSkinMeshHeader(data: ByteArray, floatBits: uint): void {
        _parseHead(data, floatBits);
        _parseNextToken(data, floatBits);
        _checkForClosingBrace(data, floatBits);
    }

    function _parseSkinWeights(data: ByteArray, floatBits: uint, asset: MeshAsset): void {
        _parseHead(data, floatBits);

        /*
        if (skinnedMeshAssets == null) skinnedMeshAssets = {};
        var sma: SkinnedMeshAsset = skinnedMeshAssets[ma.name];
        if (sma == null) {
            sma = new SkinnedMeshAsset();
            skinnedMeshAssets[ma.name] = sma;
            sma.boneNames = new Vector.<String>();
            sma.preOffsetMatrices = {};
            sma.skinnedVertices = new Vector.<SkinnedVertex>(ma.getElement(MeshElementType.VERTEX).values.length / 3);
        }
        */

        const boneNameToken = _parseNextToken(data, floatBits);
        const indicesToken = _parseNextToken(data, floatBits);
        const weightsToken = _parseNextToken(data, floatBits);

        /*
        const indices = <uint[]>indicesToken.value;
        const num: uint = indices.shift();

        const weights = <number[]>weightsToken.value;

        var boneIndex: uint = sma.boneNames.length;
        sma.boneNames[boneIndex] = boneNameToken.value;
        const m = new Matrix44().set44FromArray(weights.slice(weights.length - 16));

        sma.preOffsetMatrices[boneNameToken.value] = m;

        for (let i = 0; i < num; ++i) {
            let index = indices[i];
            var sv: SkinnedVertex = sma.skinnedVertices[index];
            if (sv == null) {
                sv = new SkinnedVertex();
                sv.boneNameIndices = new Vector.<uint>();
                sv.weights = new Vector.<Number>();
                sma.skinnedVertices[index] = sv;
            }

            index = sv.boneNameIndices.length;

            sv.boneNameIndices[index] = boneIndex;
            sv.weights[index] = weights[i];
        }
        */

        _checkForClosingBrace(data, floatBits);
    }

    function _parseMeshMaterialList(data: ByteArray, floatBits: uint): void {
        _parseHead(data, floatBits);

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

                break;
            }
            case TokenType.FLOAT_LIST: {
                const n = data.readUint32();
                const arr: number[] = [];
                arr.length = n;
                for (let i = 0; i < n; ++i) arr[i] = _parseFloat(data, floatBits);

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

    function _parseHead(data: ByteArray, floatBits: uint): string {
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
        const name = _parseHead(data, floatBits);

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
        _parseHead(data, floatBits);
        _parseNextToken(data, floatBits);
        _checkForClosingBrace(data, floatBits);
    }

    function _parseTemplate(data: ByteArray, floatBits: uint, templates: { [key: string]: Template }): void {
        const name = _parseNextToken(data, floatBits);
        _parseNextToken(data, floatBits);
        const guid = _parseNextToken(data, floatBits);

        if (name.value === "MeshFace") {
            let c = 1;
        }

        const members: Template.Member[] = [];

        let member: Template.Member = null;
        let restriction: Template.Restriction = null;

        let memberPart: uint = 0;

        do {
            const token = _parseNextToken(data, floatBits);
            if (token.type === TokenType.CBRACE) {
                break;
            } else if (token.type === TokenType.OBRACKET) {
                let value = "";
                do {
                    let token = _parseNextToken(data, floatBits);
                    if (token.type === TokenType.CBRACKET) {
                        break;
                    } else if (token.type === TokenType.DOT) {
                        value += TokenName.DOT;
                    } else {
                        value += token.value;
                    }
                } while (true);
                restriction = new Template.Restriction(value);
            } else if (token.type === TokenType.SEMICOLON) {
                memberPart = 0;
                if (member) {
                    members[members.length] = member;
                    member = null;
                }
            } else {
                if (memberPart === 0) {
                    
                }
                let a = 1;
            }
        } while (true);

        templates[<string>name.value] = new Template(<string>guid.value, members, restriction);
    }

    function _parseFrameTransformMatrix(data: ByteArray, floatBits: uint): void {
        _parseHead(data, floatBits);
        _parseNextToken(data, floatBits);
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