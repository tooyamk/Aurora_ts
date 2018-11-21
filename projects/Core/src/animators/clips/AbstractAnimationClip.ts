namespace Aurora {
    export abstract class AbstractAnimationClip {
        public name: string = null;

        protected _duration: number = 0;
        protected _wrap = AnimatorWrap.Clamp;

        public get duration(): number {
            return this._duration;
        }

        public get wrap(): AnimatorWrapType {
            return this._wrap;
        }

        public set wrap(value: AnimatorWrapType) {
            if (value && this._wrap !== value) this._wrap = value;
        }

        public abstract update(elapsed: number): number;
    }
}