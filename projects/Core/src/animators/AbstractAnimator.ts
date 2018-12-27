namespace Aurora {
    export abstract class AbstractAnimator<T extends AbstractAnimationClip> extends Ref {
        protected _blendClips: AnimationBlend[] = null;
        protected _curClip: T = null;
        protected _elapsed: number = 0;
        protected _time: number = 0;

        protected _startTime: number = 0;
        protected _blendTime: number = 0;

        public get elapsed(): number {
            return this._elapsed;
        }

        public set elapsed(value: number) {
            if (this._curClip) {
                this._elapsed = value;
                this._time = this._curClip.wrap(this._startTime + value, this._curClip.duration);
            }
        }

        public get time(): number {
            return this._time;
        }

        public get duration(): number {
            return this._curClip ? this._curClip.duration : 0;
        }

        public get clip() {
            return this._curClip;
        }

        public update(delta: number): void {
            if (this._curClip) {
                this._elapsed += delta;
                this._update();
            }
        }

        public setClip(clip: T, startTime: number = 0, blendTime: number = 0): void {
            if (blendTime > 0 && this._curClip && clip) {
                const ab = AnimationBlend.create(this._curClip, this._startTime + this._elapsed, blendTime);;
                ab.retain();

                if (this._blendClips) {
                    let n = this._blendClips.length;
                    for (let i = n - 1; i >= 0; --i) {
                        const ab = this._blendClips[i];
                        const t = this._elapsed;
                        if (t >= ab.blendTime || t <= -ab.blendTime) {
                            for (let j = 0; j <= i; ++j) ab.release();
                            this._blendClips.splice(i, i + 1);
                            break;
                        }
                    }

                    this._blendClips[this._blendClips.length] = ab;
                } else {
                    this._blendClips = [ab];
                }
            } else if (this._blendClips) {
                const n = this._blendClips.length;
                if (n > 0) {
                    for (let i = 0; i < n; ++i) this._blendClips[i].release();
                    this._blendClips.length = 0;
                }
            }

            this._startTime = startTime;
            this._blendTime = blendTime;

            if (this._curClip !== clip) {
                if (clip) clip.retain();
                if (this._curClip) this._curClip.release();
                this._curClip = clip;
            }

            this._elapsed = 0;
            this._time = this._curClip ? this._time = this._curClip.wrap(this._startTime, this._curClip.duration) : 0;
        }

        protected abstract _update(): void;

        public destroy(): void {
            if (this._blendClips) {
                for (let i = 0, n = this._blendClips.length; i < n; ++i) this._blendClips[i].release();
                this._blendClips = null;
            }

            if (this._curClip) {
                this._curClip.release();
                this._curClip = null;
            }
        }

        protected _refDestroy(): void {
            this.destroy();
        }
    }
}