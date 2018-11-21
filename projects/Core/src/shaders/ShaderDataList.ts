///<reference path="../Ref.ts"/>

namespace Aurora {
    class StackNode {
        private static _tail: StackNode = null;

        public prev: StackNode = null;
        public next: StackNode = null;

        public value: any = null;

        public release(): void {
            this.next = null;
            this.value = null;

            this.prev = StackNode._tail ? StackNode._tail : null;
            StackNode._tail = this;
        }

        public static create(): StackNode {
            if (StackNode._tail) {
                const node = StackNode._tail;
                StackNode._tail = node.prev;
                node.prev = null;
                return node;
            } else {
                return new StackNode();
            }
        }
    }

    export class ShaderDataList<S extends Ref, T> {
        private _head: StackNode = null;
        private _tail: StackNode = null;

        public pushBack(value: S): ShaderDataList<S, T> {
            if (value) {
                const node = StackNode.create();

                value.retain();
                node.value = value;
                if (this._head) {
                    node.prev = this._tail;
                    this._tail.next = node;
                    this._tail = node;
                } else {
                    this._head = node;
                    this._tail = node;
                }
            }

            return this;
        }

        public pushBackByList(stack: ShaderDataList<S, T>): ShaderDataList<S, T> {
            if (stack) {
                let node = stack._head;
                while (node) {
                    this.pushBack(node.value);
                    node = node.next;
                }
            }

            return this;
        }  

        public pushFront(value: S): ShaderDataList<S, T> {
            if (value) {
                const node = StackNode.create();

                value.retain();
                node.value = value;
                if (this._head) {
                    node.next = this._head;
                    this._head.prev = node;
                    this._head = node;
                } else {
                    this._head = node;
                    this._tail = node;
                }
            }

            return this;
        }

        public clear(): void {
            if (this._head) {
                let node = this._head;
                while (node) {
                    const next = node.next;
                    if (node.value) node.value.release();
                    node.release();
                    node = next;
                }

                this._head = null;
                this._tail = null;
            }
        }

        public eraseTail(): void {
            this._erase(this._tail);
        }

        public getValue(name: string): T {
            let node = this._head;
            while (node) {
                const value = <T>node.value.getValue(name);
                if (value) return value;
                node = node.next;
            }
            return null;
        }

        private _erase(node: StackNode): void {
            const next = node.next;
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

            if (node.value) node.value.release();
            node.release();
        }

        public static isUnifromsEqual(s0: ShaderUniformsList, s1: ShaderUniformsList, info: GLProgramUniformInfo[]): boolean {
            if (s0 === s1) return true;
            if (s0) {
                if (s1) {
                    for (let i = 0, n = info.length; i < n; ++i) {
                        const name = info[i].name;
                        if (!ShaderUniforms.Value.isEqual(s0.getValue(name), s1.getValue(name))) return false;
                    }
                } else {
                    return false;
                }
            }
            return !s1;
        }
    }
}