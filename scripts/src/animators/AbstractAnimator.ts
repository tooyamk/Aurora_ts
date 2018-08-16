namespace MITOIA {
    export const enum AnimationWrapMode {
        CLAMP = 0,
        LOOP = 1,
        PINGPONG = 2
    }

    export abstract class AbstractAnimator {
        protected static WRAP_CONTROLLERS = [(elapsed: number, duration: number) => {
            if (elapsed < 0) {
                return 0;
            } else if (elapsed < duration) {
                return duration;
            } else {
                return elapsed;
            }
        }, (elapsed: number, duration: number) => {
            return elapsed % duration;
        }, (elapsed: number, duration: number) => {
            let d = duration * 2.0;
            elapsed %= d;
            return elapsed < duration ? elapsed : d - elapsed;
        }];

        protected _curClip: AnimationClip = null;
        protected _elapsed: number = 0;
        protected _wrapFunc: (elapsed: number, duration: number) => number = null;
        protected _clipReady: boolean = false;

        public get elapsed(): number {
            return this._elapsed;
        }

        public set elapsed(value: number) {
            this._elapsed = value;
        }

        public update(time: number): void {
            if (this._clipReady && this._curClip.duration > 0) {
                this._elapsed += time;
                let t = this._wrapFunc(this._elapsed, this._curClip.duration);
                this._update(t);
            }
        }

        public setClip(clip: AnimationClip, startTime: number = 0.0, blendTime: number = 0.0): void {
            this._curClip = clip;
            if (clip) {
                this._elapsed = startTime;
                this._wrapFunc = AbstractAnimator.WRAP_CONTROLLERS[clip.wrap];
                this._clipReady = this._wrapFunc !== undefined;
            } else {
                this._elapsed = 0;
                this._wrapFunc = null;
                this._clipReady = false;
            }
        }

        protected _update(time: number): void {
        }
    }
}