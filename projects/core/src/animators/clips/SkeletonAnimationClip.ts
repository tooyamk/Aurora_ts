namespace Aurora {
    export class SubSkeletonAnimationClip {
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
        protected _multiClips: Map<string, SubSkeletonAnimationClip> = null;
        protected _numMultiClips: uint = 0;

        protected _startTime: number = 0;
        protected _endTime: number = 0;

        protected _frames: Map<string, SkeletonAnimationClip.BoneFrames> = null;

        public get frames(): Map<string, SkeletonAnimationClip.BoneFrames> {
            return this._frames;
        }

        public set frames(value: Map<string, SkeletonAnimationClip.BoneFrames>) {
            this._frames = value;
        }

        public get startTime(): number {
            return this._startTime;
        }

        public get endTime(): number {
            return this._endTime;
        }

        public setTimeRagne(start: number, end: number): void {
            this._startTime = start;
            this._endTime = end <= start ? start : end;
            this._duration = this._endTime - this._startTime;
        }

        public cache(b: boolean): void {
            if (this._frames) {
                if (b) {
                    for (let itr of this._frames) itr[1].cache();
                } else {
                    for (let itr of this._frames) itr[1].isCached = false;
                }
            }
        }

        public get numMuliiClips(): uint {
            return this._numMultiClips;
        }

        public get multiClips(): Map<string, SubSkeletonAnimationClip> {
            return this._multiClips;
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
                    sub = new SubSkeletonAnimationClip(clip, weight);
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

        public destroy(): void {
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

            public rotIsSlerp: boolean;
            public rotAcos: number;
            public rotRecSin: number;
            public rotNeg: boolean;

            public cache(prev: Frame): void {
                const rot0 = prev.rotation;
                const rot1 = this.rotation;
                if (rot0 && rot1) {
                    let cos = rot0.x * rot1.x + rot0.y * rot1.y + rot0.z * rot1.z + rot0.w * rot1.w;
                    if (cos < 0) {
                        cos = -cos;
                        this.rotNeg = true;
                    } else {
                        this.rotNeg = false;
                    }
                    if (cos > 0.9999) {
                        this.rotIsSlerp = false;
                    } else {
                        this.rotIsSlerp = true;
                        this.rotAcos = Math.acos(cos);
                        this.rotRecSin = 1 / Math.sin(this.rotAcos);
                    }
                }
            }
        }

        export class BoneFrames {
            public equantInterval: number = -1;
            public frames: Frame[] = [];
            public isCached = false;

            public supplementLerpFrames(): void {
                const frames = this.frames;
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

            public calcEquantInterval(): void {
                const frames = this.frames;
                const numFrames = frames.length;
                
                this.equantInterval = 0;
                if (numFrames >= 2) {
                    let t0 = frames[1].time;
                    let interval = t0 - frames[0].time;
                    for (let i = 2; i < numFrames; ++i) {
                        const f = frames[i];
                        let t1 = f.time;
                        if (!MathUtils.isEqual(interval, t1 - t0, 0.00001)) {
                            this.equantInterval = -1;
                            break;
                        }
                        t0 = t1;
                    }

                    if (this.equantInterval === 0) this.equantInterval = (frames[numFrames - 1].time - frames[0].time) / numFrames;
                }
            }

            public cache(): void {
                const frames = this.frames;
                const numFrames = frames.length;

                if (numFrames > 1) {
                    this.isCached = true;
                    
                    let prev = frames[0];
                    for (let i = 1; i < numFrames; ++i) {
                        const cur = frames[i];
                        cur.cache(prev);
                        prev = cur;
                    }
                } else {
                    this.isCached = false;
                }
            }
        }
    }
}