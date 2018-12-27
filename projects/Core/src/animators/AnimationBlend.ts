namespace Aurora {
    export class AnimationBlend implements IRef {
        private static _pool: AnimationBlend[] = [];
        private static _num: uint = 0;

        private _clip: AbstractAnimationClip = null;
        private _startTime: number = 0;
        private _blendTime: number = 0;

        private _refCount: int = 0;
        private _idle = true;

        public static create(clip: AbstractAnimationClip, startTime: number, blendTime: number): AnimationBlend {
            let ab: AnimationBlend;
            if (AnimationBlend._num > 0) {
                ab = AnimationBlend._pool[--AnimationBlend._num];
                AnimationBlend._pool[AnimationBlend._num] = null;
            } else {
                ab = new AnimationBlend();
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
                AnimationBlend._pool[AnimationBlend._num++] = this;
            }
        }
    }
}