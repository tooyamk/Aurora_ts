///<reference path="AbstractAnimator.ts"/>
///<reference path="../math/Quaternion.ts"/>
///<reference path="../math/Vector.ts"/>

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

    export class SkeletonAnimator extends AbstractAnimator<SkeletonAnimationClip> {
        protected static readonly _transformsPool: TRS[][] = [];
        protected static _numTransformsInPool: uint = 0;

        protected _skeleton: Skeleton = null;

        protected static _getTransformsFromPool(): TRS[] {
            if (SkeletonAnimator._numTransformsInPool) {
                return SkeletonAnimator._transformsPool[--SkeletonAnimator._numTransformsInPool];
            } else {
                return [];
            }
        }

        protected static _pushTransformsToPool(transforms: TRS[]): void {
            if (transforms) SkeletonAnimator._transformsPool[SkeletonAnimator._numTransformsInPool++] = transforms;
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

        public destroy(): void {
            this.skeleton = null;

            super.destroy();
        }

        protected _update(): void {
            const e = this._curClip.wrap(this._startTime + this._elapsed, this._curClip.duration);
            this._time = e;

            if (this._skeleton) {
                const transSelf = SkeletonAnimator._getTransformsFromPool();
                if (this._updateWithClampElapsed(this._curClip, e, transSelf)) {
                    if (this._blendClips && this._blendClips.length > 0) {
                        let begin = 0;
                        let n = this._blendClips.length;
                        for (let i = n - 1; i >= 0; --i) {
                            const ab = this._blendClips[i];
                            if (this._elapsed >= ab.blendTime || this._elapsed <= -ab.blendTime) {
                                begin = i + 1;
                                break;
                            }
                        }

                        if (begin < n) {
                            const transRst = SkeletonAnimator._getTransformsFromPool();
                            this._capacityTransforms(transRst, this._skeleton.bones.size);

                            let fromTrans: TRS[] = null;
                            let bt: number;

                            for (let i = begin, n = this._blendClips.length; i < n; ++i) {
                                const ab = this._blendClips[i];

                                const clip = <SkeletonAnimationClip>ab.clip;
                                let trans = SkeletonAnimator._getTransformsFromPool();
                                if (!this._updateWithClampElapsed(clip, clip.wrap(ab.startTime + this._elapsed, clip.duration), trans)) {
                                    SkeletonAnimator._pushTransformsToPool(trans);
                                    trans = null;
                                }

                                if (i === begin) {
                                    fromTrans = trans;
                                } else {
                                    this._lerpTransforms(fromTrans, trans, 1 - Math.abs(bt - this._elapsed) / bt, transRst);
                                    SkeletonAnimator._pushTransformsToPool(trans);
                                    if (fromTrans !== transRst) {
                                        SkeletonAnimator._pushTransformsToPool(fromTrans);
                                        fromTrans = transRst;
                                    }
                                }

                                bt = ab.blendTime;
                            }

                            this._lerpTransforms(fromTrans, transSelf, 1 - Math.abs(bt - this._elapsed) / bt, transSelf);
                            if (fromTrans && fromTrans !== transRst) SkeletonAnimator._pushTransformsToPool(fromTrans);
                            SkeletonAnimator._pushTransformsToPool(transRst);
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
                SkeletonAnimator._pushTransformsToPool(transSelf);
            }
        }

        protected _updateWithClampElapsed(clip: SkeletonAnimationClip, elapsed: number, transforms: TRS[]): boolean {
            if (clip.numMuliiClips > 0) {
                const bones = this._skeleton.bones;
                if (bones) {
                    const rawBones = bones.raw;
                    const n = rawBones.length;

                    this._capacityTransforms(transforms, n);

                    let fromTrans: TRS[] = null;
                    let weights = 0;

                    const multiClips = clip.multiClips;
                    const tr = clip.duration > 0 ? (elapsed + clip.startTime) / clip.duration : 0;
                    let count = 0;
                    for (let itr of multiClips) {
                        const sub = itr[1];
                        const w = sub.weight;
                        if (w <= 0) continue;

                        weights += w;

                        const subClip = sub.clip;
                        const t = tr * subClip.duration;

                        let trans = SkeletonAnimator._getTransformsFromPool();
                        if (!this._updateWithClampElapsed(subClip, t, trans)) {
                            SkeletonAnimator._pushTransformsToPool(trans);
                            trans = null;
                        }

                        if (count === 0) {
                            fromTrans = trans;
                        } else {
                            this._lerpTransforms(fromTrans, trans, w / weights, transforms);
                            SkeletonAnimator._pushTransformsToPool(trans);
                            if (fromTrans !== transforms) {
                                SkeletonAnimator._pushTransformsToPool(fromTrans);
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

                    if (fromTrans && fromTrans !== transforms) SkeletonAnimator._pushTransformsToPool(fromTrans);

                    return true;
                }
            } else if (clip.frames) {
                const bones = this._skeleton.bones;
                if (bones) {
                    const clipFrames = clip.frames;
                    const rawBones = bones.raw;
                    const n = rawBones.length;

                    this._capacityTransforms(transforms, n);

                    const t = elapsed + clip.startTime;
                    for (let i = 0; i < n; ++i) {
                        const bone = rawBones[i];
                        const trs = transforms[i];
                        if (bone) {
                            const boneFrames = clipFrames.get(bone.name);
                            if (boneFrames && boneFrames.frames.length > 0) {
                                const cached = boneFrames.isCached;
                                const frames = boneFrames.frames;
                                let start: uint;
                                if (boneFrames.equantInterval >= 0) {
                                    if (boneFrames.equantInterval === 0) {
                                        start = 0;
                                    } else {
                                        start = (elapsed / boneFrames.equantInterval) | 0;
                                        if (start >= frames.length) start = frames.length - 1;
                                    }
                                } else {
                                    start = this._findFrame(elapsed, 0, frames.length - 1, frames);
                                }
                                
                                this._updateTransform(trs, elapsed, frames[start], frames[start + 1], cached);
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

            return false;
        }

        protected _capacityTransforms(trans: TRS[], len: uint): void {
            if (trans.length < len) {
                for (let i = trans.length; i < len; ++i) trans[i] = new TRS();
            }
        }

        protected _findFrame(elapsed: number, start: uint, end: uint, frames: SkeletonAnimationClip.Frame[]): int {
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

        protected _lerpTransforms(fromTrans: TRS[], toTrans: TRS[], t: number, rst: TRS[]): void {
            const rawBones = this._skeleton.bones.raw;
            const numBones = rawBones.length;

            if (fromTrans) {
                if (toTrans) {
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
                            TRS.lerp(fromTrans[i], TRS.CONST_IDENTITY, t, rst[i]);
                        } else {
                            rst[i].valid = false;
                        }
                    }
                }
            } else if (toTrans) {
                for (let i = 0; i < numBones; ++i) {
                    const bone = rawBones[i];
                    if (bone) {
                        TRS.lerp(TRS.CONST_IDENTITY, toTrans[i], t, rst[i]);
                    } else {
                        rst[i].valid = false;
                    }
                }
            } else {
                for (let i = 0; i < numBones; ++i) rst[i].valid = false;
            }
        }

        protected _updateTransform(trans: TRS, elapsed: number, frame0: SkeletonAnimationClip.Frame, frame1: SkeletonAnimationClip.Frame, cached: boolean): void {
            if (frame1) {
                if (frame0) {
                    const t = (elapsed - frame0.time) / (frame1.time - frame0.time);
                    if (t <= 0) {
                        this._setTransformByFrame(trans, frame0);
                    } else if (t >= 1) {
                        this._setTransformByFrame(trans, frame1);
                    } else {
                        if (frame0.translation) {
                            if (frame1.translation) {
                                Vector3.lerp(frame0.translation, frame1.translation, t, trans.translation);
                            } else {
                                trans.translation.set(frame0.translation);
                            }
                        } else {
                            trans.translation.setZero();
                        }

                        if (frame0.rotation) {
                            if (frame1.rotation) {
                                if (cached) {
                                    const from = frame0.rotation, to = frame1.rotation, rst = trans.rotation;
                                    const acos = frame1.acos;
                                    let k0: number, k1: number;
                                    if (acos === acos) {
                                        const sin = frame1.sin;
                                        const ta = t * acos;
                                        k0 = Math.sin(acos - ta) / sin;
                                        k1 = Math.sin(ta) / sin;
                                    } else {
                                        k0 = 1 - t;
                                        k1 = t;
                                    }
                                    if (frame1.neg) k1 = -k1;
                                    rst.x = from.x * k0 + to.x * k1;
                                    rst.y = from.y * k0 + to.y * k1;
                                    rst.z = from.z * k0 + to.z * k1;
                                    rst.w = from.w * k0 + to.w * k1;
                                } else {
                                    Quaternion.slerp(frame0.rotation, frame1.rotation, t, trans.rotation);
                                }
                            } else {
                                trans.rotation.set(frame0.rotation);
                            }
                        } else {
                            trans.rotation.identity();
                        }

                        if (frame0.scale) {
                            if (frame1.scale) {
                                Vector3.lerp(frame0.scale, frame1.scale, t, trans.scale);
                            } else {
                                trans.scale.set(frame0.scale);
                            }
                        } else {
                            trans.scale.setOne();
                        }
                    }
                }
            } else {
                if (frame0) this._setTransformByFrame(trans, frame0);
            }
        }

        protected _setTransformByFrame(trans: TRS, frame: SkeletonAnimationClip.Frame): void {
            trans.translation.set(frame.translation ? frame.translation : Vector3.CONST_ZERO);
            trans.rotation.set(frame.rotation ? frame.rotation : Quaternion.CONST_IDENTITY);
            trans.scale.set(frame.scale ? frame.scale : Vector3.CONST_ONE);
        }
    }
}