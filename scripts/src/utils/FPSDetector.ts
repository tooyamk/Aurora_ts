namespace MITOIA {
    export class FPSDetector {
        private _delay: number = 0;
        private _time: number = 0;
        private _fps: number = 0;
        private _count: number = 0;
        
        constructor(delay: number = 1000) {
            this._delay = delay;
            this.reset();
        }

        public get fps(): number {
            return this._fps;
        }

        public get delay(): number {
            return this._delay;
        }

        public set delay(value: number) {
            this._delay = value;
        }

        public reset(): void {
            this._time = Timer.utc;
            this._count = 0;
        }

        public record(): void {
            let t = Timer.utc;

            ++this._count;
            let d = t - this._time;
            if (d >= this._delay) {
                this._fps = 1000.0 * this._count / d;
                this._count = 0;
                this._time = t;
            }
        }
    }
}