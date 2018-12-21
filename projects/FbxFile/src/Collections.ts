namespace Aurora.FbxFile {
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

    class SkeletonData {
        public bones: Aurora.Node[] = [];
        public rootBoneIndices: uint[] = [];

        private _numBones = 0;
        private _bonesByName = new Map<string, uint>();
        private _bonesByID = new Map<uint, uint>();

        private _boneIDs: uint[] = [];

        public addBone(bone: Aurora.Node, id: uint): void {
            this.bones[this._numBones] = bone;
            this._boneIDs[this._numBones] = id;
            this._bonesByName.set(bone.name, this._numBones);
            this._bonesByID.set(id, this._numBones);
            ++this._numBones;
        }

        public isRootBone(name: string): boolean {
            return this.rootBoneIndices.indexOf(this._bonesByName.get(name)) >= 0;
        }

        public getBoneByName(name: string): Aurora.Node {
            return this.bones[this._bonesByName.get(name)];
        }

        public getIndexByName(name: string): int {
            return this._bonesByName.has(name) ? this._bonesByName.get(name) : -1;
        }

        public finish(collections: Collections): void {
            for (let i = 0, n = this._numBones; i < n; ++i) {
                const bone = this.bones[i];
                const m = collections.findConnectionParent(this._boneIDs[i], NodeName.MODEL);
                if (m) {
                    this.bones[this._bonesByID.get(m.id)].addChild(bone);
                } else {
                    this.rootBoneIndices.push(i);
                }
            }
        }
    }

    class Connection {
        public readonly id: uint;
        public readonly relationship: string;

        constructor(id: uint, relationship: string) {
            this.id = id;
            this.relationship = relationship === undefined ? null : relationship;
        }
    }

    export class Collections {
        private _animationStacks: Node[] = null;
        private _models: Node[] = null;
        private _poses: Node[] = null;

        private _objects = new Map<uint, Node>();
        private _parentsMap = new Map<uint, Connection[]>();
        private _childrenMap = new Map<uint, Connection[]>();

        private _posesMap = new Map<uint, Matrix44>();

        private _globalSettings: Node = null;

        private _upAxis: int = 2;
        private _upAxisSign: int = 1;
        private _frontAxis: int = 1;
        private _frontAxisSign: int = 1;
        private _coordAxis: int = 0;
        private _coordAxisSign: int = 1;
        private _originUpAxis: int = 2;
        private _originUpAxisSign: int = 1;

        private _bbb: Node[] = [];

        public addNode(node: Node): void {
            switch (node.name) {
                case NodeName.ANIMATION_STACK: {
                    this._objects.set(node.id, node);
                    (this._animationStacks || (this._animationStacks = [])).push(node);

                    break;
                }
                case NodeName.ANIMATION_LAYER:
                case NodeName.ANIMATION_CURVE_NODE:
                case NodeName.ANIMATION_CURVE:
                case NodeName.GEOMETRY:
                case NodeName.DEFORMER:
                    this._objects.set(node.id, node);
                    break;
                case NodeName.MODEL: {
                    this._objects.set(node.id, node);
                    (this._models || (this._models = [])).push(node);
                                  
                    break;
                }
                case NodeName.POSE: {
                    this._objects.set(node.id, node);
                    (this._poses || (this._poses = [])).push(node);

                    break;
                }
                case NodeName.P: {
                    if (node.properties && node.properties.length > 0 && node.properties[0].type === NodePropertyValueType.STRING && (<string>(node.properties[0].value)).indexOf("Geometric") >= 0) {
                        this._bbb.push(node);
                    }
                    break;
                }
                case NodeName.C:
                case NodeName.CONNECTIONS: {
                    const properties = node.properties;
                    if (properties && properties.length > 2) {
                        const curID = <int>properties[1].value;
                        if (curID !== 0) {
                            const parentID = <int>properties[2].value;

                            let relationship: string = null;
                            if (properties.length > 3) {
                                const p = properties[3];
                                if (p.type === NodePropertyValueType.STRING) relationship = <string>p.value;
                            }

                            let c = new Connection(curID, relationship);
                            const children: Connection[] = this._childrenMap.get(parentID);
                            if (children) {
                                children.push(c);
                            } else {
                                this._childrenMap.set(parentID, [c]);
                            }

                            c = new Connection(parentID, relationship);
                            const parents: Connection[] = this._parentsMap.get(curID);
                            if (parents) {
                                parents.push(c);
                            } else {
                                this._parentsMap.set(curID, [c]);
                            }
                        }
                    }
                    
                    break;
                }
                case NodeName.GLOBAL_SETTINGS:
                    this._globalSettings = node;
                    break;
                default:
                    break;
            }
        }

        public getNode(id: uint): Node {
            const node = this._objects.get(id);
            return node ? node : null;
        }

        public getConnectionChildren(id: uint): Connection[] {
            const children = this._childrenMap.get(id);
            return children ? children : null;
        }

        public getConnectionParents(id: uint): Connection[] {
            const parents = this._parentsMap.get(id);
            return parents ? parents : null;
        }

        public parse(): Data {
            this._parseGlobalSettings();

            const result = new Data();

            let meshes: Node[] = null;
            let skeData: SkeletonData = null;

            if (this._poses) {
                for (let i = 0, n0 = this._poses.length; i < n0; ++i) {
                    const pose = this._poses[i];
                    for (let j = 0, n1 = pose.children.length; j < n1; ++j) {
                        const poseNode = pose.children[j];
                        if (poseNode.name === NodeName.POSE_NODE) {
                            let id: uint = 0;
                            let matrix: Matrix44 = null;
                            for (let k = 0, n2 = poseNode.children.length; k < n2; ++k) {
                                const node = poseNode.children[k];
                                switch (node.name) {
                                    case NodeName.NODE: {
                                        const p = node.properties[0];
                                        if (p && p.type === NodePropertyValueType.INT) id = <uint>p.value;

                                        break;
                                    }
                                    case NodeName.MATRIX:
                                        matrix = this._getPropertyMatrix(node);
                                        break;
                                    default:
                                        break;
                                }
                            }

                            if (id !== 0 && matrix) this._posesMap.set(id, matrix);
                        }
                    }
                }
            }

            let bonePose: Map<string, Matrix44> = null;

            if (this._models) {
                bonePose = new Map();

                for (let i = 0, n = this._models.length; i < n; ++i) {
                    const m = this._models[i];

                    switch (m.attribType) {
                        case NodeAttribValue.MESH:
                            (meshes || (meshes = [])).push(m);
                            break;
                        case NodeAttribValue.LIMB_NODE:
                        case NodeAttribValue.ROOT: {
                            const bone = new Aurora.Node();
                            bone.name = m.attribName;

                            const p70 = m.getChildByName(NodeName.PROPERTIES70);
                            bonePose.set(bone.name, this._parseMatrixFromP70(p70));

                            if (!skeData) skeData = new SkeletonData();
                            skeData.addBone(bone, m.id);

                            break;
                        }
                        default:
                            break;
                    }
                }
            }

            if (skeData) {
                skeData.finish(this);

                const ske = new Skeleton();
                for (let i = 0, n = skeData.bones.length; i < n; ++i) {
                    const bone = skeData.bones[i];
                    if (bonePose) this._transformMatrixXZY(bonePose.get(bone.name));
                    ske.addBone(bone);
                }
                for (let i = 0, n = skeData.rootBoneIndices.length; i < n; ++i) ske.rootBoneNames[i] = skeData.bones[skeData.rootBoneIndices[i]].name;
                ske.setPose(bonePose);
                result.skeleton = ske;
                result.pose = bonePose;

                const animationClips = this._parseAnimations(skeData);

                if (animationClips) {
                    result.animationClips = animationClips;

                    const clipsRaw = animationClips.raw;

                    for (let i = 0, n = clipsRaw.length; i < n; ++i) {
                        const clip = clipsRaw[i];
                        if (!clip) continue;

                        const frames = clip.frames;
                        if (!frames) continue;

                        for (let itr of frames) {
                            const isRoot = skeData.isRootBone(itr[0]);
                            const boneFrames = itr[1].frames;
                            for (let j = 0, n = boneFrames.length; j < n; ++j) {
                                const f = boneFrames[j];
                                if (!f) continue;

                                if (f.rotation) {
                                    f.rotation.x = -f.rotation.x;
                                    const tmp = f.rotation.y;
                                    f.rotation.y = -f.rotation.z;
                                    f.rotation.z = -tmp;
                                }

                                if (f.scale) {
                                    const tmp = f.scale.y;
                                    f.scale.y = f.scale.z;
                                    f.scale.z = tmp;
                                }

                                if (this._upAxis === 1) {
                                    if (isRoot) {
                                        if (f.translation) f.translation.z = -f.translation.z;
                                    } else {
                                        if (f.translation) {
                                            const tmp = f.translation.y;
                                            f.translation.y = f.translation.z;
                                            f.translation.z = tmp;
                                        }
                                    }
                                } else if (this._upAxis === 2) {
                                    if (f.translation) {
                                        const tmp = f.translation.y;
                                        f.translation.y = f.translation.z;
                                        f.translation.z = tmp;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (meshes) {
                for (let i = 0, n = meshes.length; i < n; ++i) {
                    const asset = this._parseGeometry(meshes[i], skeData);
                    if (asset) {
                        (result.meshes || (result.meshes = [])).push(asset);

                        this._transformVertexSourceXZY(asset.getVertexSource(ShaderPredefined.a_Position0));
                        this._transformVertexSourceXZY(asset.getVertexSource(ShaderPredefined.a_Normal0));
                        this._transformVertexSourceXZY(asset.getVertexSource(ShaderPredefined.a_Tangent0));
                        this._transformVertexSourceXZY(asset.getVertexSource(ShaderPredefined.a_Binormal0));
                        this._transformMatricesXZY(asset.bonePreOffsetMatrices);
                        this._transformMatricesXZY(asset.bonePostOffsetMatrices);
                        asset.bonePostOffsetMatrices = null;

                        asset.drawIndexSource.invert();
                    }
                }
            }

            return result;
        }

        public findConnectionChild(id: uint, name: NodeName, attribType: string = null): Connection {
            const children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const c = children[i];
                    const o = this._objects.get(c.id);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) return c;
                }
            }
            return null;
        }

        public findConnectionChildNode(id: uint, name: NodeName, attribType: string = null): Node {
            const children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const o = this._objects.get(children[i].id);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) return o;
                }
            }
            return null;
        }

        public findConnectionChildren(id: uint, name: NodeName, attribType: string = null): Connection[] {
            let arr: Connection[] = null;
            const children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const c = children[i];
                    const o = this._objects.get(c.id);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) (arr || (arr = [])).push(c);
                }
            }
            return arr;
        }

        public findConnectionChildrenNodes(id: uint, name: NodeName, attribType: string = null): Node[] {
            let arr: Node[] = null;
            const children = this._childrenMap.get(id);
            if (children) {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const o = this._objects.get(children[i].id);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) (arr || (arr = [])).push(o);
                }
            }
            return arr;
        }

        public findConnectionParent(id: uint, name: NodeName, attribType: string = null): Connection {
            const parents = this._parentsMap.get(id);
            if (parents) {
                for (let i = 0, n = parents.length; i < n; ++i) {
                    const c = parents[i];
                    const o = this._objects.get(c.id);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) return c;
                }
            }
            return null;
        }

        public findConnectionParentNode(id: uint, name: NodeName, attribType: string = null): Node {
            const parents = this._parentsMap.get(id);
            if (parents) {
                for (let i = 0, n = parents.length; i < n; ++i) {
                    const o = this._objects.get(parents[i].id);
                    if (o && o.name === name && (!attribType || attribType === o.attribType)) return o;
                }
            }
            return null;
        }

        private _getPropertyValue<T>(node: Node, type: NodePropertyValueType): T {
            if (node.properties.length > 0) {
                const p = node.properties[0];
                if (p.type === type) return <T><any>p.value;
            }
            return null;
        }

        private _getPropertyMatrix(node: Node): Matrix44 {
            if (node.properties.length > 0) {
                const p = node.properties[0];
                if (p.type === NodePropertyValueType.NUMBER_ARRAY) {
                    const values = <number[]>p.value;
                    return new Matrix44(
                        values[0], values[1], values[2], values[3],
                        values[4], values[5], values[6], values[7],
                        values[8], values[9], values[10], values[11],
                        values[12], values[13], values[14], values[15]
                    );
                }
            }
            return null;
        }

        private _getOrCreateFrame(map: Map<number, SkeletonAnimationClip.Frame>, time: number): SkeletonAnimationClip.Frame {
            let frame = map.get(time);
            if (!frame) {
                frame = new SkeletonAnimationClip.Frame();
                frame.time = time;
                map.set(time, frame);
            }
            return frame;
        }

        private _parseGlobalSettings(): void {
            if (this._globalSettings) {
                const p70 = this._globalSettings.getChildByName(NodeName.PROPERTIES70);
                if (p70) {
                    for (let i = 0, n = p70.children.length; i < n; ++i) {
                        const child = p70.children[i];
                        if (child.name !== NodeName.P) continue;

                        const properties = child.properties;
                        if (!properties) continue;

                        const len = properties.length;
                        if (len === 0) continue;

                        const p = properties[0];
                        if (p.type === NodePropertyValueType.STRING) {
                            switch (p.value) {
                                case NodePropertyValue.UP_AXIS:
                                    this._upAxis = <int>properties[len - 1].value;
                                    break;
                                case NodePropertyValue.UP_AXIS_SIGN:
                                    this._upAxisSign = <int>properties[len - 1].value;
                                    break;
                                case NodePropertyValue.FRONT_AXIS:
                                    this._frontAxis = <int>properties[len - 1].value;
                                    break;
                                case NodePropertyValue.FRONT_AXIS_SIGN:
                                    this._frontAxisSign = <int>properties[len - 1].value;
                                    break;
                                case NodePropertyValue.COORD_AXIS:
                                    this._coordAxis = <int>properties[len - 1].value;
                                    break;
                                case NodePropertyValue.COORD_AXIS_SIGN:
                                    this._coordAxisSign = <int>properties[len - 1].value;
                                    break;
                                case NodePropertyValue.ORIGIN_UP_AXIS:
                                    this._originUpAxis = <int>properties[len - 1].value;
                                    break;
                                case NodePropertyValue.ORIGIN_UP_AXIS_SIGN:
                                    this._originUpAxisSign = <int>properties[len - 1].value;
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
            }
        }

        private _parseAnimations(skeleton: SkeletonData): RefVector<SkeletonAnimationClip>  {
            let clips: RefVector<SkeletonAnimationClip> = null;

            if (this._animationStacks) {
                const framesMap = new Map<string, Map<number, SkeletonAnimationClip.Frame>>();
                const rots: Quaternion[] = [];
                let numRots: uint = 0;

                for (let i0 = 0, n0 = this._animationStacks.length; i0 < n0; ++i0) {
                    const stack = this._animationStacks[i0];

                    let start: number = 0, end: number = -1;

                    const p70 = stack.getChildByName(NodeName.PROPERTIES70);
                    for (let i1 = 0, n1 = p70.children.length; i1 < n1; ++i1) {
                        const c = p70.children[i1];
                        if (c.name === NodeName.P && c.properties && c.properties.length > 0) {
                            const p = c.properties[0];
                            if (p.type === NodePropertyValueType.STRING) {
                                switch (p.value) {
                                    case NodePropertyValue.LOCAL_START:
                                        start = this._parseTime(<int>c.properties[c.properties.length - 1].value);
                                        break;
                                    case NodePropertyValue.LOCAL_STOP:
                                        end = this._parseTime(<int>c.properties[c.properties.length - 1].value);
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }

                    const layers = this.findConnectionChildrenNodes(stack.id, NodeName.ANIMATION_LAYER);
                    if (!layers) continue;

                    for (let i1 = 0, n1 = layers.length; i1 < n1; ++i1) {
                        const layer = layers[i1];
                        const curveNodes = this.findConnectionChildrenNodes(layer.id, NodeName.ANIMATION_CURVE_NODE);
                        if (!curveNodes) continue;

                        for (let i2 = 0, n2 = curveNodes.length; i2 < n2; ++i2) {
                            const curveNode = curveNodes[i2];
                            const attribName = curveNode.attribName;//R,T,S,DeformPercent?
                            const bone = this.findConnectionParentNode(curveNode.id, NodeName.MODEL);
                            if (!bone) continue;
                            
                            const curves = this.findConnectionChildren(curveNode.id, NodeName.ANIMATION_CURVE);
                            if (!curves) continue;

                            for (let i3 = 0, n3 = curves.length; i3 < n3; ++i3) {
                                const c = curves[i3];
                                const curve = this._objects.get(c.id);

                                const relationship = c.relationship;
                                if (!relationship) continue;

                                let times: number[] = null;
                                let values: number[] = null;
                                for (let i = 0, n = curve.children.length; i < n; ++i) {
                                    const child = curve.children[i];
                                    switch (child.name) {
                                        case NodeName.KEY_TIME:
                                            times = this._getPropertyValue<uint[]>(child, NodePropertyValueType.INT_ARRAY);
                                            break;
                                        case NodeName.KEY_VALUE_FLOAT:
                                            values = this._getPropertyValue<number[]>(child, NodePropertyValueType.NUMBER_ARRAY);
                                            break;
                                        default:
                                            break;
                                    }
                                }

                                if (times && values) {
                                    times = times.concat();
                                    for (let j = 0, m = times.length; j < m; ++j) times[j] = this._parseTime(times[j]);

                                    let boneFramesMap = framesMap.get(bone.attribName);
                                    if (!boneFramesMap) {
                                        boneFramesMap = new Map<number, SkeletonAnimationClip.Frame>();
                                        framesMap.set(bone.attribName, boneFramesMap);
                                    }
                                    switch (attribName) {
                                        case NodeAttribValue.T: {
                                            switch (relationship) {
                                                case NodePropertyValue.D_X: {
                                                    for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                        const f = this._getOrCreateFrame(boneFramesMap, times[k]);
                                                        if (!f.translation) f.translation = new Vector3(NaN, NaN, NaN);
                                                        f.translation.x = values[k];
                                                    }

                                                    break;
                                                }
                                                case NodePropertyValue.D_Y: {
                                                    for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                        const f = this._getOrCreateFrame(boneFramesMap, times[k]);
                                                        if (!f.translation) f.translation = new Vector3(NaN, NaN, NaN);
                                                        f.translation.y = values[k];
                                                    }

                                                    break;
                                                }
                                                case NodePropertyValue.D_Z: {
                                                    for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                        const f = this._getOrCreateFrame(boneFramesMap, times[k]);
                                                        if (!f.translation) f.translation = new Vector3(NaN, NaN, NaN);
                                                        f.translation.z = values[k];
                                                    }

                                                    break;
                                                }
                                                default:
                                                    break;
                                            }

                                            break;
                                        }
                                        case NodeAttribValue.R: {
                                            switch (relationship) {
                                                case NodePropertyValue.D_X: {
                                                    for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                        const f = this._getOrCreateFrame(boneFramesMap, times[k]);
                                                        if (!f.rotation) {
                                                            const q = new Quaternion(NaN, NaN, NaN, 1);
                                                            f.rotation = q;
                                                            rots[numRots++] = q;
                                                        }
                                                        f.rotation.x = values[k] * MathUtils.DEG_2_RAD;
                                                    }

                                                    break;
                                                }
                                                case NodePropertyValue.D_Y: {
                                                    for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                        const f = this._getOrCreateFrame(boneFramesMap, times[k]);
                                                        if (!f.rotation) {
                                                            const q = new Quaternion(NaN, NaN, NaN, 1);
                                                            f.rotation = q;
                                                            rots[numRots++] = q;
                                                        }
                                                        f.rotation.y = values[k] * MathUtils.DEG_2_RAD;
                                                    }

                                                    break;
                                                }
                                                case NodePropertyValue.D_Z: {
                                                    for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                        const f = this._getOrCreateFrame(boneFramesMap, times[k]);
                                                        if (!f.rotation) {
                                                            const q = new Quaternion(NaN, NaN, NaN, 1);
                                                            f.rotation = q;
                                                            rots[numRots++] = q;
                                                        }
                                                        f.rotation.z = values[k] * MathUtils.DEG_2_RAD;
                                                    }

                                                    break;
                                                }
                                                default:
                                                    break;
                                            }

                                            break;
                                        }
                                        case NodeAttribValue.S: {
                                            switch (relationship) {
                                                case NodePropertyValue.D_X: {
                                                    for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                        const f = this._getOrCreateFrame(boneFramesMap, times[k]);
                                                        if (!f.scale) f.scale = new Vector3(NaN, NaN, NaN);
                                                        f.scale.x = values[k];
                                                    }

                                                    break;
                                                }
                                                case NodePropertyValue.D_Y: {
                                                    for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                        const f = this._getOrCreateFrame(boneFramesMap, times[k]);
                                                        if (!f.scale) f.scale = new Vector3(NaN, NaN, NaN);
                                                        f.scale.y = values[k];
                                                    }

                                                    break;
                                                }
                                                case NodePropertyValue.D_Z: {
                                                    for (let k = 0, numFrames = times.length; k < numFrames; ++k) {
                                                        const f = this._getOrCreateFrame(boneFramesMap, times[k]);
                                                        if (!f.scale) f.scale = new Vector3(NaN, NaN, NaN);
                                                        f.scale.z = values[k];
                                                    }

                                                    break;
                                                }
                                                default:
                                                    break;
                                            }

                                            break;
                                        }
                                        default:
                                            break;
                                    }

                                    //console.log(bone.attribName + "    " + attribName + "    " + relationship);
                                    //console.log(values);
                                }
                            }
                        }
                    }

                    for (let i = 0, q: Quaternion; q = rots[i++];) Quaternion.createFromEulerXYZ(q.x, q.y, q.z, q);
                    rots.length = 0;

                    const frames = new Map<string, SkeletonAnimationClip.BoneFrames>();
                    let maxTime: number = -1;
                    for (let itr of framesMap) {
                        const boneName = itr[0];
                        const boneFramesMap = itr[1];
                        const boneFrames = new SkeletonAnimationClip.BoneFrames();
                        frames.set(boneName, boneFrames);
                        const bone = skeleton.getBoneByName(boneName);
                        const m = bone ? bone.readonlyLocalMatrix : null;
                        let n = 0;
                        for (let itr1 of boneFramesMap) {
                            const f = itr1[1];
                            if (maxTime < f.time) maxTime = f.time;
                            if (m) {
                                if (!f.translation) f.translation = new Vector3(m.m30, m.m31, m.m32);
                                if (!f.rotation) f.rotation = bone.readonlyLocalRotation.clone();
                                if (!f.scale) f.scale = bone.readonlyLocalScale.clone();
                            }
                            boneFrames.frames[n++] = f;
                        }

                        Sort.Merge.sort(boneFrames.frames, (f0: SkeletonAnimationClip.Frame, f1: SkeletonAnimationClip.Frame) => {
                            return f0.time <= f1.time;
                        });

                        boneFrames.supplementLerpFrames();
                        boneFrames.calcEquantInterval();
                    }

                    const clip = new SkeletonAnimationClip();
                    (clips || (clips = new RefVector())).pushBack(clip);
                    clip.name = stack.attribName;
                    clip.frames = frames;
                    clip.setTimeRagne(start, end < 0 ? Math.max(0, maxTime) : end);
                }
            }

            return clips;
        }

        private _parseTime(time: int): number {
            return time / 46186158000;
        }

        private _parseGeometry(model: Node, skeleton: SkeletonData): MeshAsset {
            const geometry = this.findConnectionChildNode(model.id, NodeName.GEOMETRY);
            if (!geometry) return null;

            const sourceIndices: uint[] = [], faces: uint[] = [];
            let needTriangulate = false;
            const child = geometry.getChildByName(NodeName.POLYGON_VERTEX_INDEX);
            if (child) needTriangulate = this._parsePolygonVertexIndex(child, sourceIndices, faces);

            if (sourceIndices.length > 0) {
                const asset = new MeshAsset();
                asset.name = model.attribName;
                let vertIdxMapping: uint[] = null;
                let numSourceVertices = 0;

                for (let i = 0, n = geometry.children.length; i < n; ++i) {
                    const child = geometry.children[i];
                    switch (child.name) {
                        case NodeName.VERTICES: {
                            const rst = this._parseVertices(child, sourceIndices, asset);
                            if (rst) {
                                vertIdxMapping = rst[0];
                                numSourceVertices = rst[1];
                            }

                            break;
                        }
                        case NodeName.LAYER_ELEMENT_NORMAL:
                            this._parseNormals(child, sourceIndices, asset, NodeName.NORMALS, ShaderPredefined.a_Normal0);
                            break;
                        case NodeName.LAYER_ELEMENT_TANGENT:
                            this._parseNormals(child, sourceIndices, asset, NodeName.TANGENT, ShaderPredefined.a_Tangent0);
                            break;
                        case NodeName.LAYER_ELEMENT_BINORMAL:
                            this._parseNormals(child, sourceIndices, asset, NodeName.BINORMALS, ShaderPredefined.a_Binormal0);
                            break;
                        case NodeName.LAYER_ELEMENT_UV:
                            this._parseUVs(child, sourceIndices, asset);
                            break;
                        default:
                            break;
                    }
                }

                if (asset.name === "Matuge_Main") {
                    let a = 1;
                }

                const bindShapeMatrix = this._parseBindShapeMatrixFromP70(model.getChildByName(NodeName.PROPERTIES70));

                /*
                const p70 = model.getChildByName(NodeName.PROPERTIES70);
                if (p70) {
                    const vs = asset.getVertexSource(ShaderPredefined.a_Position0);
                    if (vs) {
                        const m = this._parseMatrixFromP70(p70);
                        const p = new Vector3();
                        const data = vs.data;
                        for (let i = 0, n = data.length; i < n; i += 3) {
                            const x = data[i];
                            const y = data[i + 1];
                            const z = data[i + 2];
                            m.transform34XYZ(x, y, z, p);
                            data[i] = p.x;
                            data[i + 1] = p.y;
                            data[i + 2] = p.z;
                        }
                    }
                }
                */

                

                this._parseSkin(geometry, model, bindShapeMatrix, asset, skeleton, vertIdxMapping, numSourceVertices);

                if (needTriangulate) asset.drawIndexSource.triangulate(faces);

                return asset;
            }
            return null;
        }

        private _transformVertexSourceXY_Z(vs: VertexSource): void {
            if (vs) {
                const data = vs.data;
                for (let i = 2, n = data.length; i < n; i += 3) {
                    data[i] = -data[i];
                }
            }
        }

        private _transformVertexSourceXZY(vs: VertexSource): void {
            if (vs) {
                const data = vs.data;
                for (let i = 0, n = data.length; i < n; i += 3) {
                    const tmp = data[i + 1];
                    data[i + 1] = data[i + 2];
                    data[i + 2] = tmp;
                }
            }
        }

        private _transformMatricesXY_Z(matrices: Matrix44[]): void {
            if (matrices) {
                for (let i = 0, n = matrices.length; i < n; ++i) {
                    const m = matrices[i];
                    if (!m) continue;

                    m.m02 = -m.m02;
                    m.m12 = -m.m12;
                    m.m20 = -m.m20;
                    m.m21 = -m.m21;
                    m.m22 = -m.m22;
                    m.m32 - -m.m32;
                }
            }
        }

        private _transformMatricesXZY(matrices: Matrix44[]): void {
            if (matrices) {
                for (let i = 0, n = matrices.length; i < n; ++i) this._transformMatrixXZY(matrices[i]);
            }
        }

        private _transformMatrixXZY(m: Matrix44): void {
            if (m) {
                let tmp = m.m10;
                m.m10 = m.m20;
                m.m20 = tmp;

                tmp = m.m01;
                m.m01 = m.m02;
                m.m02 = tmp;

                tmp = m.m11;
                m.m11 = m.m22;
                m.m22 = tmp;

                tmp = m.m21;
                m.m21 = m.m12;
                m.m12 = tmp;

                tmp = m.m31;
                m.m31 = m.m32;
                m.m32 = tmp;

                tmp = m.m13;
                m.m13 = m.m23;
                m.m23 = tmp;
            }
        }

        private _parseBindShapeMatrixFromP70(p70: Node): Matrix44 {
            let translation: Vector3 = null;
            let rotation: Quaternion = null;
            let scale: Vector3 = null;

            if (p70) {
                for (let i = 0, n = p70.children.length; i < n; ++i) {
                    const child = p70.children[i];
                    if (child.name !== NodeName.P) continue;

                    const properties = child.properties;
                    if (!properties) continue;

                    const len = properties.length;
                    if (len === 0) continue;

                    const p = properties[0];
                    if (p.type === NodePropertyValueType.STRING) {
                        switch (p.value) {
                            case NodePropertyValue.GEOMETRIC_TRANSLATION: {
                                const x = <number>properties[len - 3].value;
                                const y = <number>properties[len - 2].value;
                                const z = <number>properties[len - 1].value;

                                translation = new Vector3(x, y, z);

                                break;
                            }
                            case NodePropertyValue.GEOMETRIC_ROTATION: {
                                const x = <number>properties[len - 3].value;
                                const y = <number>properties[len - 2].value;
                                const z = <number>properties[len - 1].value;

                                rotation = Quaternion.createFromEulerXYZ(x * MathUtils.DEG_2_RAD, y * MathUtils.DEG_2_RAD, z * MathUtils.DEG_2_RAD);

                                break;
                            }
                            case NodePropertyValue.GEOMETRIC_SCALING: {
                                const x = <number>properties[len - 3].value;
                                const y = <number>properties[len - 2].value;
                                const z = <number>properties[len - 1].value;

                                scale = new Vector3(x, y, z);

                                break;
                            }
                            default:
                                break;
                        }
                    }
                }
            }

            return Matrix44.createTRS(translation, rotation, scale);
        }

        private _parseMatrixFromP70(p70: Node): Matrix44 {
            let translation: Vector3 = null;
            let preRotation: Quaternion = null;
            let rotation: Quaternion = null;
            let scale: Vector3 = null;

            if (p70) {
                for (let i = 0, n = p70.children.length; i < n; ++i) {
                    const child = p70.children[i];
                    if (child.name !== NodeName.P) continue;

                    const properties = child.properties;
                    if (!properties) continue;

                    const len = properties.length;
                    if (len === 0) continue;

                    const p = properties[0];
                    if (p.type === NodePropertyValueType.STRING) {
                        switch (p.value) {
                            case NodePropertyValue.INHERIT_TYPE:
                                const type = <int>properties[len - 1].value;
                                break;
                            case NodePropertyValue.LCL_TRANSLATION: {
                                const x = <number>properties[len - 3].value;
                                const y = <number>properties[len - 2].value;
                                const z = <number>properties[len - 1].value;

                                translation = new Vector3(x, y, z);

                                break;
                            }
                            case NodePropertyValue.LCL_ROTATION: {
                                const x = <number>properties[len - 3].value;
                                const y = <number>properties[len - 2].value;
                                const z = <number>properties[len - 1].value;

                                rotation = Quaternion.createFromEulerXYZ(x * MathUtils.DEG_2_RAD, y * MathUtils.DEG_2_RAD, z * MathUtils.DEG_2_RAD);

                                break;
                            }
                            case NodePropertyValue.PPE_ROTATION: {
                                const x = <number>properties[len - 3].value;
                                const y = <number>properties[len - 2].value;
                                const z = <number>properties[len - 1].value;

                                preRotation = Quaternion.createFromEulerXYZ(x * MathUtils.DEG_2_RAD, y * MathUtils.DEG_2_RAD, z * MathUtils.DEG_2_RAD);

                                break;
                            }
                            case NodePropertyValue.LCL_SCALING: {
                                const x = <number>properties[len - 3].value;
                                const y = <number>properties[len - 2].value;
                                const z = <number>properties[len - 1].value;

                                scale = new Vector3(x, y, z);

                                break;
                            }
                            default:
                                break;
                        }
                    }
                }
            }

            let m = Matrix44.createTRS(translation, rotation, scale);
            if (preRotation) m = preRotation.toMatrix33().append34(m);

            return m;
        }

        private _parseSkin(geometry: Node, model: Node, bindShapeMatrix: Matrix44, asset: MeshAsset, skeleton: SkeletonData, vertIdxMapping: uint[], numSourceVertices: uint): void {
            const skins = this.findConnectionChildrenNodes(geometry.id, NodeName.DEFORMER, NodeAttribValue.SKIN);
            if (skins) {
                const skinData: number[][] = [];
                skinData.length = numSourceVertices;
                asset.boneNames = [];
                const usedBones: { [key: string]: uint } = {};
                for (let i = 0, n = skins.length; i < n; ++i) {
                    const clusters = this.findConnectionChildrenNodes(skins[i].id, NodeName.DEFORMER, NodeAttribValue.CLUSTER);
                    if (!clusters) continue;
                    for (let j = 0, m = clusters.length; j < m; ++j) this._parseCluster(asset, model, bindShapeMatrix, clusters[j], skeleton, skinData, usedBones);
                }

                const numVertIdxMapping = vertIdxMapping.length;
                const len = numVertIdxMapping << 2;
                const boneIndices: uint[] = [];
                boneIndices.length = len;
                const boneWeights: number[] = [];
                boneWeights.length = len;

                const maxDataPerElement = 4;
                const exceedDataOffset = maxDataPerElement << 1;
                let numDataPerElement = 0;
                for (let i = 0; i < numSourceVertices; ++i) {
                    const data = skinData[i];
                    if (data) {
                        let n = data.length >> 1;
                        if (n > maxDataPerElement) n = maxDataPerElement;
                        if (numDataPerElement < n) numDataPerElement = n;
                    }
                }

                if (numDataPerElement > maxDataPerElement) numDataPerElement = maxDataPerElement;

                let maxExceedBones = 0;
                const exceedSorted: number[] = [];
                for (let i = 0; i < numVertIdxMapping; ++i) {
                    const idx = i * numDataPerElement;
                    let data = skinData[vertIdxMapping[i]];
                    let j = 0;
                    if (data) {
                        const dataLen = data.length;
                        let n = dataLen >> 1;
                        if (n > maxDataPerElement) {
                            if (exceedSorted.length < exceedDataOffset + n) exceedSorted.length = exceedDataOffset + n;
                            for (let j = 0; j < n; ++j) exceedSorted[j + exceedDataOffset] = (j << 1) + 1;
                            
                            Sort.Merge.sort(exceedSorted, (a: number, b: number) => {
                                return data[a] > data[b];
                            }, exceedDataOffset, exceedDataOffset + n - 1);

                            let reserveTotalWeights = 0;
                            for (let j = 0; j < numDataPerElement; ++j) reserveTotalWeights += data[exceedSorted[j + exceedDataOffset]];
                            let abandonTotalWeights = 0;
                            for (let j = numDataPerElement; j < n; ++j) abandonTotalWeights += data[exceedSorted[j + exceedDataOffset]];

                            for (let j = 0; j < numDataPerElement; ++j) {
                                const idx1 = exceedSorted[j + exceedDataOffset];
                                const idx2 = j << 1;
                                const w = data[idx1];
                                exceedSorted[idx2] = data[idx1 - 1];
                                exceedSorted[idx2 + 1] = w + abandonTotalWeights * w / reserveTotalWeights;
                            }

                            data = exceedSorted;

                            if (maxExceedBones < n) maxExceedBones = n;
                            n = maxDataPerElement;
                        }
                        for (; j < n; ++j) {
                            const idx1 = idx + j;
                            let idx2 = j << 1;
                            boneIndices[idx1] = data[idx2];
                            boneWeights[idx1] = data[++idx2];
                        }
                    }

                    for (; j < numDataPerElement; ++j) {
                        const idx1 = idx + j;
                        boneIndices[idx1] = 0;
                        boneWeights[idx1] = 0;
                    }
                }

                if (maxExceedBones > 0) console.warn("warnning: parse mesh(" + model.attribName + "), bound " + maxExceedBones + " bones, exceed max " + maxDataPerElement + " bones restriction.");

                asset.addVertexSource(new VertexSource(ShaderPredefined.a_BoneIndex0, boneIndices, numDataPerElement, GLVertexBufferDataType.UNSIGNED_SHORT, false, GLUsageType.STATIC_DRAW));
                asset.addVertexSource(new VertexSource(ShaderPredefined.a_BoneWeight0, boneWeights, numDataPerElement, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
            }
        }

        private _parseCluster(asset: MeshAsset, model: Node, bindShapeMatrix: Matrix44, cluster: Node, skeleton: SkeletonData, skinData: number[][], usedBones: { [key: string]: uint }): void {
            const links = this.getConnectionChildren(cluster.id);
            if (links) {
                const boneNode = this._objects.get(links[0].id);
                if (boneNode) {
                    let boneIdx = usedBones[boneNode.attribName];
                    if (boneIdx === undefined) {
                        boneIdx = asset.boneNames.length;
                        asset.boneNames[boneIdx] = boneNode.attribName;
                        usedBones[boneNode.attribName] = boneIdx;

                        if (!asset.bonePreOffsetMatrices) {
                            asset.bonePreOffsetMatrices = [];
                            //asset.bindPostMatrices = [];
                        }
                        const numMatrices = asset.bonePreOffsetMatrices.length;
                        const numBones = boneIdx + 1;
                        if (numMatrices < numBones) {
                            for (let i = numMatrices; i < numBones; ++i) {
                                asset.bonePreOffsetMatrices[i] = new Matrix44();
                                //asset.bindPostMatrices[i] = new Matrix44();
                            }
                        }
                    }
                    
                    //const boneIdx = skeleton.getIndexByName(boneNode.attribName);
                    let transMat: Matrix44 = null, transLinkMat: Matrix44 = null;
                    let indices: uint[] = null, weights: number[] = null;
                    for (let i = 0, n = cluster.children.length; i < n; ++i) {
                        const child = cluster.children[i];
                        switch (child.name) {
                            case NodeName.TRANSFORM:
                                transMat = this._getPropertyMatrix(child);
                                break;
                            case NodeName.TRANSFORM_LINK:
                                transLinkMat = this._getPropertyMatrix(child);
                                break;
                            case NodeName.INDEXES:
                                indices = this._getPropertyValue(child, NodePropertyValueType.INT_ARRAY);
                                break;
                            case NodeName.WEIGHTS:
                                weights = this._getPropertyValue(child, NodePropertyValueType.NUMBER_ARRAY);
                                break;
                            default:
                                break;
                        }
                    }

                    if (indices) {
                        for (let i = 0, n = indices.length; i < n; ++i) {
                            const w = weights[i];
                            if (w !== 0) {
                                const idx = indices[i];
                                let arr = skinData[idx];
                                if (!arr) {
                                    arr = [];
                                    skinData[idx] = arr;
                                }
                                arr.push(boneIdx, weights[i]);
                            }
                        }
                    }

                    const m = asset.bonePreOffsetMatrices[boneIdx];
                    const poseMat = this._posesMap.get(model.id);

                    poseMat.append34(transLinkMat.invert34(m), m);
                    if (bindShapeMatrix) bindShapeMatrix.append34(m, m);
                    //lm.append34(transMat);

                    //transMat.invert(asset.bindPreMatrices[boneIdx]);
                    //transMat.append34(transLinkMat.invert(asset.bindPostMatrices[boneIdx]), asset.bindPostMatrices[boneIdx]);

                    //transMat.append34(transLinkMat.invert(asset.bindPreMatrices[boneIdx]), asset.bindPreMatrices[boneIdx]);

                    //transLinkMat.invert(asset.bindPreMatrices[boneIdx]).append34(transMat);

                    //asset.bindMatrices[boneIdx].set34(transMat);
                    //transLinkMat.invert(asset.bindMatrices[boneIdx]);
                    //transMat.append34(transLinkMat, asset.bindMatrices[boneIdx]);
                    //transLinkMat.invert(asset.bindMatrices[boneIdx]).append34(transMat);
                }
            }
        }

        private _parseVertexSource(values: number[], indices: uint[], refType: string, mappingType: string, sourceIndices: uint[], numDataPerVertex: uint): number[] {
            if (values) {
                const n = sourceIndices.length;
                if (mappingType === NodePropertyValue.BY_CONTROL_POINT) {
                    if (refType === NodePropertyValue.DIRECT) {
                        const vertices: number[] = [];
                        vertices.length = n * numDataPerVertex;
                        let vertIdx = 0;
                        for (let i = 0; i < n; ++i) {
                            const idx = sourceIndices[i] * numDataPerVertex;
                            for (let j = 0; j < numDataPerVertex; ++j) vertices[vertIdx++] = values[idx + j];
                        }
                        return vertices;
                    } else if (refType === NodePropertyValue.INDEX_TO_DIRECT) {
                        const vertices: number[] = [];
                        vertices.length = n * numDataPerVertex;
                        let vertIdx = 0;
                        for (let i = 0; i < n; ++i) {
                            const idx = indices[sourceIndices[i]] * numDataPerVertex;
                            for (let j = 0; j < numDataPerVertex; ++j) vertices[vertIdx++] = values[idx + j];
                        }
                        return vertices;
                    }
                } else if (mappingType === NodePropertyValue.BY_POLYGON_VERTEX) {
                    if (refType === NodePropertyValue.DIRECT) {
                        return values.concat();
                    } else if (refType === NodePropertyValue.INDEX_TO_DIRECT) {
                        const vertices: number[] = [];
                        vertices.length = n * numDataPerVertex;
                        let vertIdx = 0;
                        for (let i = 0; i < n; ++i) {
                            const idx = indices[i] * numDataPerVertex;
                            for (let j = 0; j < numDataPerVertex; ++j) vertices[vertIdx++] = values[idx + j];
                        }
                        return vertices;
                    }
                }
            }
            return null;
        }

        private _parseVertices(node: Node, sourceIndices: number[], asset: MeshAsset): [uint[], uint] {
            if (node.properties && node.properties.length > 0) {
                const p = node.properties[0];
                if (p.type === NodePropertyValueType.NUMBER_ARRAY) {
                    const sourceVertices = <number[]>p.value;
                    const n = sourceIndices.length;

                    const indices: uint[] = [];
                    indices.length = n;

                    const vertices: number[] = [];
                    vertices.length = n * 3;

                    const vertIdxMapping: uint[] = [];
                    vertIdxMapping.length - n;

                    let vertIdx = 0;

                    for (let i = 0; i < n; ++i) {
                        let idx = sourceIndices[i];
                        vertIdxMapping[i] = idx;

                        idx *= 3;
                        vertices[vertIdx++] = sourceVertices[idx];
                        vertices[vertIdx++] = sourceVertices[idx + 1];
                        vertices[vertIdx++] = sourceVertices[idx + 2];

                        indices[i] = i;
                    }

                    asset.drawIndexSource = new DrawIndexSource(indices, GLIndexDataType.AUTO, GLUsageType.STATIC_DRAW);
                    asset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, vertices, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));

                    return [vertIdxMapping, (sourceVertices.length / 3) | 0];
                }
            }

            return null;
        }

        private _parseNormals(node: Node, sourceIndices: uint[], asset: MeshAsset, valueName: string, attribName: string): void {
            let values: number[] = null, refType: string = null, mappingType: string = null;

            for (let i = 0, n = node.children.length; i < n; ++i) {
                const child = node.children[i];
                switch (child.name) {
                    case valueName:
                        values = this._getPropertyValue<number[]>(child, NodePropertyValueType.NUMBER_ARRAY);
                        break;
                    case NodeName.REFERENCE_INFORMATION_TYPE:
                        refType = this._getPropertyValue<string>(child, NodePropertyValueType.STRING);
                        break;
                    case NodeName.MAPPING_INFORMATION_TYPE:
                        mappingType = this._getPropertyValue<string>(child, NodePropertyValueType.STRING);
                        break;
                    default:
                        break;
                }
            }

            asset.addVertexSource(new VertexSource(attribName, this._parseVertexSource(values, null, refType, mappingType, sourceIndices, 3),
                GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
        }

        private _parseUVs(node: Node, sourceIndices: uint[], asset: MeshAsset): void {
            let values: number[] = null, indices: uint[] = null, refType: string = null, mappingType: string = null;

            for (let i = 0, n = node.children.length; i < n; ++i) {
                const child = node.children[i];
                switch (child.name) {
                    case NodeName.UV:
                        values = this._getPropertyValue<number[]>(child, NodePropertyValueType.NUMBER_ARRAY);
                        break;
                    case NodeName.UV_INDEX:
                        indices = this._getPropertyValue<uint[]>(child, NodePropertyValueType.INT_ARRAY);
                        break;
                    case NodeName.REFERENCE_INFORMATION_TYPE:
                        refType = this._getPropertyValue<string>(child, NodePropertyValueType.STRING);
                        break;
                    case NodeName.MAPPING_INFORMATION_TYPE:
                        mappingType = this._getPropertyValue<string>(child, NodePropertyValueType.STRING);
                        break;
                    default:
                        break;
                }
            }

            const uvs = this._parseVertexSource(values, indices, refType, mappingType, sourceIndices, 2);
            if (uvs) {
                for (let i = 1, n = uvs.length; i < n; i += 2) uvs[i] = 1 - uvs[i];
                asset.addVertexSource(new VertexSource(ShaderPredefined.a_UV0, uvs, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.STATIC_DRAW));
            }
        }

        private _parsePolygonVertexIndex(node: Node, sourceIndices: uint[], faces: uint[]): boolean {
            let needTriangulate = false;

            if (node.properties && node.properties.length > 0) {
                const p = node.properties[0];
                if (p.type === NodePropertyValueType.INT_ARRAY) {
                    const src = <int[]>p.value;
                    const len = src.length;

                    let numIdx = 0, numFaces = 0, start = 0;
                    for (let i = 0; i < len; ++i) {
                        let idx = src[i];
                        if (idx < 0) {
                            idx = ~idx;
                            const n = i - start + 1;
                            if (n > 3) needTriangulate = true;
                            faces[numFaces++] = n;
                            start = i + 1;
                        }

                        sourceIndices[numIdx++] = idx;
                    }
                }
            }

            return needTriangulate;
        }
    }
}