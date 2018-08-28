namespace Aurora.Collections {
    export interface IListIterator<T> {
        [Symbol.iterator](): IListIterator<T>;
        prev(): IListIterator<T>;
        next(): IListIterator<T>;
        value: T;
        done: boolean;
        node: ListNode<T>;
        list: List<T>;
    }

    class ListNode<T> {
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

        private _getIterator(node: ListNode<T>, isForof: boolean = false): IListIterator<T> {
            let step = (itr: IListIterator<T>, callback: () => void) => {
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

            let list = this;

            let itr = {
                list: list,
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

        public get begin(): IListIterator<T> {
            return this._getIterator(this._head);
        }

        public get end(): IListIterator<T> {
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

        public find(value: T): IListIterator<T> {
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

        public lastFind(value: T): IListIterator<T> {
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

        private _erase(node: ListNode<T>): void {
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

        public erase(itr: IListIterator<T>, doNext: boolean = true): IListIterator<T> {
            let node = itr.node;
            if (node && itr.list === this) {
                doNext ? itr.next() : itr.prev();

                this._erase(node);
            }

            return itr;
        }

        public eraseByValue(value: T): boolean {
            let node = this._head;
            while (node) {
                if (node.value === value) {
                    this._erase(node);
                    return true;
                } else {
                    node = node.next;
                }
            }
            return false;
        }

        public lastEarseByValue(value: T): boolean {
            let node = this._tail;
            while (node) {
                if (node.value === value) {
                    this._erase(node);
                    return true;
                } else {
                    node = node.prev;
                }
            }
            return false;
        }

        public earseAllSameValues(value: T): uint {
            let n = 0;
            let node = this._head;
            while (node) {
                let next = node.next;
                if (node.value === value) {
                    this._erase(node);
                    ++n;
                }
                node = next;
            }
            return n;
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

        private _insert(target: ListNode<T>, insertValue: T, before: boolean = true): void {
            let node = this._popNodeFromCache();
            node.value = insertValue;

            if (before) {
                let prev = target.prev;
                if (prev) {
                    prev.next = node;
                    node.prev = prev;
                    target.prev = node;
                    node.next = target;
                } else {
                    this._head.prev = node;
                    node.next = this._head;
                    this._head = node;
                }
            } else {
                let next = target.next;
                if (next) {
                    next.prev = node;
                    node.next = next;
                    target.next = node;
                    node.prev = target;
                } else {
                    this._tail.next = node;
                    node.prev = this._tail;
                    this._tail = node;
                }
            }
            ++this._size;
        }

        public insertByValue(target: T, insertValue: T, before: boolean = true): boolean {
            let node = this._head;
            while (node) {
                if (node.value === target) {
                    this._insert(node, insertValue, before);

                    return true;
                } else {
                    node = node.next;
                }
            }

            return false;
        }

        public lastInsertByValue(target: T, insertValue: T, before: boolean = true): boolean {
            let node = this._tail;
            while (node) {
                if (node.value === target) {
                    this._insert(node, insertValue, before);

                    return true;
                } else {
                    node = node.prev;
                }
            }

            return false;
        }
        
        public insert(itr: IListIterator<T>, insertValue: T, before: boolean = true): boolean {
            if (itr.node && itr.list === this) {
                this._insert(itr.node, insertValue, before);

                return true;
            } else {
                return false;
            }
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