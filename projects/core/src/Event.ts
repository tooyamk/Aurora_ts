namespace Aurora {
    export class Event {
        private static _pool: Event[] = [];
        private static _num: uint = 0;

        public target: any = null;
        public data: any = null;

        public static create(target: any, data: any): Event {
            let e: Event;
            if (Event._num > 0) {
                e = Event._pool[Event._num];
                Event._pool[Event._num--] = null;
            } else {
                e = new Event();
            }
            e.target = target;
            e.data = data;
            return e;
        }

        public release(): void {
            this.target = null;
            this.data = null;
            Event._pool[Event._num++] = this;
        }
    }

    export type HandlerType = (e: Event) => void;

    export class Handler {
        private static _pool: Handler[] = [];
        private static _num: uint = 0;

        public caller: any = null;
        public callback: HandlerType = null;
        public once: boolean;

        private _isIdle: boolean = true;

        public static create(caller: any, callback: HandlerType, once: boolean): Handler {
            let h: Handler;
            if (Handler._num > 0) {
                h = Handler._pool[--Handler._num];
                Handler._pool[Handler._num] = null;
            } else {
                h = new Handler();
            }
            h.caller = caller;
            h.callback = callback;
            h.once = once;
            h._isIdle = false;
            return h;
        }

        public get isIdle(): boolean {
            return this._isIdle;
        }

        public emit(e: Event): boolean {
            if (this.callback) {
                if (this.caller) {
                    this.callback.call(this.caller, e);
                } else {
                    this.callback(e);
                }
            }
            if (this.once) {
                this.release();
                return true;
            } else {
                return false;
            }
        }

        public release(): void {
            if (!this._isIdle) {
                this.caller = null;
                this.callback = null;
                this._isIdle = true;
                Handler._pool[Handler._num++] = this;
            }
        }
    }

    export class EventDispatcher<T> {
        private _target: T;
        private _map: { [key: string]: Handler[] } = null;

        constructor(target: T) {
            this._target = target;
        }

        public get target(): T {
            return this._target;
        }

        public has(type: string, caller: any, callback: HandlerType): boolean {
            const arr = this._map[type];
            if (arr) {
                if (caller === undefined) caller = null;
                return this._getHandler(arr, caller, callback) !== null;
            }
            return false;
        }

        private _getHandler(handlers: Handler[], caller: any, callback: HandlerType): Handler {
            for (let i = 0, n = handlers.length; i < n; ++i) {
                const h = handlers[i];
                if (h.caller === caller && h.callback === callback) return h;
            }
            return null;
        }

        public on(type: string, caller: any, callback: HandlerType, once: boolean = false): void {
            if (type && callback) {
                if (caller === undefined) caller = null;
                const arr = this._map[type];
                if (arr) {
                    const h = this._getHandler(arr, caller, callback);
                    if (h) {
                        h.once = once;
                    } else {
                        arr.push(Handler.create(caller, callback, once));
                    }
                } else {
                    this._map[type] = [Handler.create(caller, callback, once)];
                }
            }
        }

        public off(type: string, caller: any, callback: HandlerType): boolean {
            if (type && callback) {
                if (caller === undefined) caller = null;
                const arr = this._map[type];
                if (arr) {
                    for (let i = 0, n = arr.length; i < n; ++i) {
                        const h = arr[i];
                        if (h.caller === caller && h.callback === callback) {
                            arr.splice(i, 1);
                            h.release();
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        public emit(type: string, data: any = null): void {
            let arr = this._map[type];
            if (arr) {
                const n = arr.length;
                if (n > 0) {
                    const e = Event.create(this._target, data);
                    if (n === 1) {
                        const h = arr[0];
                        if (h.emit(e)) arr.length = 0;
                    } else {
                        arr = arr.concat();
                        for (let i = 0; i < n; ++i) arr[i].emit(e);
                    }
                    e.release();
                }
            }
        }

        public offAll(type: string = null): void {
            if (type) {
                const arr = this._map[type];
                if (arr) {
                    const n = arr.length;
                    if (n > 0) {
                        for (let i = 0, n = arr.length; i < n; ++i) arr[i].release();
                        arr.length = 0;
                    }
                }
            } else {
                for (const key in this._map) {
                    const arr = this._map[key];
                    const n = arr.length;
                    if (n > 0) {
                        for (let i = 0, n = arr.length; i < n; ++i) arr[i].release();
                        arr.length = 0;
                    }
                }
            }
        }

        public destory(): void {
            if (this._map) {
                this.offAll();
                this._map = null;
            }

            this._target = null;
        }
    }
}