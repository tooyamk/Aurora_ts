///<reference path="../../math/Quaternion.ts"/>
///<reference path="../../math/Vector.ts"/>

namespace Aurora {
    export class SkeletonAnimationClip extends AbstractAnimationClip {
        protected static readonly TMP_POS = new Vector3();
        protected static readonly TMP_ROT = new Quaternion();
        protected static readonly TMP_SCALE = new Vector3();

        public skeleton: Skeleton = null;

        protected _frames: Map<string, SkeletonAnimationClip.Frame[]> = null;
        
        public get frames(): Map<string, SkeletonAnimationClip.Frame[]> {
            return this._frames;
        }

        public set frames(value: Map<string, SkeletonAnimationClip.Frame[]>) {
            this._frames = value;
            if (value && value.size > 0) {
                let d = 0;
                for (let itr of value) {
                    const frames = itr[1];
                    if (frames && frames.length > 0) {
                        const t = frames[frames.length - 1].time;
                        if (d < t) d = t;
                    }
                }
                this._duration = d;
            } else {
                this._duration = 0;
            }
        }

        public update(elapsed: number): number {
            const e = this._wrap(elapsed, this._duration);

            if (this.skeleton && this._frames) {
                const bones = this.skeleton.bones;
                if (bones) {
                    for (let itr of bones) {
                        const name = itr[0];
                        const frames = this._frames.get(name);
                        if (frames && frames.length > 0) {
                            const start = this._findFrame(e, 0, frames.length - 1, frames);
                            this._updateBone(name, e, frames[start], frames[start + 1]);
                        }
                    }
                }
            }

            return e;
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

        private _updateBone(name: string, elapsed: number, frame0: SkeletonAnimationClip.Frame, frame1: SkeletonAnimationClip.Frame): void {
            const bone = this.skeleton.bones.get(name);
            if (bone) {
                if (frame1) {
                    if (frame0) {
                        const t = (elapsed - frame0.time) / (frame1.time - frame0.time);
                        if (t === 0) {
                            this._setBoneTRSByFrame(bone, frame0);
                        } else if (t === 1) {
                            this._setBoneTRSByFrame(bone, frame1);
                        } else {
                            let pos: Vector3;
                            let rot: Quaternion;
                            let scale: Vector3;

                            if (frame0.translation) {
                                if (frame1.translation) {
                                    pos = Vector3.lerp(frame0.translation, frame1.translation, t, SkeletonAnimationClip.TMP_POS);
                                } else {
                                    pos = frame0.translation;
                                }
                            } else {
                                pos = Vector3.CONST_ZERO;
                            }

                            if (frame0.rotation) {
                                if (frame1.rotation) {
                                    rot = Quaternion.slerp(frame0.rotation, frame1.rotation, t, SkeletonAnimationClip.TMP_ROT);
                                } else {
                                    rot = frame0.rotation;
                                }
                            } else {
                                rot = Quaternion.CONST_IDENTITY;
                            }

                            if (frame0.scale) {
                                if (frame1.scale) {
                                    scale = Vector3.lerp(frame0.scale, frame1.scale, t, SkeletonAnimationClip.TMP_SCALE);
                                } else {
                                    scale = frame0.scale;
                                }
                            } else {
                                scale = Vector3.CONST_ONE;
                            }

                            bone.setLocalTRS(pos, rot, scale);
                        }
                    }
                } else {
                    if (frame0) this._setBoneTRSByFrame(bone, frame0);
                }
            }
        }

        private _setBoneTRSByFrame(bone: Node, frame: SkeletonAnimationClip.Frame): void {
            bone.setLocalTRS(
                frame.translation ? frame.translation : Vector3.CONST_ZERO,
                frame.rotation ? frame.rotation : Quaternion.CONST_IDENTITY,
                frame.scale ? frame.scale : Vector3.CONST_ONE);
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