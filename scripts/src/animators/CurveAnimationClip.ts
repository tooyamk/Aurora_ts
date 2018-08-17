
/// <reference path="AbstractAnimatorClip.ts" />

namespace MITOIA {
    export class CurveAnimationClip extends AbstractAnimatorClip {
        public update(elapsed: number): void {
            let t = this._wrap(elapsed, this._duration);
        }
    }
}