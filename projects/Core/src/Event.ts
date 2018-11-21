///<reference path="Ref.ts"/>

namespace Aurora {
    export class Event implements IRef {
        private static _pool: Event[] = [];
        private static _num: uint = 0;

        protected _type: string = null;
        protected _target: any = null;
        protected _data: any = null;

        private _refCount: int = 0;
        private _idle = true;

        public static create(type: string, target: any, data: any): Event {
            let e: Event;
            if (Event._num > 0) {
                e = Event._pool[Event._num];
                Event._pool[Event._num--] = null;
            } else {
                e = new Event();
            }
            e._idle = false;
            e._type = type;
            e._target = target;
            e._data = data;
            return e;
        }

        public get type(): string {
            return this._type;
        }

        public get target(): any {
            return this._target;
        }

        public get data(): any {
            return this._data;
        }

        public getRefCount(): int {
            return this._refCount;
        }

        public isDestroyed(): boolean {
            return false;
        }

        public retain(): void {
            ++this._refCount;
        }

        public release(): void {
            if (this._refCount > 0) --this._refCount;
            if (this._refCount <= 0 && !this._idle) {
                this._idle = true;
                this._type = null;
                this._target = null;
                this._data = null;
                Event._pool[Event._num++] = this;
            }
        }
    }

    export type HandlerType = (...args: any[]) => void;

    export class Handler implements IRef {
        private static _pool: Handler[] = [];
        private static _num: uint = 0;

        public caller: any = null;
        public callback: HandlerType = null;
        public once: boolean;

        private _refCount: int = 0;
        private _idle = true;

        public static create(caller: any, callback: HandlerType, once: boolean = false): Handler {
            let h: Handler;
            if (Handler._num > 0) {
                h = Handler._pool[--Handler._num];
                Handler._pool[Handler._num] = null;
            } else {
                h = new Handler();
            }
            h._idle = false;
            h.caller = caller;
            h.callback = callback;
            h.once = once;
            return h;
        }

        public getRefCount(): int {
            return this._refCount;
        }

        public isDestroyed(): boolean {
            return false;
        }

        public get isIdle(): boolean {
            return this._refCount === 0;
        }

        public emit(...args: any[]): boolean {
            if (this.callback) {
                if (this.caller) {
                    this.callback.call(this.caller, ...args);
                } else {
                    this.callback(...args);
                }
            }
            if (this.once) {
                this.release();
                return true;
            } else {
                return false;
            }
        }

        public retain(): void {
            ++this._refCount;
        }

        public release(): void {
            if (this._refCount > 0) --this._refCount;
            if (this._refCount <= 0 && !this._idle) {
                this._idle = true;
                this.caller = null;
                this.callback = null;
                Handler._pool[Handler._num++] = this;
            }
        }
    }

    export type EventDispatcherHandler = (e: Event) => void;

    export class EventDispatcher<T> {
        private _target: T;
        private _map: { [key: string]: Handler[] } = {};

        constructor(target: T) {
            this._target = target;
        }

        public get target(): T {
            return this._target;
        }

        public has(type: string, handler: Handler): boolean {
            if (type && handler) {
                const arr = this._map[type];
                if (arr) {
                    return !!this._getHandler(arr, handler);
                }
                return false;
            } else {
                return false;
            }
        }

        private _getHandler(handlers: Handler[], handler: Handler): Handler {
            const idx = handlers.indexOf(handler);
            return idx < 0 ? null : handlers[idx];
        }

        /**
         * @param handler (e: Event) => void.
         */
        public on(type: string, handler: Handler, once: boolean = false): void {
            if (type && handler) {
                const arr = this._map[type];
                if (arr) {
                    const h = this._getHandler(arr, handler);
                    if (h) {
                        h.once = once;
                    } else {
                        handler.retain();
                        arr[arr.length] = handler;
                    }
                } else {
                    this._map[type] = [handler];
                }
            }
        }

        public off(type: string, handler: Handler): boolean {
            if (type && handler) {
                const arr = this._map[type];
                if (arr) {
                    const idx = arr.indexOf(handler);
                    if (idx >= 0) {
                        arr[idx].release();
                        arr.splice(idx, 1); 
                        return true;
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
                    const e = Event.create(type, this._target, data);
                    e.retain();
                    if (n === 1) {
                        const h = arr[0];
                        if (h.emit(e)) {
                            h.release();
                            arr.length = 0;
                        }
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