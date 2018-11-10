namespace Aurora {
    export class Task {
        private _running: boolean = false;
        private _onStart: Handler = null;
        private _onFinish: Handler = null;

        constructor(onStart: Handler = null) {
            this._onStart = onStart;
            if (onStart) onStart.retain();
        }

        public start(onFinish: Handler): void {
            if (!this._running) {
                this._running = true;
                this._onFinish = onFinish;
                if (onFinish) onFinish.retain();
                if (this._onStart) {
                    const func = this._onStart;
                    this._onStart = null;
                    func.emit(this);
                    func.release();
                }
            }
        }

        public finish(): void  {
            if (this._running) {
                this._running = false;

                if (this._onFinish) {
                    this._onFinish.emit();
                    this._onFinish.release();
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
        private _onFinish: Handler = null;

        /**
         * @param onStart (task: Task) => void.
         */
        public createTask(onStart: Handler): void {
            this._tasks[this._tasks.length] = new Task(onStart);
        }

        /**
         * @param onFinish (taskQueue: TaskQueue) => void.
         */
        public start(onFinish: Handler = null): void {
            if (!this._running) {
                this._running = true;
                this._onFinish = onFinish;
                if (onFinish) onFinish.retain();
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
                        func.emit(this);
                        func.release();
                    }
                } else {
                    this._tasks[this._cur++].start(Handler.create(this, this._taskFinish, true));
                }
            }
        }
    }
}