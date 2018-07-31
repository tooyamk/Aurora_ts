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
            if (this._callback) {
                if (immediate) this._callback();
                if (this._callback) setTimeout(() => { this._tick(); }, this._delay);
            }
        }

        public stop(): void {
            this._callback = null;
        }

        private _tick(): void {
            if (this._callback) {
                this._callback();
                setTimeout(() => { this._tick(); }, this._delay);
            }
        }
    }
}