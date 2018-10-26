namespace Aurora {
    export class Task {
        private _running: boolean = false;
        private _onStart: (task: Task) => void = null;
        private _onFinish: Handler = null;

        constructor(onStart: (task: Task) => void = null) {
            this._onStart = onStart;
        }

        public start(onFinish: Handler): void {
            if (!this._running) {
                this._running = true;
                this._onFinish = onFinish;
                if (this._onStart) {
                    const func = this._onStart;
                    this._onStart = null;
                    func(this);
                }
            }
        }

        public finish(): void  {
            if (this._running) {
                this._running = false;

                if (this._onFinish) {
                    this._onFinish.emit(null);
                    this._onFinish = null;
                }
            }
        }
    }

    export class TaskQueue {
        private _tasks: Task[] = [];
        private _running: boolean = false;
        private _cur: int = -1;
        private _process: number = 0;
        private _onFinish: () => void = null;

        public createTask(onStart: (task: Task) => void = null): void {
            this._tasks.push(new Task(onStart));
        }

        public start(onFinish: () => void = null): void {
            if (!this._running) {
                this._running = true;
                this._onFinish = onFinish;
                this._cur = 0;

                this._taskFinish();
            }
        }

        private _taskFinish(): void {
            if (this._running) {
                this._process = this._tasks.length === 0 ? 1 : (this._cur <= 0 ? 0 : this._cur / this._tasks.length);
                if (this._cur >= 1) this._tasks[this._cur - 1] = null;

                if (this._cur >= this._tasks.length) {
                    this._tasks.length = 0;
                    if (this._onFinish) {
                        let func = this._onFinish;
                        this._onFinish = null;
                        func();
                    }
                } else {
                    this._tasks[this._cur++].start(Handler.create(this, this._taskFinish, true));
                }
            }
        }
    }
}