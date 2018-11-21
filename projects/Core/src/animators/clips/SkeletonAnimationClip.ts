///<reference path="../../math/Quaternion.ts" />
///<reference path="../../math/Vector.ts" />

namespace Aurora {
    export class SkeletonAnimationClip extends AbstractAnimationClip {
        protected static readonly TMP_POS = new Vector3();
        protected static readonly TMP_ROT = new Quaternion();
        protected static readonly TMP_SCALE = new Vector3();

        public skeleton: Skeleton = null;

        protected _frames: SkeletonAnimationClip.Frame[] = null;
        protected _numFrames: uint = 0;
        
        public get frames(): SkeletonAnimationClip.Frame[] {
            return this._frames;
        }

        public set frames(value: SkeletonAnimationClip.Frame[]) {
            this._frames = value;
            if (value && value.length > 0) {
                this._numFrames = value.length;
                this._duration = value[this._numFrames - 1].time;
            } else {
                this._numFrames = 0;
                this._duration = 0;
            }
        }

        public update(elapsed: number): number {
            const e = this._wrap(elapsed, this._duration);
            if (this._numFrames > 0) {
                const start = this._findFrame(e, 0, this._numFrames - 1);
                if (start >= 0) {
                    const f0 = this._frames[start];
                    if (f0.time === e) {
                        this._updateBones(e, f0, null);
                    } else {
                        if (start + 1 >= this._numFrames) {
                            this._updateBones(e, f0, null);
                        } else {
                            this._updateBones(e, f0, this._frames[start + 1]);
                        }
                    }
                }
            }

            return e;
        }

        private _findFrame(elapsed: number, start: uint, end: uint): int {
            const len = end - start;
            if (len === 0) {
                return elapsed >= this._frames[start].time ? start : -1;
            } else if (len === 1) {
                if (elapsed >= this._frames[end].time) return end;
                return elapsed >= this._frames[start].time ? start : -1;
            } else {
                const middle = start + (len >> 1);
                const f = this.frames[middle];
                if (elapsed === f.time) {
                    return middle;
                } else if (elapsed < f.time) {
                    return this._findFrame(elapsed, start, middle - 1);
                } else {
                    return this._findFrame(elapsed, middle, end);
                }
            }
        }

        private _updateBones(elapsed: number, frame0: SkeletonAnimationClip.Frame, frame1: SkeletonAnimationClip.Frame): void {
            const data0 = frame0.data;
            const data1 = frame1 ? frame1.data : null;
            if (data1) {
                if (data0) {
                    const t = (elapsed - frame0.time) / (frame1.time - frame0.time);
                    for (let i = 0, n = data0.length; i < n; ++i) {
                        const f0 = data0[i];
                        if (!f0) continue;
                        
                        const bone = this.skeleton.bones[i];
                        if (!bone) continue;
                        
                        const f1 = data1[i];
                        if (f1) {
                            let pos: Vector3;
                            let rot: Quaternion;
                            let scale: Vector3;

                            if (f0.translation) {
                                if (f1.translation) {
                                    pos = Vector3.lerp(f0.translation, f1.translation, t, SkeletonAnimationClip.TMP_POS);
                                } else {
                                    pos = f0.translation;
                                }
                            } else {
                                pos = Vector3.CONST_ZERO;
                            }

                            if (f0.rotation) {
                                if (f1.rotation) {
                                    rot = Quaternion.slerp(f0.rotation, f1.rotation, t, SkeletonAnimationClip.TMP_ROT);
                                } else {
                                    rot = f0.rotation;
                                }
                            } else {
                                rot = Quaternion.CONST_IDENTITY;
                            }

                            if (f0.scale) {
                                if (f1.scale) {
                                    scale = Vector3.lerp(f0.scale, f1.scale, t, SkeletonAnimationClip.TMP_SCALE);
                                } else {
                                    scale = f0.scale;
                                }
                            } else {
                                scale = Vector3.CONST_ONE;
                            }

                            bone.setLocalTRS(pos, rot, scale);
                        } else {
                            bone.setLocalTRS(
                                f0.translation ? f0.translation : Vector3.CONST_ZERO,
                                f0.rotation ? f0.rotation : Quaternion.CONST_IDENTITY,
                                f0.scale ? f0.scale : Vector3.CONST_ONE);
                        }
                    }
                }
            } else {
                if (data0) {
                    for (let i = 0, n = data0.length; i < n; ++i) {
                        const f0 = data0[i];
                        if (f0) {
                            const bone = this.skeleton.bones[i];
                            if (bone) {
                                bone.setLocalTRS(
                                    f0.translation ? f0.translation : Vector3.CONST_ZERO, 
                                    f0.rotation ? f0.rotation : Quaternion.CONST_IDENTITY, 
                                    f0.scale ? f0.scale : Vector3.CONST_ONE);
                            }
                        }
                    }
                }
            }
        }
    }

    export namespace SkeletonAnimationClip {
        export class BoneData {
            public translation: Vector3 = null;
            public rotation: Quaternion = null;
            public scale: Vector3 = null;
        }

        export class Frame {
            public time: number = 0;
            public data: BoneData[] = null;
        }
    }
}