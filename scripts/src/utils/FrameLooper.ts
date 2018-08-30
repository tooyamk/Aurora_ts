namespace Aurora {
    export const enum FrameLooperType {
        STANDARD,
        HIGH_PRECISION,
        ANIMATION_FRAME
    }

    export class FrameLooper {
        private _callback: (delta: number) => void = null;
        private _prevTime: number = null;
        private _delta: number;
        private _timer: Timer;
        private _type: FrameLooperType = FrameLooperType.STANDARD;
        private _timerID: number = null;

        constructor(delta: number, type: FrameLooperType = FrameLooperType.STANDARD) {
            this._delta = delta;
            this._type = type;

            if (type === FrameLooperType.HIGH_PRECISION) {
                this._timer = new Timer(0.05, () => {
                    let t = Timer.utc;
                    let d = t - this._prevTime;
                    if (d + 0.01 >= this._delta) {
                        this._prevTime = t;
                        this._callback(d);
                    }
                }, TimerType.HIGH_PRECISION);
            }
        }

        public get delta(): number {
            return this._delta;
        }

        public set delta(value: number) {
            this._delta = value;
        }

        public start(callback: (delta: number) => void): void {
            this.stop();

            this._callback = callback;
            if (callback) {
                this._prevTime = Timer.utc;

                if (this._type === FrameLooperType.STANDARD) {
                    this._timerID = setTimeout(() => { this._timeoutTick(); }, this._delta);
                } else if (this._type === FrameLooperType.HIGH_PRECISION) {
                    this._timer.start();
                } else if (this._type === FrameLooperType.ANIMATION_FRAME) {
                    this._timerID = requestAnimationFrame(() => { this._animationFrameTick(); });
                }
            }
        }

        public stop(): void {
            if (this._type === FrameLooperType.STANDARD) {
                if (this._timerID !== null) {
                    if (this._timerID !== undefined) clearTimeout(this._timerID);
                    this._timerID = null;
                }
            } else if (this._type === FrameLooperType.HIGH_PRECISION) {
                if (this._timer.isRunning) this._timer.stop();
            } else if (this._type === FrameLooperType.ANIMATION_FRAME) {
                if (this._timerID !== null) {
                    if (this._timerID !== undefined) cancelAnimationFrame(this._timerID);
                    this._timerID = null;
                }
            }

            this._callback = null;
        }

        private _timeoutTick(): void {
            this._timerID = undefined;
            let t = Timer.utc;
            let d = t - this._prevTime;
            this._prevTime = t;
            this._callback(d);

            if (this._timerID === undefined) {
                t = this._delta - Timer.utc + t;
                if (t < 0) t = 0;
                this._timerID = setTimeout(() => { this._timeoutTick(); }, t | 0);
            }
        }

        private _animationFrameTick(): void {
            this._timerID = undefined;
            let t = Timer.utc;
            let d = t - this._prevTime;
            this._prevTime = t;
            this._callback(d);

            if (this._timerID === undefined) this._timerID = requestAnimationFrame(() => { this._animationFrameTick(); });
        }
    }
}