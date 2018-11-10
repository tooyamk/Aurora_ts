namespace Aurora {
    export class Timer {
        private _isRunning = false;
        private _delay: number = 0;
        private _timeoutID: number = null;
        private _count: uint = 0;
        private _tickFn: () => void;

        private _onTick: Handler = null;

        /**
         * @param onTick (timer: Timer) => void.
         */
        constructor(delay: number, onTick: Handler = null) {
            this._delay = delay;
            this.onTick = onTick;

            this._tickFn = this._tick.bind(this);
        }

        public get onTick(): Handler {
            return this._onTick;
        }

        public set onTick(onTick: Handler) {
            if (this._onTick !== onTick) {
                if (onTick) onTick.retain();
                if (this._onTick) this._onTick.release();
                this._onTick = onTick;
            }
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
                
                this._timeoutID = setTimeout(this._tickFn, this._delay);
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

        private _tick(): void {
            this._timeoutID = null;
            if (this._isRunning) {
                if (this._count !== null && --this._count <= 0) this.stop();
                if (this._onTick) this._onTick.emit(this);
                if (this._timeoutID === null && this._isRunning) this._timeoutID = setTimeout(this._tickFn, this._delay);
            }
        }
    }
}