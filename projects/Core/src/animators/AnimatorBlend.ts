namespace Aurora {
    export class AnimatorBlend implements IRef {
        private static _pool: AnimatorBlend[] = [];
        private static _num: uint = 0;

        private _clip: AbstractAnimationClip = null;
        private _startTime: number = 0;
        private _blendTime: number = 0;

        private _refCount: int = 0;
        private _idle = true;

        public static create(clip: AbstractAnimationClip, startTime: number, blendTime: number): AnimatorBlend {
            let ab: AnimatorBlend;
            if (AnimatorBlend._num > 0) {
                ab = AnimatorBlend._pool[--AnimatorBlend._num];
                AnimatorBlend._pool[AnimatorBlend._num] = null;
            } else {
                ab = new AnimatorBlend();
            }
            ab._idle = false;
            ab._clip = clip;
            if (clip) clip.retain();
            ab._startTime = startTime;
            ab._blendTime = blendTime;
            return ab;
        }

        public get clip(): AbstractAnimationClip {
            return this._clip;
        }

        public get startTime(): number {
            return this._startTime;
        }

        public get blendTime(): number {
            return this._blendTime;
        }

        public getRefCount(): int {
            return this._refCount;
        }

        public isDestroyed(): boolean {
            return false;
        }

        public retain(): void {
            ++this._refCount;
        }

        public release(): void {
            if (this._refCount > 0) --this._refCount;
            if (this._refCount <= 0 && !this._idle) {
                this._idle = true;
                if (this._clip) {
                    this._clip.release();
                    this._clip = null;
                }
                AnimatorBlend._pool[AnimatorBlend._num++] = this;
            }
        }
    }
}