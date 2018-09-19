namespace Aurora {
    export class Timer {
        private _isRunning: boolean = false;
        private _delay: number = 0;
        private _timeoutID: number = null;
        private _count: uint = 0;

        public callback: () => void = null;

        constructor(delay: number, callback: () => void = null) {
            this._delay = delay;
            this.callback = callback;
        }

        public get delay(): number {
            return this._delay;
        }

        public set delay(value: number) {
            this._delay = value;
        }

        public get isRunning(): boolean {
            return this._isRunning;
        }

        public start(count: uint = 0): void {
            if (!this._isRunning) {
                this._isRunning = true;
                this._count = count === null || count === undefined || count <= 0 ? null : count;
                
                this._timeoutID = setTimeout(() => { this._standardTick() }, this._delay);
            }
        }

        public stop(): void {
            if (this._isRunning) {
                this._isRunning = false;

                if (this._timeoutID !== null) {
                    clearTimeout(this._timeoutID);
                    this._timeoutID = null;
                }
            }
        }

        private _standardTick(): void {
            this._timeoutID = null;
            if (this._isRunning) {
                if (this._count !== null && --this._count <= 0) this.stop();
                if (this.callback) this.callback();
                if (this._timeoutID === null && this._isRunning) this._timeoutID = setTimeout(() => { this._standardTick() }, this._delay);
            }
        }
    }
}