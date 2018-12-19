///<reference path="../../math/Quaternion.ts"/>
///<reference path="../../math/Vector.ts"/>

namespace Aurora {
    class TRS {
        public static readonly CONST_IDENTITY = new TRS();

        public valid = false;
        public readonly translation = new Vector3();
        public readonly rotation = new Quaternion();
        public readonly scale = new Vector3(1, 1, 1);

        public identity(): void {
            this.translation.setZero();
            this.rotation.identity();
            this.scale.setOne();
            this.valid = false;
        }

        public set(target: TRS): void {
            this.valid = target.valid;
            if (this.valid) {
                this.translation.set(target.translation);
                this.rotation.set(target.rotation);
                this.scale.set(target.scale);
            }
        }

        public static lerp(from: TRS, to: TRS, t: number, rst: TRS): void {
            if (from.valid) {
                if (to.valid) {
                    Vector3.lerp(from.translation, to.translation, t, rst.translation);
                    Quaternion.slerp(from.rotation, to.rotation, t, rst.rotation);
                    Vector3.lerp(from.scale, to.scale, t, rst.scale);
                    rst.valid = true;
                } else {
                    rst.translation.set(from.translation);
                    rst.rotation.set(from.rotation);
                    rst.scale.set(from.scale);
                    rst.valid = true;
                }
            } else if (to.valid) {
                Vector3.lerp(Vector3.CONST_ZERO, to.translation, t, rst.translation);
                Quaternion.slerp(Quaternion.CONST_IDENTITY, to.rotation, t, rst.rotation);
                Vector3.lerp(Vector3.CONST_ONE, to.scale, t, rst.scale);
                rst.valid = true;
            } else {
                rst.valid = false;
            }
        }
    }

    class SubClip {
        private _clip: SkeletonAnimationClip = null;
        public weight: number = 0;

        constructor(clip: SkeletonAnimationClip, weight: number) {
            this.clip = clip;
            this.weight = weight;
        }

        public get clip(): SkeletonAnimationClip {
            return this._clip;
        }

        public set clip(value: SkeletonAnimationClip) {
            if (this._clip !== value) {
                if (value) value.retain();
                if (this._clip) this._clip.release();
                this._clip = value;
            }
        }

        public destroy(): void {
            this.clip = null;
        }
    }

    export class SkeletonAnimationClip extends AbstractAnimationClip {
        protected static readonly tmpPos = new Vector3();
        protected static readonly tmpRot = new Quaternion();
        protected static readonly tmpScale = new Vector3();
        protected static readonly tmpTrs = new TRS();

        protected static readonly _transformsPool: TRS[][] = [];
        protected static _numTransformsInPool: uint = 0;

        protected _multiClips: Map<string, SubClip> = null;
        protected _numMultiClips: uint = 0;

        protected _skeleton: Skeleton = null;

        protected _startTime: number = 0;
        protected _endTime: number = 0;

        protected _frames: Map<string, SkeletonAnimationClip.Frame[]> = null;

        protected static _getTransformsFromPool(): TRS[] {
            if (SkeletonAnimationClip._numTransformsInPool) {
                return SkeletonAnimationClip[--SkeletonAnimationClip._numTransformsInPool];
            } else {
                return [];
            }
        }

        protected static _pushTransformsToPool(transforms: TRS[]): void {
            SkeletonAnimationClip[SkeletonAnimationClip._numTransformsInPool++] = transforms;
        }

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
        
        public get frames(): Map<string, SkeletonAnimationClip.Frame[]> {
            return this._frames;
        }

        public set frames(value: Map<string, SkeletonAnimationClip.Frame[]>) {
            this._frames = value;
        }

        public setTimeRagne(start: number, end: number): void {
            this._startTime = start;
            this._endTime = end <= start ? start : end;
            this._duration = this._endTime - this._startTime;
        }

        public setMultiClip(name: string, clip: SkeletonAnimationClip, weight: number): void {
            if (clip) {
                if (weight < 0) weight = 0;
                if (!this._multiClips) this._multiClips = new Map();
                let sub = this._multiClips.get(name);
                if (sub) {
                    sub.clip = clip;
                    sub.weight = weight;
                } else {
                    sub = new SubClip(clip, weight);
                    this._multiClips.set(name, sub);
                    ++this._numMultiClips;
                }
            } else {
                this.deleteMultiClip(name);
            }
        }

        public setMultiClipWeight(name: string, weight: number): void {
            if (this._numMultiClips > 0) {
                const sub = this._multiClips.get(name);
                if (sub) sub.weight = weight < 0 ? 0 : weight;
            }
        }

        public deleteMultiClip(name: string): void {
            if (this._numMultiClips > 0) {
                const sub = this._multiClips.get(name);
                if (sub) {
                    this._multiClips.delete(name);
                    sub.destroy();
                    --this._numMultiClips;
                }
            }
        }

        public clearAllMultiClips(): void {
            if (this._numMultiClips > 0) {
                for (let itr of this._multiClips) itr[1].destroy();
                this._multiClips.clear();
                this._numMultiClips = 0;
            }
        }

        public update(start: number, elapsed: number, blend: AnimatorBlend[]): number {
            const e = this._wrap(start + elapsed, this._duration);

            const transSelf = SkeletonAnimationClip._getTransformsFromPool();
            if (this._updateWithClampElapsed(this._skeleton, e, transSelf)) {
                if (blend && blend.length > 0) {
                    let begin = 0;
                    let n = blend.length;
                    for (let i = n - 1; i >= 0; --i) {
                        const ab = blend[i];
                        if (elapsed >= ab.blendTime || elapsed <= -ab.blendTime) {
                            begin = i + 1;
                            break;
                        }
                    }

                    if (begin < n) {
                        const transRst = SkeletonAnimationClip._getTransformsFromPool();
                        this._capacityTransforms(transRst, this._skeleton.bones.size);

                        let fromSke: Skeleton = null;
                        let fromTrans: TRS[] = null;
                        let bt: number;

                        for (let i = begin, n = blend.length; i < n; ++i) {
                            const ab = blend[i];

                            const clip = <SkeletonAnimationClip>ab.clip;
                            const ske: Skeleton = clip._skeleton;
                            let trans = SkeletonAnimationClip._getTransformsFromPool();
                            if (!clip._updateWrapElapsed(clip._skeleton, ab.startTime + elapsed, trans)) {
                                SkeletonAnimationClip._pushTransformsToPool(trans);
                                trans = null;
                            }

                            if (i === begin) {
                                fromTrans = trans;
                                fromSke = ske;
                            } else {
                                this._lerpTransforms(fromSke, fromTrans, ske, trans, 1 - Math.abs(bt - elapsed) / bt, transRst);
                                SkeletonAnimationClip._pushTransformsToPool(trans);
                                fromSke = this._skeleton;
                                if (fromTrans !== transRst) {
                                    SkeletonAnimationClip._pushTransformsToPool(fromTrans);
                                    fromTrans = transRst;
                                }
                            }

                            bt = ab.blendTime;
                        }

                        this._lerpTransforms(fromSke, fromTrans, this._skeleton, transSelf, 1 - Math.abs(bt - elapsed) / bt, transSelf);
                        if (fromTrans && fromTrans !== transRst) SkeletonAnimationClip._pushTransformsToPool(fromTrans);
                        SkeletonAnimationClip._pushTransformsToPool(transRst);
                    }
                }

                const rawBones = this._skeleton.bones.raw;
                for (let i = 0, n = rawBones.length; i < n; ++i) {
                    const bone = rawBones[i];
                    if (bone) {
                        const trs = transSelf[i];
                        if (trs.valid) bone.setLocalTRS(trs.translation, trs.rotation, trs.scale);
                    }
                }
            }
            SkeletonAnimationClip._pushTransformsToPool(transSelf);

            return e;
        }

        private _capacityTransforms(trans: TRS[], len: uint): void {
            if (trans.length < len) {
                for (let i = trans.length; i < len; ++i) trans[i] = new TRS();
            }
        }

        private _updateWrapElapsed(skeleton: Skeleton, elapsed: number, transforms: TRS[]): boolean {
            return this._updateWithClampElapsed(skeleton, this._wrap(elapsed, this._duration), transforms);
        }

        public _updateWithClampElapsed(skeleton: Skeleton, elapsed: number, transforms: TRS[]): boolean {
            if (skeleton) {
                if (this._numMultiClips > 0) {
                    const bones = skeleton.bones;
                    if (bones) {
                        const rawBones = bones.raw;
                        const n = rawBones.length;

                        this._capacityTransforms(transforms, n);

                        let fromTrans: TRS[] = null;
                        let weights = 0;

                        const tr = this._duration > 0 ? (elapsed + this._startTime) / this._duration : 0;
                        let count = 0;
                        for (let itr of this._multiClips) {
                            const sub = itr[1];
                            const w = sub.weight;
                            if (w <= 0) continue;

                            weights += w;

                            const clip = sub.clip;
                            const t = tr * clip._duration;

                            let trans = SkeletonAnimationClip._getTransformsFromPool();
                            if (!clip._updateWithClampElapsed(skeleton, t, trans)) {
                                SkeletonAnimationClip._pushTransformsToPool(trans);
                                trans = null;
                            }

                            if (count === 0) {
                                fromTrans = trans;
                            } else {
                                this._lerpTransforms(skeleton, fromTrans, skeleton, trans, w / weights, transforms);
                                SkeletonAnimationClip._pushTransformsToPool(trans);
                                if (fromTrans !== transforms) {
                                    SkeletonAnimationClip._pushTransformsToPool(fromTrans);
                                    fromTrans = transforms;
                                }
                            }

                            ++count;
                        }

                        if (count === 0) {
                            for (let i = 0; i < n; ++i) transforms[i].valid = false;
                        } else if (count === 1) {
                            if (fromTrans) {
                                for (let i = 0; i < n; ++i) transforms[i].set(fromTrans[i]);
                            } else {
                                for (let i = 0; i < n; ++i) transforms[i].valid = false;
                            }
                        }

                        if (fromTrans && fromTrans !== transforms) SkeletonAnimationClip._pushTransformsToPool(fromTrans);

                        return true;
                    }
                } else if (this._frames) {
                    const bones = skeleton.bones;
                    if (bones) {
                        const rawBones = bones.raw;
                        const n = rawBones.length;

                        this._capacityTransforms(transforms, n);

                        const t = elapsed + this._startTime;
                        for (let i = 0; i < n; ++i) {
                            const bone = rawBones[i];
                            const trs = transforms[i];
                            if (bone) {
                                const frames = this._frames.get(bone.name);
                                if (frames && frames.length > 0) {
                                    const start = this._findFrame(elapsed, 0, frames.length - 1, frames);
                                    this._updateTransform(trs, elapsed, frames[start], frames[start + 1]);
                                    trs.valid = true;
                                } else {
                                    trs.valid = false;
                                }
                            } else {
                                trs.valid = false;
                            }
                        }

                        return true;
                    }
                }
            }

            return false;
        }

        private _findFrame(elapsed: number, start: uint, end: uint, frames: SkeletonAnimationClip.Frame[]): int {
            const len = end - start;
            if (len === 0) {
                return elapsed >= frames[start].time ? start : -1;
            } else if (len === 1) {
                if (elapsed >= frames[end].time) return end;
                return elapsed >= frames[start].time ? start : -1;
            } else {
                const middle = start + (len >> 1);
                const f = frames[middle];
                if (elapsed === f.time) {
                    return middle;
                } else if (elapsed < f.time) {
                    return this._findFrame(elapsed, start, middle - 1, frames);
                } else {
                    return this._findFrame(elapsed, middle, end, frames);
                }
            }
        }

        private _getTRSFromSkeleton(name: string, ske: Skeleton, trans: TRS[]): TRS {
            const idx = ske.mapping.get(name);
            if (idx === undefined) {
                return TRS.CONST_IDENTITY;
            } else {
                return trans[idx];
            }
        }

        private _lerpTransforms(fromSke: Skeleton, fromTrans: TRS[], toSke: Skeleton, toTrans: TRS[], t: number, rst: TRS[]): void {
            const rawBones = this._skeleton.bones.raw;
            const numBones = rawBones.length;

            if (fromTrans) {
                if (toTrans) {
                    if (fromSke === this._skeleton) {
                        if (toSke === this._skeleton) {
                            for (let i = 0; i < numBones; ++i) {
                                const bone = rawBones[i];
                                if (bone) {
                                    TRS.lerp(fromTrans[i], toTrans[i], t, rst[i]);
                                } else {
                                    rst[i].valid = false;
                                }
                            }
                        } else {
                            for (let i = 0; i < numBones; ++i) {
                                const bone = rawBones[i];
                                if (bone) {
                                    TRS.lerp(fromTrans[i], this._getTRSFromSkeleton(bone.name, toSke, toTrans), t, rst[i]);
                                } else {
                                    rst[i].valid = false;
                                }
                            }
                        }
                    } else if (toSke === this._skeleton) {
                        for (let i = 0; i < numBones; ++i) {
                            const bone = rawBones[i];
                            if (bone) {
                                TRS.lerp(this._getTRSFromSkeleton(bone.name, fromSke, fromTrans), toTrans[i], t, rst[i]);
                            } else {
                                rst[i].valid = false;
                            }
                        }
                    } else {
                        for (let i = 0; i < numBones; ++i) {
                            const bone = rawBones[i];
                            if (bone) {
                                TRS.lerp(this._getTRSFromSkeleton(bone.name, fromSke, fromTrans), this._getTRSFromSkeleton(bone.name, toSke, toTrans), t, rst[i]);
                            } else {
                                rst[i].valid = false;
                            }
                        }
                    }
                } else {
                    if (fromSke === this._skeleton) {
                        for (let i = 0; i < numBones; ++i) {
                            const bone = rawBones[i];
                            if (bone) {
                                TRS.lerp(fromTrans[i], TRS.CONST_IDENTITY, t, rst[i]);
                            } else {
                                rst[i].valid = false;
                            }
                        }
                    } else {
                        for (let i = 0; i < numBones; ++i) {
                            const bone = rawBones[i];
                            if (bone) {
                                TRS.lerp(this._getTRSFromSkeleton(bone.name, fromSke, fromTrans), TRS.CONST_IDENTITY, t, rst[i]);
                            } else {
                                rst[i].valid = false;
                            }
                        }
                    }
                }
            } else if (toTrans) {
                if (toSke === this._skeleton) {
                    for (let i = 0; i < numBones; ++i) {
                        const bone = rawBones[i];
                        if (bone) {
                            TRS.lerp(TRS.CONST_IDENTITY, toTrans[i], t, rst[i]);
                        } else {
                            rst[i].valid = false;
                        }
                    }
                } else {
                    for (let i = 0; i < numBones; ++i) {
                        const bone = rawBones[i];
                        if (bone) {
                            TRS.lerp(TRS.CONST_IDENTITY, this._getTRSFromSkeleton(bone.name, toSke, toTrans), t, rst[i]);
                        } else {
                            rst[i].valid = false;
                        }
                    }
                }
            } else {
                for (let i = 0; i < numBones; ++i) rst[i].valid = false;
            }
        }

        private _updateTransform(trans: TRS, elapsed: number, frame0: SkeletonAnimationClip.Frame, frame1: SkeletonAnimationClip.Frame): void {
            if (frame1) {
                if (frame0) {
                    const t = (elapsed - frame0.time) / (frame1.time - frame0.time);
                    if (t === 0) {
                        this._setTransformByFrame(trans, frame0);
                    } else if (t === 1) {
                        this._setTransformByFrame(trans, frame1);
                    } else {
                        let pos: Vector3;
                        let rot: Quaternion;
                        let scale: Vector3;

                        if (frame0.translation) {
                            if (frame1.translation) {
                                pos = Vector3.lerp(frame0.translation, frame1.translation, t, SkeletonAnimationClip.tmpPos);
                            } else {
                                pos = frame0.translation;
                            }
                        } else {
                            pos = Vector3.CONST_ZERO;
                        }

                        if (frame0.rotation) {
                            if (frame1.rotation) {
                                rot = Quaternion.slerp(frame0.rotation, frame1.rotation, t, SkeletonAnimationClip.tmpRot);
                            } else {
                                rot = frame0.rotation;
                            }
                        } else {
                            rot = Quaternion.CONST_IDENTITY;
                        }

                        if (frame0.scale) {
                            if (frame1.scale) {
                                scale = Vector3.lerp(frame0.scale, frame1.scale, t, SkeletonAnimationClip.tmpScale);
                            } else {
                                scale = frame0.scale;
                            }
                        } else {
                            scale = Vector3.CONST_ONE;
                        }

                        trans.translation.set(pos);
                        trans.rotation.set(rot);
                        trans.scale.set(scale);
                    }
                }
            } else {
                if (frame0) this._setTransformByFrame(trans, frame0);
            }
        }

        private _setTransformByFrame(trans: TRS, frame: SkeletonAnimationClip.Frame): void {
            trans.translation.set(frame.translation ? frame.translation : Vector3.CONST_ZERO);
            trans.rotation.set(frame.rotation ? frame.rotation : Quaternion.CONST_IDENTITY);
            trans.scale.set(frame.scale ? frame.scale : Vector3.CONST_ONE);
        }

        public static supplementLerpFrames(frames: SkeletonAnimationClip.Frame[]): void {
            const numFrames = frames.length;
            let ti = -1, ri = -1, si = -1;
            for (let i = 0; i < numFrames; ++i) {
                const f = frames[i];

                if (f.translation) {
                    if (ti >= 0 && ti + 1 !== i) {
                        const f0 = frames[ti];
                        const f1 = frames[i];
                        const t = f1.time - f0.time;
                        for (let j = ti + 1; j < i; ++j) {
                            const f2 = frames[j];
                            f2.translation = Vector3.lerp(f0.translation, f1.translation, (f2.time - f0.time) / t);
                        }
                    }

                    ti = i;
                }

                if (f.rotation) {
                    if (ri >= 0 && ri + 1 !== i) {
                        const f0 = frames[ri];
                        const f1 = frames[i];
                        const t = f1.time - f0.time;
                        for (let j = ri + 1; j < i; ++j) {
                            const f2 = frames[j];
                            f2.rotation = Quaternion.slerp(f0.rotation, f1.rotation, (f2.time - f0.time) / t);
                        }
                    }

                    ri = i;
                }

                if (f.scale) {
                    if (si >= 0 && si + 1 !== i) {
                        const f0 = frames[si];
                        const f1 = frames[i];
                        const t = f1.time - f0.time;
                        for (let j = si + 1; j < i; ++j) {
                            const f2 = frames[j];
                            f2.scale = Vector3.lerp(f0.scale, f1.scale, (f2.time - f0.time) / t);
                        }
                    }

                    si = i;
                }
            }

            if (ti >= 0 && ti + 1 < numFrames) {
                const f = frames[ti];
                for (let i = ti + 1; i < numFrames; ++i) frames[i].translation = f.translation.clone();
            }

            if (ri >= 0 && ri + 1 < numFrames) {
                const f = frames[ri];
                for (let i = ri + 1; i < numFrames; ++i) frames[i].rotation = f.rotation.clone();
            }

            if (si >= 0 && si + 1 < numFrames) {
                const f = frames[si];
                for (let i = si + 1; i < numFrames; ++i) frames[i].scale = f.scale.clone();
            }
        }

        public destroy(): void {
            this.skeleton = null;
            this.frames = null;
            
            if (this._multiClips) {
                this.clearAllMultiClips();
                this._multiClips = null;
            }
        }

        protected _refDestroy(): void {
            this.destroy();
        }
    }

    export namespace SkeletonAnimationClip {
        export class Frame {
            public time: number = 0;
            public translation: Vector3 = null;
            public rotation: Quaternion = null;
            public scale: Vector3 = null;
        }
    }
}