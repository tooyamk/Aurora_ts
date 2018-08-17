namespace MITOIA {
    export class Animator<T extends AbstractAnimatorClip> {
        protected _curClip: AbstractAnimatorClip = null;
        protected _elapsed: number = 0;
        protected _wrapFunc: (elapsed: number, duration: number) => number = null;

        public get elapsed(): number {
            return this._elapsed;
        }

        public set elapsed(value: number) {
            if (this._curClip) {
                let delta = value - this._elapsed;
                this._elapsed = value;
                this._update(delta);
            }
        }

        public get clip() {
            return this._curClip;
        }

        public update(delta: number): void {
            if (this._curClip) {
                this._elapsed += delta;
                this._update(delta);
            }
        }

        public setClip(clip: T, startTime: number = 0.0, blendTime: number = 0.0): void {
            this._curClip = clip;
            if (clip) {
                this._elapsed = startTime;
            } else {
                this._elapsed = 0;
            }
        }

        protected _update(delta: number): void {
            this._curClip.update(this._elapsed);
        }
    }
}