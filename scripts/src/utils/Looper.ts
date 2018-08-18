namespace MITOIA {
    export class Looper {
        private _delta: number;
        private _callback: (delta: number) => void = null;
        private _id: number = null;
        private _prevTime: number = null;

        constructor(delta: number) {
            this.delta = delta;
        }

        public get delta(): number {
            return this._delta;
        }

        public set delta(value: number) {
            this._delta = value;
        }

        public run(callback: (delta: number) => void, immediate: boolean = false): void {
            this.stop();
            this._prevTime = Timer.utc;
            this._callback = callback;
            if (immediate) {
                this._doCallback();
            } else {
                if (this._callback) this._id = setTimeout(() => { this._doCallback(); }, this._delta);
            }
        }

        public stop(): void {
            if (this._callback) {
                if (this._id !== null) {
                    clearTimeout(this._id);
                    this._id = null;
                }
                this._callback = null;
            }
        }

        private _doCallback(): void {
            if (this._callback) {
                let t = Timer.utc;
                this._callback(t - this._prevTime);
                this._prevTime = t;
                if (this._callback) {
                    t = this._delta - Timer.utc + t;
                    if (t < 0) t = 0;
                    if (this._callback) this._id = setTimeout(() => { this._doCallback(); }, t);
                }
            }
        }
    }
}