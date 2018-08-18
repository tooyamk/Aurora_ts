namespace MITOIA {
    interface IInternalTimer {
        now(): number;
    }

    class InternalDateTimer implements IInternalTimer {
        public now(): number {
            return Date.now();
        }
    }

    class InternalPerformanceTimer implements IInternalTimer {
        private _performance: any;
        private _timing: any;

        constructor() {
            this._performance = window["performance"];
            this._timing = this._performance.timing;
        }

        public static get isSupport(): boolean {
            let p: any = window["performance"];
            if (p && p.now) {
                let t: any = p.timing;
                if (t) return t.navigationStart;
            }
            return false;
        }
        public now(): number {
            return this._timing.navigationStart + this._performance.now();
        }
    }

    export abstract class Timer {
        private static _timer: IInternalTimer = InternalPerformanceTimer.isSupport ? new InternalPerformanceTimer() : new InternalDateTimer();

        public static get utc(): number {
            return Timer._timer.now();
        }
    }
}