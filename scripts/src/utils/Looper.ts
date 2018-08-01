namespace MITOIA {
    export class Looper {
        private _delay: number;
        private _callback: () => void = null;

        constructor(delay: number) {
            this._delay = delay;
        }

        public get delay(): number {
            return this._delay;
        }

        public set delay(value: number) {
            this._delay = value;
        }

        public run(callback: () => void, immediate: boolean = false): void {
            this._callback = callback;
            if (immediate) {
                this._doCallback();
            } else {
                if (this._callback) setTimeout(() => { this._doCallback(); }, this._delay);
            }
        }

        public stop(): void {
            this._callback = null;
        }

        private _doCallback(): void {
            if (this._callback) {
                let t = Timer.utc;
                this._callback();
                if (this._callback) {
                    t = this._delay - Timer.utc + t;
                    if (t < 0) t = 0;
                    if (this._callback) setTimeout(() => { this._doCallback(); }, t);
                }
            }
        }
    }
}