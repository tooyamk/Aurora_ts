namespace MITOIA {
    export class FrameLooper {
        private _callback: (delta: number) => void = null;
        private _prevTime: number = null;
        private _delta:number;
        private _timer: Timer;

        constructor(delta: number) {
            this._delta = delta;
            this._timer = new Timer(0.05, () => {
                if (this._callback) {
                    let t = Timer.utc;
                    let d = t - this._prevTime;
                    if (d + 0.01 >= this._delta) {
                        let delta = t - this._prevTime;
                        this._prevTime = t;
                        this._callback(delta);
                    }
                }
            });
        }

        public get delta(): number {
            return this._delta;
        }

        public set delta(value: number) {
            this._delta = value;
        }

        public start(callback: (delta: number) => void): void {
            this.stop();
            this._prevTime = Timer.utc;
            this._callback = callback;
            this._timer.start();
        }

        public stop(): void {
            if (this._timer.isRunning) {
                this._timer.stop();
                this._callback = null;
            }
        }
    }
}