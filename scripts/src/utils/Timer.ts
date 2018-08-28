namespace Aurora {
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

    export class Timer {
        private static _timer: IInternalTimer = InternalPerformanceTimer.isSupport ? new InternalPerformanceTimer() : new InternalDateTimer();
        
        private static readonly TICK_MSG = "__timer_tick__";
        private static _isTickInit: boolean = false;
        private static _runTickList: Timer[] = [];
        private static _numRunTicks: uint = 0;
        private static _addTickList: Timer[] = [];
        private static _numAddTicks: uint = 0;
        private static _removeTickList: Timer[] = [];
        private static _numRemoveTicks: uint = 0;
        private static _isTickProcessing: boolean = false;
        private static readonly FLAG_IN_RUNNING_LIST: uint = 0b1;
        private static readonly FLAG_IN_ADDING_LIST: uint = 0b10;
        private static readonly FLAG_IN_REMOVING_LIST: uint = 0b100;
        private static readonly FLAG_IN_WAITTING_LIST: uint = Timer.FLAG_IN_ADDING_LIST | Timer.FLAG_IN_REMOVING_LIST;

        private _isRunning: boolean = false;
        private _delta: number = 0;
        private _beginTime: number = 0;
        private _flag: uint = 0;

        public callback: () => void = null;

        constructor(delta: number, callback: () => void = null) {
            this._delta = delta;
            this.callback = callback;
        }

        public static get utc(): number {
            return Timer._timer.now();
        }

        public get delta(): number {
            return this._delta;
        }

        public set delta(value: number) {
            this._delta = value;
        }

        public get isRunning(): boolean {
            return this._isRunning;
        }

        public start(): void {
            if (!this._isRunning) {
                this._isRunning = true;
                Timer._addToTickList(this);
            }
        }

        public stop(): void {
            if (this._isRunning) {
                this._isRunning = false;
                Timer._removeFromTickList(this);
            }
        }

        private _tick(): void {
            if (this.callback) this.callback();
        }

        private static _addToTickList(timer: Timer): void {
            timer._beginTime = Timer.utc;

            if (Timer._isTickProcessing) {
                if (timer._flag & Timer.FLAG_IN_REMOVING_LIST) {
                    Timer._removeTickList.splice(Timer._removeTickList.indexOf(timer), 1);
                    --Timer._numRemoveTicks;
                    timer._flag &= ~Timer.FLAG_IN_REMOVING_LIST;
                }
            } else {
                if (timer._flag & Timer.FLAG_IN_ADDING_LIST) {
                    Timer._addTickList.splice(Timer._addTickList.indexOf(timer), 1);
                    --Timer._numAddTicks;
                }
                if (timer._flag & Timer.FLAG_IN_REMOVING_LIST) {
                    Timer._removeTickList.splice(Timer._removeTickList.indexOf(timer), 1);
                    --Timer._numRemoveTicks;
                }
                if (!(timer._flag & Timer.FLAG_IN_RUNNING_LIST)) {
                    Timer._runTickList[Timer._numRunTicks++] = timer;
                }
                timer._flag = Timer.FLAG_IN_RUNNING_LIST;
            }
            
            if (!Timer._isTickInit) {
                Timer._isTickInit = true;
                window.addEventListener("message", (evt: MessageEvent) => {
                    if (evt.source === window && evt.data === Timer.TICK_MSG) {
                        evt.stopPropagation();
                        Timer._isTickProcessing = true;
                        for (let i = 0; i < Timer._numRunTicks; ++i) {
                            let timer = Timer._runTickList[i];
                            if (timer._isRunning) {
                                let t = Timer.utc - timer._beginTime;
                                if (t >= timer._delta) {
                                    timer._tick();
                                    if (timer._isRunning) timer._beginTime = Timer.utc;
                                }
                            }
                        }
                        Timer._isTickProcessing = false;

                        if (Timer._numRemoveTicks > 0) {
                            for (let i = 0; i < Timer._numRemoveTicks; ++i) {
                                let timer = Timer._removeTickList[i];
                                timer._flag = 0;
                                Timer._runTickList.splice(Timer._runTickList.indexOf(timer), 1);
                                --Timer._numRunTicks;
                                Timer._removeTickList[i] = null;
                            }
                            Timer._numRemoveTicks = 0;
                        }

                        if (Timer._numAddTicks > 0) {
                            for (let i = 0; i < Timer._numAddTicks; ++i) {
                                let timer = Timer._addTickList[i];
                                timer._flag &= ~Timer.FLAG_IN_ADDING_LIST;
                                Timer._runTickList[Timer._numRunTicks++] = timer;
                                timer._flag |= Timer.FLAG_IN_RUNNING_LIST;
                                Timer._addTickList[i] = null;
                            }
                            Timer._numAddTicks = 0;
                        }

                        if (Timer._numRunTicks > 0) window.postMessage(Timer.TICK_MSG, "*");
                    }
                });
            }

            window.postMessage(Timer.TICK_MSG, "*");
        }

        private static _removeFromTickList(timer: Timer): void {
            if (timer._flag & Timer.FLAG_IN_ADDING_LIST) {
                Timer._addTickList.splice(Timer._addTickList.indexOf(timer), 1);
                --Timer._numAddTicks;
                timer._flag &= ~Timer.FLAG_IN_ADDING_LIST;
            }

            if (Timer._isTickProcessing) {
                if ((timer._flag & Timer.FLAG_IN_RUNNING_LIST) && !(timer._flag & Timer.FLAG_IN_REMOVING_LIST)) {
                    Timer._removeTickList[Timer._numRemoveTicks++] = timer;
                    timer._flag |= Timer.FLAG_IN_REMOVING_LIST;
                }
            } else {
                if (timer._flag & Timer.FLAG_IN_RUNNING_LIST) {
                    Timer._runTickList.splice(Timer._runTickList.indexOf(timer), 1);
                    --Timer._numRunTicks;
                }
                if (timer._flag & Timer.FLAG_IN_ADDING_LIST) {
                    Timer._addTickList.splice(Timer._addTickList.indexOf(timer), 1);
                    --Timer._numAddTicks;
                }
                if (timer._flag & Timer.FLAG_IN_REMOVING_LIST) {
                    Timer._removeTickList.splice(Timer._removeTickList.indexOf(timer), 1);
                    --Timer._numRemoveTicks;
                }

                timer._flag = 0;
            }
        }
    }
}