namespace Aurora.XFile {
    export const Version = "0.2.0";

    const tmpMat0 = new Matrix44();
    const tmpMat1 = new Matrix44();

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

        R = "R",
        S = "S",
        T = "T",

        OBRACE = '{',
        CBRACE = '}',
        DOT = '.'
    }

    class Token {
        public type: TokenType = null;
        public value: string | int | uint[] | number[] = null;
    }

    class Container {
        public root: Container = null;
        public parent: Container = null;
        public name: string = null;
        public children: Container[] = [];
        public localMatrix = new Matrix44();
        public worldMatrix = new Matrix44();

        public addChild(c: Container): void {
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

    class Animation {
        public name: string = null;
        public frames = new Map<string, Map<number, SkeletonAnimationClip.Frame>>();
    }

    class ParsedData {
        public ticksPerSecond: number = 0;

        public animations: Animation[] = [];

        private _rootContainers: Container[] = [];
        private _containers: Container[] = [];
        private _containersMap: { [key: string]: Container } = {};

        private _skinWeightsMap: SkinWeights[][] = null;

        private _meshes: MeshAsset[] = null;

        public addContainer(c: Container, parent: Container): void {
            if (parent) {
                c.parent = parent;
                parent.addChild(c);
            } else {
                c.root = c;
                this._rootContainers[this._rootContainers.length] = c;
            }
            this._containers[this._containers.length] = c;
            this._containersMap[c.name] = c;
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

            for (let i = 0, n = this._rootContainers.length; i < n; ++i) this._calcWorldMatrix(this._rootContainers[i], null);

            if (this._meshes) {
                const n = this._meshes.length;
                if (n > 0) {
                    const meshes: MeshAsset[] = [];
                    meshes.length = n;
                    for (let i = 0; i < n; ++i) {
                        const asset = this._meshes[i];
                        meshes[i] = asset;

                        const meshNode = this._containersMap[asset.name];

                        if (meshNode) {
                            this._recordExcludeBones(meshNode, excludeBones);

                            /*
                            const vs = asset.getVertexSource(ShaderPredefined.a_Position0);
                            if (vs) {
                                const data = vs.data;
                                if (data) MeshAssetHelper.transformVertices(meshNode.worldMatrix, data, 0, -1, data, 0);
                            }
                            */
                        }

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

                        const bonePreOffsetMatrices: Matrix44[] = [];

                        for (let i = 0, sw: SkinWeights; sw = swArr[i++];) {
                            usedBones[sw.boneName] = true;
                            let boneIdx: uint = bones[sw.boneName];
                            if (boneIdx === undefined) {
                                boneIdx = numBones;
                                bones[sw.boneName] = numBones++;
                                boneNames[boneIdx] = sw.boneName;

                                bonePreOffsetMatrices[boneIdx] = sw.matrix;
                                //bindPreMatrices[boneIdx] = this._containersMap[sw.boneName].worldMatrix.invert(new Matrix44()).append44(sw.matrix);
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

                        numDataPerElement = this._checkAndCombineBindBones(asset.name, skinVertices, numDataPerElement >> 1);

                        asset.boneNames = boneNames;
                        asset.bonePreOffsetMatrices = bonePreOffsetMatrices;

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

            for (let name in usedBones) {
                let b = excludeBones[name];
                if (b !== undefined) {
                    delete excludeBones[name];
                    let f = this._containersMap[name];
                    if (f) {
                        f = f.parent;
                        while (f) {
                            delete excludeBones[f.name];
                            f = f.parent;
                        }
                    }
                }
            }

            const ske = new Skeleton();
            const skeBones = new RefMap<string, Node>();
            ske.bones = skeBones;
            const pose = new Map<string, Matrix44>();
            data.pose = pose;
            const rootBones: { [key: string]: boolean } = {};
            for (let i = 0, n = this._containers.length; i < n; ++i) {
                const c = this._containers[i];
                if (!excludeBones[c.name]) {
                    const bone = new Node();
                    bone.name = c.name;
                    skeBones.insert(c.name, bone);
                    pose.set(c.name, c.localMatrix);

                    if (!rootBones[c.root.name]) {
                        rootBones[c.root.name] = true;
                        ske.rootBoneNames[ske.rootBoneNames.length] = c.root.name;
                    }
                }
            }

            if (ske.bones.size > 0) {
                for (let i = 0, n = ske.rootBoneNames.length; i < n; ++i) {
                    const name = ske.rootBoneNames[i];
                    this._doBoneHierarchy(this._containersMap[name], skeBones.find(name), skeBones);
                }

                data.skeleton = ske;
            }

            if (this.animations.length > 0) {
                const animClips = new RefVector<SkeletonAnimationClip>();
                for (let i = 0, n = this.animations.length; i < n; ++i) {
                    const anim = this.animations[i];

                    let maxTime: number = -1;
                    const frames = new Map<string, SkeletonAnimationClip.Frame[]>();
                    for (let itr of anim.frames) {
                        const boneFramesMap = itr[1];
                        const boneFrames: SkeletonAnimationClip.Frame[] = [];
                        frames.set(itr[0], boneFrames);

                        let n = 0;
                        for (let itr1 of boneFramesMap) {
                            const f = itr1[1];
                            if (maxTime < f.time) maxTime = f.time;
                            boneFrames[n++] = f;
                        }

                        Sort.Merge.sort(boneFrames, (f0: SkeletonAnimationClip.Frame, f1: SkeletonAnimationClip.Frame) => {
                            return f0.time <= f1.time;
                        });

                        SkeletonAnimationClip.supplementLerpFrames(boneFrames);
                    }

                    const clip = new SkeletonAnimationClip();
                    animClips.pushBack(clip);
                    clip.name = anim.name;
                    clip.frames = frames;
                    clip.setTimeRagne(0, Math.max(0, maxTime));
                }
                data.animationClips = animClips;
            }
        }


        private _checkAndCombineBindBones(name: string, skinVertices: number[][], numDataPerElement: uint): uint {
            const maxDataPerElement = 4;

            if (numDataPerElement > maxDataPerElement) {
                numDataPerElement = maxDataPerElement;

                const exceedDataOffset = maxDataPerElement << 1;

                let maxExceedBones = 0;
                const exceedSorted: number[] = [];

                for (let i = 0, numVertices = skinVertices.length; i < numVertices; ++i) {
                    const sv = skinVertices[i];
                    const svLen = sv.length;
                    if (svLen > exceedDataOffset) {
                        const n = svLen >> 1;
                        if (maxExceedBones < n) maxExceedBones = n;

                        if (exceedSorted.length < exceedDataOffset + n) exceedSorted.length = exceedDataOffset + n;
                        for (let j = 0; j < n; ++j) exceedSorted[j + exceedDataOffset] = (j << 1) + 1;

                        Sort.Merge.sort(exceedSorted, (a: number, b: number) => {
                            return sv[a] > sv[b];
                        }, exceedDataOffset, exceedDataOffset + n - 1);

                        let reserveTotalWeights = 0;
                        for (let j = 0; j < numDataPerElement; ++j) reserveTotalWeights += sv[exceedSorted[j + exceedDataOffset]];
                        let abandonTotalWeights = 0;
                        for (let j = numDataPerElement; j < n; ++j) abandonTotalWeights += sv[exceedSorted[j + exceedDataOffset]];

                        for (let j = 0; j < numDataPerElement; ++j) {
                            const idx1 = exceedSorted[j + exceedDataOffset];
                            const idx2 = j << 1;
                            const w = sv[idx1];
                            exceedSorted[idx2] = sv[idx1 - 1];
                            exceedSorted[idx2 + 1] = w + abandonTotalWeights * w / reserveTotalWeights;
                        }

                        for (let j = 0; j < exceedDataOffset; ++j) sv[j] = exceedSorted[j];
                        sv.length = exceedDataOffset;
                    }
                }

                console.warn("warnning: parse mesh(" + name + "), bound " + maxExceedBones + " bones, exceed max " + maxDataPerElement + " bones restriction.");
            }

            return numDataPerElement;
        }

        private _recordExcludeBones(c: Container, excludeBones: { [key: string]: boolean }): void {
            if (c) {
                excludeBones[c.name] = true;
                for (let i = 0, n = c.children.length; i < n; ++i) this._recordExcludeBones(c.children[i], excludeBones);
            }
        }

        private _doBoneHierarchy(parentContainer: Container, parentBone: Node, bones: RefMap<string, Node>): void {
            for (let i = 0, n = parentContainer.children.length; i < n; ++i) {
                const c = parentContainer.children[i];
                const b = bones.find(c.name);
                parentBone.addChild(b);
                this._doBoneHierarchy(c, b, bones);
            }
        }

        private _calcWorldMatrix(c: Container, parent: Container): void {
            if (parent) {
                c.localMatrix.append44(parent.worldMatrix, c.worldMatrix);
            } else {
                c.worldMatrix.set44(c.localMatrix);
            }

            for (let i = 0, n = c.children.length; i < n; ++i) this._calcWorldMatrix(c.children[i], c);
        }
    }

    export class Data extends Ref {
        public meshes: MeshAsset[] = null;
        public pose: Map<string, Matrix44> = null;

        private _skeleton: Skeleton = null;
        private _animationClips: RefVector<SkeletonAnimationClip> = null;

        public get skeleton(): Skeleton {
            return this._skeleton;
        }

        public set skeleton(ske: Skeleton) {
            if (this._skeleton !== ske) {
                if (ske) ske.retain();
                if (this._skeleton) this._skeleton.release();
                this._skeleton = ske;
            }
        }

        public get animationClips(): RefVector<SkeletonAnimationClip> {
            return this._animationClips;
        }

        public set animationClips(clips: RefVector<SkeletonAnimationClip>) {
            if (this._animationClips !== clips) {
                if (clips) clips.retain();
                if (this._animationClips) this._animationClips.release();
                this._animationClips = clips;
            }
        }

        public destroy(): void {
            this.skeleton = null;
            this.animationClips = null;
            this.meshes = null;
            this.pose = null;
        }

        protected _refDestroy(): void {
            this.destroy();
        }
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
                        case TokenName.ANIM_TICKS_PRE_SECOND:
                            parsedData.ticksPerSecond = _parseAnimTicksPerSecond(data, floatBits);
                            break;
                        case TokenName.ANIMATION_SET:
                            _parseAnimationSet(data, floatBits, parsedData);
                            break;
                        default:
                            _parseUnknownData(data, floatBits);
                            break;
                    }
                }

                parsedData.generate(result);
            } else {
                console.error("parse x file error: this is a " + fmt + " format, only support " + FormatType.BIN + " format.");
            }
        } else {
            console.error("parse x file error: unknow format.");
        }

        return result;
    }

    function _parseFrame(data: ByteArray, floatBits: uint, parsedData: ParsedData, parent: Container): void {
        const name =_parseHeadName(data, floatBits);

        const c = new Container();
        c.name = name;
        parsedData.addContainer(c, parent);

        let running = true;
        do {
            const token = _parseNextToken(data, floatBits);
            switch (token.value) {
                case TokenName.CBRACE:
                    running = false;
                    break;
                case TokenName.FRAME:
                    _parseFrame(data, floatBits, parsedData, c);
                    break;
                case TokenName.FRAME_TRANSFORM_MATRIX:
                    _parseFrameTransformMatrix(data, floatBits, c);
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

        _skipClosingBrace(data, floatBits);
    }

    function _parseMeshUVs(data: ByteArray, floatBits: uint, asset: MeshAsset): void {
        _parseHeadName(data, floatBits);
        const numToken = _parseNextToken(data, floatBits);
        const valuesToken = _parseNextToken(data, floatBits);

        asset.addVertexSource(new VertexSource(ShaderPredefined.a_UV0, <number[]>valuesToken.value, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
        
        _skipClosingBrace(data, floatBits);
    }

    function _parseSkinMeshHeader(data: ByteArray, floatBits: uint): void {
        _parseHeadName(data, floatBits);
        _parseNextToken(data, floatBits);
        _skipClosingBrace(data, floatBits);
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

        _skipClosingBrace(data, floatBits);

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
                    _skipClosingBrace(data, floatBits);
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
        _skipClosingBrace(data, floatBits);
    }

    function _parseTemplate(data: ByteArray, floatBits: uint): void {
        while (_parseNextToken(data, floatBits).type != TokenType.CBRACE) {}
    }

    function _parseFrameTransformMatrix(data: ByteArray, floatBits: uint, frame: Container): void {
        _parseHeadName(data, floatBits);

        const token = _parseNextToken(data, floatBits);
        if (frame && token.type === TokenType.FLOAT_LIST) frame.localMatrix.set44FromArray(<number[]>token.value);

        _skipClosingBrace(data, floatBits);
    }

    function _parseAnimTicksPerSecond(data: ByteArray, floatBits: uint): number {
        _parseHeadName(data, floatBits);
        const token = _parseNextToken(data, floatBits);
        _skipClosingBrace(data, floatBits);
        return <number>token.value;
    }

    function _parseAnimationSet(data: ByteArray, floatBits: uint, parsedData: ParsedData): void {
        const name = _parseHeadName(data, floatBits);

        const anim = new Animation();
        anim.name = name;
        parsedData.animations.push(anim);

        let running = true;
        do {
            const token = _parseNextToken(data, floatBits);
            switch (token.value) {
                case TokenName.CBRACE:
                    running = false;
                    break;
                case TokenName.ANIMATION:
                    _parseAnimation(data, floatBits, parsedData.ticksPerSecond, anim);
                    break;
                default:
                    _parseUnknownData(data, floatBits);
                    break;
            }
        } while (running);
    }

    function _parseAnimation(data: ByteArray, floatBits: uint, ticksPerSecond: number, anim: Animation): void {
        _parseHeadName(data, floatBits);

        let boneName: string;

        let running = true;
        do {
            const token = _parseNextToken(data, floatBits);
            switch (token.value) {
                case TokenName.OBRACE: {
                    const boneNameToken = _parseNextToken(data, floatBits);
                    boneName = <string>boneNameToken.value;
                    _skipClosingBrace(data, floatBits);

                    break;
                }
                case TokenName.CBRACE:
                    running = false;
                    break;
                case TokenName.ANIMATION_KEY: {
                    let frames = anim.frames.get(boneName);
                    if (!frames) {
                        frames = new Map();
                        anim.frames.set(boneName, frames);
                    }
                    _parseAnimationKey(data, floatBits, ticksPerSecond, frames);

                    break;
                }
                default:
                    _parseUnknownData(data, floatBits);
                    break;
            }
        } while (running);
    }

    function _parseAnimationKey(data: ByteArray, floatBits: uint, ticksPerSecond: number, frames: Map<number, SkeletonAnimationClip.Frame>): void {
        _parseHeadName(data, floatBits);

        let attribToken = _parseNextToken(data, floatBits);
        const attrib = <int[]>attribToken.value;
        const type = attrib[0];
        const num = attrib[1];
        
        let info = attrib.slice(2);

        for (let i = 0; i < num; ++i) {
            if (info === null) info = <number[]>_parseNextToken(data, floatBits).value;
            const values = <number[]>_parseNextToken(data, floatBits).value;

            const t = info[0] / ticksPerSecond;
            let f = frames.get(t);
            if (!f) {
                f = new SkeletonAnimationClip.Frame();
                f.time = t;
                frames.set(t, f);
            }

            switch (attrib[0]) {
                case 0: //r
                    f.rotation = new Quaternion(-values[1], -values[2], -values[3], values[0]);
                    break;
                case 1: //s
                    f.scale = new Vector3().setFromArray(values);
                    break;
                case 2: //t
                    f.translation = new Vector3().setFromArray(values);
                    break;
                case 4: {//m
                    const scale = new Vector3();

                    tmpMat0.set44FromArray(values);
                    tmpMat0.decomposition(tmpMat1, scale);

                    f.translation = new Vector3(tmpMat0.m30, tmpMat0.m31, tmpMat0.m32);
                    f.rotation = tmpMat1.toQuaternion();
                    f.scale = scale;

                    break;
                }
                default:
                    break;
            }

            info = null;
        }

        _skipClosingBrace(data, floatBits);
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

    function _skipClosingBrace(data: ByteArray, floatBits: uint): void {
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
}