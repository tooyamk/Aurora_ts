/// <reference path="../math/Matrix44.ts" />
/// <reference path="../math/Vector.ts" />

namespace MITOIA {
    export class Node {
        protected static _tmpVec3: Vector3 = Vector3.Zero;
        protected static _tmpMat: Matrix44 = new Matrix44();

        protected static readonly LOCAL_MATRIX_DIRTY: uint = 0b1;
        protected static readonly WORLD_MATRIX_DIRTY: uint = 0b10;
        protected static readonly INVERSE_WORLD_MATRIX_DIRTY: uint = 0b100;
        protected static readonly WORLD_ROTATION_DIRTY: uint = 0b1000;
        protected static readonly WORLD_MATRIX_AND_INVERSE_DIRTY: uint = Node.WORLD_MATRIX_DIRTY | Node.INVERSE_WORLD_MATRIX_DIRTY;
        protected static readonly WORLD_ALL_DIRTY: uint = Node.WORLD_MATRIX_AND_INVERSE_DIRTY | Node.WORLD_ROTATION_DIRTY;
        protected static readonly LOCAL_AND_WORLD_ALL_DIRTY: uint = Node.LOCAL_MATRIX_DIRTY | Node.WORLD_ALL_DIRTY;
        protected static readonly LOCAL_AND_WORLD_EXCEPT_WORLD_ROTATION_DIRTY: uint = Node.LOCAL_AND_WORLD_ALL_DIRTY & (~Node.WORLD_ROTATION_DIRTY);
        protected static readonly ALL_MATRIX_DIRTY: uint = Node.LOCAL_MATRIX_DIRTY | Node.WORLD_MATRIX_AND_INVERSE_DIRTY;

        public name: string = "";
        public layer: uint = 0xFFFFFFFF;

        protected _parent: Node = null;
        protected _root: Node = null;

        public _prev: Node = null;
        public _next: Node = null;

        public _childHead: Node = null;
        protected _numChildren: number = 0;
        protected _traversingStack: Node[] = null;

        protected _components: AbstractNodeComponent[] = null;

        protected _localRot: Quaternion = new Quaternion();
        protected _localScale: Vector3 = Vector3.One;

        protected _localMatrix: Matrix44 = new Matrix44();

        protected _worldRot: Quaternion = new Quaternion();
        protected _worldMatrix: Matrix44 = new Matrix44();
        protected _inverseWorldMatrix: Matrix44 = new Matrix44();
        protected _dirty: uint = 0;

        constructor() {
            this._root = this;
        }

        public get root(): Node {
            return this._root;
        }

        public get parent(): Node {
            return this._parent;
        }

        public addChild(c: Node): boolean {
            if (c && c._parent === null && c !== this._root) {
                this._addNode(c);
                c._parentChanged(this._root);
                return true;
            }
            return false;
        }

        public insertChild(c: Node, before: Node): boolean {
            if (c && c !== this._root) {
                if (c === before) return true;

                if (before) {
                    if (before._parent === this) {
                        if(c._parent === this) {
                            this._removeNode(c);
                            this._insertNode(c, before);
                            return true;
                        } else if (c._parent === null) {
                            this._insertNode(c, before);
                            return true;
                        }
                    }
                } else {
                    return this.addChild(c);
                }
            }

            return false;
        }

        public removeChild(c: Node): boolean {
            if (c && c._parent === this) {
                this._removeNode(null);
                c._parentChanged(c);
                return true;
            }
            return false;
        }

        protected _parentChanged(root: Node): void {
            this._root = root;

            let old = this._dirty;
            this._dirty |= Node.WORLD_ALL_DIRTY;
            if (old !== this._dirty) this._notificationUpdate(true);
        }

        public get numChildren(): uint {
            return this._numChildren;
        }

        public get readonlyLocalRotation(): Quaternion {
            return this._localRot;
        }

        public get readonlyLocalScale(): Vector3 {
            return this._localScale;
        }

        public get readonlyLocalMatrix(): Matrix44 {
            this.updateLocalMatrix();
            return this._localMatrix;
        }

        public get readonlyWorldMatrix(): Matrix44 {
            this.updateWorldMatrix();
            return this._worldMatrix;
        }

        public get readonlyInverseWorldMatrix(): Matrix44 {
            this.updateInverseWorldMatrix();
            return this._inverseWorldMatrix;
        }

        public get readonlyWorldRotation(): Quaternion {
            this.updateWorldRotation();
            return this._worldRot;
        }

        [Symbol.iterator]() {
            let next = this._childHead;

            return {
                done: false,
                value: <Node>null,
                next() {
                    if (next) {
                        this.value = next;
                        next = next._next;
                    } else {
                        this.value = null;
                    }
                    this.done = this.value === null;

                    return this;
                }
            };
        }

        /**
         * @returns numChildren.
         */
        public getAllChildren(rst: Node[], start: uint = 0): Node[] {
            rst = rst || [];
            
            let node = this._childHead;
            while (node) {
                rst[start++] = node;
                node = node._next;
            }

            return rst;
        }

        public removeAllChildren(): void {
            if (this._childHead) {
                if (this._traversingStack) {
                    for (let i = 0, n = this._traversingStack.length; i < n; ++i) this._traversingStack[i] = null;
                }

                let node = this._childHead;
                do {
                    let next = node._next;

                    node._prev = null;
                    node._next = null;
                    node._parent = null;
                    node._parentChanged(node);

                    node = next;
                } while (node);

                this._childHead = null;
                this._numChildren = 0;
            }
        }

        public removeFromParent(): void {
            if (this._parent) this._parent.removeChild(this);
        }

        /**
         * @param callback if return false, break.
         */
        public foreach(callback: (child: Node) => boolean): void {
            if (callback && this._childHead) {
                let node = this._childHead;
                if (!this._traversingStack) this._traversingStack = [];
                let n = this._traversingStack.length;
                while (node) {
                    this._traversingStack[n] = node._next;
                    if (!callback(node)) break;
                    node = this._traversingStack[n];
                }
                this._traversingStack.length = n;
            }
        }

        protected _addNode(node: Node): void {
            if (this._childHead) {
                let tail = this._childHead._prev;

                tail._next = node;
                node._prev = tail;
                this._childHead._prev = node;
            } else {
                this._childHead = node;
                node._prev = node;
            }

            node._parent = this;
            ++this._numChildren;
        }

        protected _insertNode(node: Node, before: Node): void {
            node._next = before;
            node._prev = before._prev;
            if (before === this._childHead) {
                this._childHead = node;
            } else {
                before._prev._next = node;
            }
            before._prev = node;

            node._parent = this;
            ++this._numChildren;
        }

        protected _removeNode(node: Node): void {
            this._checkTraversingStack(node);

            let next = node._next;

            if (this._childHead === node) {
                this._childHead = next;

                if (next) next._prev = node._prev;
            } else {
                let prev = node._prev;

                prev._next = next;
                if (next) {
                    next._prev = prev;
                } else {
                    this._childHead._prev = prev;
                }
            }

            node._prev = null;
            node._next = null;
            node._parent = null;

            --this._numChildren;
        }

        protected _checkTraversingStack(node: Node): void {
            if (this._traversingStack) {
                for (let i = 0, n = this._traversingStack.length; i < n; ++i) {
                    if (this._traversingStack[i] === node) this._traversingStack[i] = node._next;
                }
            }
        }

        public addComponent<T extends AbstractNodeComponent>(component: T): T {
            if (component && component.node !== this) {
                if (!this._components) this._components = [];
                if (component.node) component.node._removeComponent(component);
                this._components.push(component);
                component._setNode(this);
            }

            return component;
        }

        public removeComponent(component: AbstractNodeComponent): void {
            if (component && this._components && component.node === this) {
                component._setNode(null);
                this._removeComponent(component);
            }
        }

        protected _removeComponent(component: AbstractNodeComponent): void {
            this._components.splice(this._components.indexOf(component), 1);
        }

        public remvoeAllComponents(): void {
            if (this._components) {
                for (let i = 0, n = this._components.length; i < n; ++i) this._components[i]._setNode(null);
                this._components.length = 0;
            }
        }

        public getComponentByType<T extends AbstractNodeComponent>(c: {prototype: T}, checkEnabled: boolean = false): T {
            if (this._components) {
                let type = <any>c;

                for (let i = 0, n = this._components.length; i < n; ++i) {
                    let com = this._components[i];
                    if (checkEnabled && !com.enabled) continue;
                    if (com instanceof type) return <T>com;
                }
            }

            return null;
        }

        protected _notificationUpdate(worldRotationDirty: boolean): void {
            let node = this._childHead;
            while (node) {
                node._receiveNotificationUpdate(worldRotationDirty);
                node = node._next;
            }
        }

        protected _receiveNotificationUpdate(worldRotationDirty: boolean): void {
            let old = this._dirty;
            this._dirty |= worldRotationDirty ? Node.WORLD_ALL_DIRTY : Node.WORLD_MATRIX_AND_INVERSE_DIRTY;
            if (this._dirty !== old) this._notificationUpdate(worldRotationDirty);
        }

        public getLocalPositon(rst: Vector3 = null): Vector3 {
            return rst ? rst.setFromXYZ(this._localMatrix.m30, this._localMatrix.m31, this._localMatrix.m32) : new Vector3(this._localMatrix.m30, this._localMatrix.m31, this._localMatrix.m32);
        }

        public setLocalPosition(x: number = 0, y: number = 0, z: number = 0): void {
            this._localMatrix.m30 = x;
            this._localMatrix.m31 = y;
            this._localMatrix.m32 = z;

            let old = this._dirty;
            this._dirty |= Node.WORLD_MATRIX_AND_INVERSE_DIRTY;
            if (old !== this._dirty) this._notificationUpdate(false);
        }

        public appendLocalTranslate(x: number = 0, y: number = 0, z: number = 0): void {
            this.readonlyLocalMatrix.prependTranslate34XYZ(x, y, z);

            let old = this._dirty;
            this._dirty |= Node.WORLD_MATRIX_AND_INVERSE_DIRTY;
            if (old !== this._dirty) this._notificationUpdate(false);
        }

        public getWorldPosition(rst: Vector3 = null): Vector3 {
            this.updateWorldMatrix();

            return rst ? rst.setFromXYZ(this._worldMatrix.m30, this._worldMatrix.m31, this._worldMatrix.m32) : new Vector3(this._worldMatrix.m30, this._worldMatrix.m31, this._worldMatrix.m32);
        }

        public setWorldPosition(x: number = 0, y: number = 0, z: number = 0): void {
            let old = this._dirty;
            this.updateWorldMatrix();

            this._worldMatrix.m30 = x;
            this._worldMatrix.m31 = y;
            this._worldMatrix.m32 = z;

            this._worldPositionChanged(old);
        }

        public appendWorldTranslate(x: number = 0, y: number = 0, z: number = 0): void {
            let old = this._dirty;
            this.readonlyWorldMatrix.prependTranslate34XYZ(x, y, z);

            this._worldPositionChanged(old);
        }

        protected _worldPositionChanged(oldDirty: uint): void {
            if (this._parent) {
                let vec3 = this._parent.readonlyInverseWorldMatrix.transform34XYZ(this._worldMatrix.m30, this._worldMatrix.m31, this._worldMatrix.m32, Node._tmpVec3);
                
                this._localMatrix.m30 = vec3.x;
                this._localMatrix.m31 = vec3.y;
                this._localMatrix.m32 = vec3.z;
            } else {
                this._localMatrix.m30 = this._worldMatrix.m30;
                this._localMatrix.m31 = this._worldMatrix.m31;
                this._localMatrix.m32 = this._worldMatrix.m32;
            }

            this._dirty |= Node.INVERSE_WORLD_MATRIX_DIRTY;
            if (oldDirty !== this._dirty) this._notificationUpdate(false);
        }

        public getLocalRotation(rst: Quaternion = null): Quaternion {
            return rst ? rst.setFromQuaternion(this._localRot) : this._localRot.clone();
        }

        public setLocalRotation(quat: Quaternion): void {
            this._localRot.setFromQuaternion(quat);

            let old = this._dirty;
            this._dirty |= Node.LOCAL_AND_WORLD_ALL_DIRTY;
            if (old !== this._dirty) this._notificationUpdate(true);
        }

        public appendLocalRotation(quat: Quaternion): void {
            this._localRot.append(quat);

            let old = this._dirty;
            this._dirty |= Node.LOCAL_AND_WORLD_ALL_DIRTY;
            if (old !== this._dirty) this._notificationUpdate(true);
        }

        public appendParentRotation(quat: Quaternion): void {
            this._localRot.prepend(quat);

            let old = this._dirty;
            this._dirty |= Node.LOCAL_AND_WORLD_ALL_DIRTY;
            if (old !== this._dirty) this._notificationUpdate(true);
        }

        public getWorldRotation(rst: Quaternion = null): Quaternion {
            return rst ? rst.setFromQuaternion(this.readonlyWorldRotation) : this.readonlyWorldRotation.clone();
        }

        public setWorldRotation(quat: Quaternion): void {
            this._worldRot.setFromQuaternion(quat);

            this._worldRotationChanged(this._dirty);
        }

        public appendWorldRotation(quat: Quaternion): void {
            let old = this._dirty;
            this.readonlyWorldRotation.append(quat);

            this._worldRotationChanged(old);
        }

        protected _worldRotationChanged(oldDirty: uint): void {
            if (this._parent) {
                this._parent.readonlyWorldRotation.append(this._worldRot, this._localRot);
            } else {
                this._localRot.setFromQuaternion(this._worldRot);
            }

            this._dirty &= ~Node.WORLD_ROTATION_DIRTY;
            this._dirty |= Node.LOCAL_AND_WORLD_EXCEPT_WORLD_ROTATION_DIRTY;
            if (oldDirty !== this._dirty) this._notificationUpdate(true);
        }

        /**
         ** (this node).setLocalRotation(return value)
         ** (this node).worldRotation = Target world rotation
         * @param quat Target world rotation
         */
        public calcLocalRotationFromWorld(quat: Quaternion, rst: Quaternion = null): Quaternion {
            if (this._parent) {
                rst = rst ? rst.setFromQuaternion(this._parent.readonlyWorldRotation) : this._parent.readonlyWorldRotation.clone();
                rst.x = -rst.x;
                rst.y = -rst.y;
                rst.z = -rst.z;

                rst.append(quat);
            } else {
                rst = rst ? rst.setFromQuaternion(quat) : quat.clone();
            }

            return rst;
        }

        public getLocalScale(rst: Vector3 = null): Vector3 {
            return rst ? rst.setFromVector3(this._localScale) : this._localScale.clone();
        }

        public setLocalScale(x: number, y: number, z: number): void {
            this._localScale.setFromXYZ(x, y, z);

            let old = this._dirty;
            this._dirty |= Node.ALL_MATRIX_DIRTY;
           if (old !== this._dirty)  this._notificationUpdate(false);
        }

        public getLocalMatrix(rst: Matrix44 = null): Matrix44 {
            return rst ? rst.set44FromMatrix(this.readonlyLocalMatrix) : this.readonlyLocalMatrix.clone();
        }

        public setLocalMatrix(m: Matrix44): void {
            this._localMatrix.set34FromMatrix(m);

            this._localMatrix.decomposition(Node._tmpMat, this._localScale);
            Node._tmpMat.toQuaternion(this._localRot);

            let old = this._dirty;
            this._dirty &= ~Node.LOCAL_MATRIX_DIRTY;
            this._dirty |= Node.WORLD_ALL_DIRTY;
            if (old !== this._dirty) this._notificationUpdate(true);
        }

        public getWorldMatrix(rst: Matrix44 = null): Matrix44 {
            return rst ? rst.set44FromMatrix(this.readonlyWorldMatrix) : this.readonlyWorldMatrix.clone();
        }

        public setWorldMatrix(m: Matrix44): void {
            this._worldMatrix.set34FromMatrix(m);

            let old = this._dirty;
            this._dirty &= ~Node.WORLD_MATRIX_DIRTY;
            this._dirty |= Node.INVERSE_WORLD_MATRIX_DIRTY;

            if (this._parent) {
                this._worldMatrix.append34(this.readonlyInverseWorldMatrix, this._localMatrix);
            } else {
                this._localMatrix.set34FromMatrix(this._worldMatrix);
            }

            this._localMatrix.decomposition(Node._tmpMat, this._localScale);
            Node._tmpMat.toQuaternion(this._localRot);

            this._dirty &= ~Node.LOCAL_MATRIX_DIRTY;
            this._dirty |= Node.WORLD_ROTATION_DIRTY;
            if (old !== this._dirty) this._notificationUpdate(true);
        }

        public getInverseWorldMatrix(rst: Matrix44 = null): Matrix44 {
            return rst ? rst.set44FromMatrix(this.readonlyInverseWorldMatrix) : this.readonlyInverseWorldMatrix.clone();
        }

        public identity(): void {
            if (!this._localRot.isIdentity || !this._localScale.isOne || this._localMatrix.m30 !== 0 || this._localMatrix.m31 !== 0 || this._localMatrix.m32 !== 0) {
                this._localMatrix.identity();
                this._localRot.identity();
                this._localScale.setFromVector3(Vector3.ConstOne);

                let old = this._dirty;
                this._dirty |= Node.LOCAL_AND_WORLD_ALL_DIRTY;
                if (old !== this._dirty) this._notificationUpdate(true);
            }
        }

        public updateWorldRotation(): void {
            if (this._dirty & Node.WORLD_ROTATION_DIRTY) {
                this._dirty &= ~Node.WORLD_ROTATION_DIRTY;

                if (this._parent) {
                    this._parent.readonlyWorldRotation.append(this._localRot, this._worldRot);
                } else {
                    this._worldRot.setFromQuaternion(this._localRot);
                }
            }
        }

        public updateLocalMatrix(): void {
            if (this._dirty & Node.LOCAL_MATRIX_DIRTY) {
                this._dirty &= ~Node.LOCAL_MATRIX_DIRTY;

                this._localRot.toMatrix33(this._localMatrix);
                this._localMatrix.prependScale34Vector3(this._localScale);
            }
        }

        public updateWorldMatrix(): void {
            if (this._dirty & Node.WORLD_MATRIX_DIRTY) {
                this._dirty &= ~Node.WORLD_MATRIX_DIRTY;

                if (this._parent) {
                    this.readonlyLocalMatrix.append34(this._parent.readonlyWorldMatrix, this._worldMatrix);
                } else {
                    this._worldMatrix.set34FromMatrix(this.readonlyLocalMatrix);
                }
            }
        }

        public updateInverseWorldMatrix(): void {
            if (this._dirty & Node.INVERSE_WORLD_MATRIX_DIRTY) {
                this._dirty &= ~Node.INVERSE_WORLD_MATRIX_DIRTY;

                this.readonlyWorldMatrix.invert(this._inverseWorldMatrix);
            }
        }

        public isContains(node: Node, depth: uint = Number.MAX_SAFE_INTEGER): int {
            if (node === this) {
                return 0;
            } else if (depth > 0 && node) {
                if (node._parent === this) {
                    return 1;
                } else if (depth > 1) {
                    let child = this._childHead;
                    while (child) {
                        let lv = child.isContains(node, depth - 1);
                        if (lv !== -1) return lv + 1;
                        child = child._next;
                    }

                    return -1;
                }

                return -1;
            } else {
                return -1;
            }
        }
    }
}