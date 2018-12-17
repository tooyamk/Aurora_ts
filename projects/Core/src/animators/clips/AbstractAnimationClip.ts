namespace Aurora {
    export abstract class AbstractAnimationClip extends Ref {
        public name: string = null;

        protected _duration: number = 0;
        protected _wrap = AnimationWrap.Clamp;

        public get duration(): number {
            return this._duration;
        }

        public get wrap(): AnimationWrapMethod {
            return this._wrap;
        }

        public set wrap(value: AnimationWrapMethod) {
            if (value && this._wrap !== value) this._wrap = value;
        }

        public abstract update(start: number, elapsed: number, blend: AnimatorBlend[]): number;
    }
}