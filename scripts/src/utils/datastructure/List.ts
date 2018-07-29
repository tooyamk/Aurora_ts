namespace MITOIA {
    export interface ListIterator<T> {
        [Symbol.iterator](): ListIterator<T>;
        prev(): ListIterator<T>;
        next(): ListIterator<T>;
        value: T;
        done: boolean;
        node: ListNode<T>;
    }

    export class ListNode<T> {
        public prev: ListNode<T> = null;
        public next: ListNode<T> = null;

        public value: T;
    }

    export class List<T> {
        private _size: uint = 0;
        private _capacity: uint = 0;
        private _head: ListNode<T> = null;
        private _tail: ListNode<T> = null;
        private _cacheHead: ListNode<T> = null;

        constructor(capacity: uint = 0) {
            this._capacity = capacity;

            if (capacity > 0) {
                let head = new ListNode<T>();
                for (let i = 1; i < capacity; ++i) {
                    let node = new ListNode<T>();
                    node.next = head;
                    head = node;
                }

                this._cacheHead = head;
            }
        }

        private _getIterator(node: ListNode<T>, isForof: boolean = false): ListIterator<T> {
            let step = (itr: ListIterator<T>, callback: () => void) => {
                if (itr.node) {
                    callback();
                    if (itr.node) {
                        itr.value = itr.node.value;
                    } else {
                        itr.value = undefined;
                        itr.done = true;
                    }
                }
            }

            let itr = {
                value: <any>undefined,
                done: true,
                node: node,
                [Symbol.iterator]() {
                    isForof = true;
                    return this;
                },
                prev() {
                    step(this, () => {
                        this.node = this.node.prev;
                    });
                    return this;
                },
                next() {
                    if (isForof) {
                        isForof = false;
                    } else {
                        step(this, () => {
                            this.node = this.node.next;
                        });
                    }
                    return this;
                }
            }

            if (node) {
                itr.value = node.value;
                itr.done = false;
            }

            return itr;
        }

        public get begin(): ListIterator<T> {
            return this._getIterator(this._head);
        }

        public get end(): ListIterator<T> {
            return this._getIterator(this._tail);
        }

        [Symbol.iterator]() {
            return this._getIterator(this._head, true);
        }

        public get size(): uint {
            return this._size;
        }

        public get capacity(): uint {
            return this._capacity;
        }

        public find(value: T): ListIterator<T> {
            let node = this._head;
            while (node) {
                if (node.value === value) {
                    return this._getIterator(node);
                } else {
                    node = node.next;
                }
            }

            return this._getIterator(null);
        }

        public findlast(value: T): ListIterator<T> {
            let node = this._tail;
            while (node) {
                if (node.value === value) {
                    return this._getIterator(node);
                } else {
                    node = node.prev;
                }
            }

            return this._getIterator(null);
        }

        public erase(itr: ListIterator<T>, doNext: boolean = true): ListIterator<T> {
            let node = itr.node;
            if (node) {
                doNext ? itr.next() : itr.prev();

                let next = node.next;
                if (node.prev) {
                    node.prev.next = next;
                    if (next) {
                        next.prev = node.prev;
                    }
                } else {
                    if (next) {
                        this._head = next;
                        next.prev = null;
                    } else {
                        this._head = null;
                        this._tail = null;
                    }
                }

                this._pushNodeToCache(node);

                --this._size;
            }

            return itr;
        }

        public clear(): void {
            if (this._head) {
                let node = this._head;
                while (node) {
                    let next = node.next;
                    this._pushNodeToCache(node);
                    node = next;
                }

                this._head = null;
                this._tail = null;
                this._size = 0;
            }
        }

        public pushBack(value: T): void {
            let node = this._popNodeFromCache();
            node.value = value;
            if (this._head) {
                node.prev = this._tail;
                this._tail.next = node;
                this._tail = node;
            } else {
                this._head = node;
                this._tail = node;
            }
            ++this._size;
        }

        public pushFront(value: T): void {
            let node = this._popNodeFromCache();
            node.value = value;
            if (this._head) {
                node.next = this._head;
                this._head.prev = node;
                this._head = node;
            } else {
                this._head = node;
                this._tail = node;
            }
            ++this._size;
        }

        private _popNodeFromCache(): ListNode<T> {
            let node: ListNode<T>;
            if (this._cacheHead) {
                node = this._cacheHead;
                if (node.next) {
                    this._cacheHead = node.next;
                    node.next = null;
                } else {
                    this._cacheHead = null;
                }
            } else {
                node = new ListNode<T>();
                ++this._capacity;
            }

            return node;
        }

        private _pushNodeToCache(node: ListNode<T>): void {
            node.prev = null;
            node.next = null;
            node.value = undefined;
            if (this._cacheHead) {
                node.next = this._cacheHead;
                this._cacheHead = node;
            } else {
                this._cacheHead = node;
                this._cacheHead.prev = node;
            }
        }
    }
}