namespace Aurora {
    export abstract class AbstractAnimatorClip {
        protected _elapsed: number = 0.0;
        protected _duration: number = 0.0;
        protected _wrap: AnimatorWrapType = AnimatorWrap.Clamp;

        public get duration(): number {
            return this._duration;
        }

        public get wrap(): AnimatorWrapType {
            return this._wrap;
        }

        public set wrap(value: AnimatorWrapType) {
            if (value && this._wrap !== value) {
                this._wrap = value;
            }
        }

        public update(elapsed: number): void {}
    }
}