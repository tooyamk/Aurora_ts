/// <reference path="../math/Matrix44.ts" />
/// <reference path="../math/Vector.ts" />

namespace MITOIA {
    export class Node {
        protected static _tmpVec3: Vector3 = Vector3.Zero;
        protected static _tmpMat: Matrix44 = new Matrix44();

        public name: string = "";
        public layer: uint = 0xFFFFFFFF;

        protected _parent: Node = null;

        protected _prev: Node = null;
        protected _next: Node = null;

        protected _childHead: Node = null;
        protected _numChildren: number = 0;
        protected _traversingStack: Node[] = null;

        protected _components: AbstractNodeComponent[] = null;

        protected _localRot: Quaternion = new Quaternion();
        protected _localScale: Vector3 = Vector3.One;

        protected _localMatrix: Matrix44 = new Matrix44();
        protected _localMatrixDirty = false;

        protected _worldRot: Quaternion = new Quaternion();
        protected _worldMatrix: Matrix44 = new Matrix44();
        protected _worldMatrixDirty = false;
        protected _worldRotDirty: number = 0;
        protected _notificationDirty = false;

        constructor() {
        }

        public get parent(): Node {
            return this._parent;
        }

        public setParent(value: Node, notificationUpdate: boolean = true) {
            if (this._parent !== value) {
                if (this._parent) this._parent._removeNode(this);
                if (value) value._addNode(this);
                this._parentChanged(notificationUpdate);
            }
        }

        protected _parentChanged(notificationUpdate: boolean): void {
            this._worldRotDirty = 2;
            this._worldMatrixDirty = true;
            this._doNofificationUpdate(notificationUpdate);
        }

        public get numChildren(): number {
            return this._numChildren;
        }

        public get readonlyLocalMatrix(): Matrix44 {
            this.updateLocalMatrix();
            return this._localMatrix;
        }

        public get readonlyWorldMatrix(): Matrix44 {
            this.updateWorldMatrix();
            return this._worldMatrix;
        }

        /**
         * @returns numChildren.
         */
        public getAllChildren(rst: Node[], start: uint = 0): uint {
            if (rst) {
                let node = this._childHead;
                while (node) {
                    rst[start++] = node;
                    node = node._next;
                }
            }

            return this._numChildren;
        }

        public removeAllChildren(notificationUpdate: boolean = true): void {
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
                    node._parentChanged(notificationUpdate);

                    node = next;
                } while (node);

                this._childHead = null;
                this._numChildren = 0;
            }
        }

        public foreachCheckBreak(callback: (child: Node) => boolean): void {
            if (callback && this._childHead) {
                let node = this._childHead;
                if (!this._traversingStack) this._traversingStack = [];
                let n = this._traversingStack.length;
                while (node) {
                    this._traversingStack[n] = node._next;
                    if (callback(node)) break;
                    node = this._traversingStack[n];
                }
                this._traversingStack.length = n;
            }
        }

        public foreach(callback: (child: Node) => void): void {
            if (callback && this._childHead) {
                let node = this._childHead;
                if (!this._traversingStack) this._traversingStack = [];
                let n = this._traversingStack.length;
                while (node) {
                    this._traversingStack[n] = node._next;
                    callback(node);
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

        public notificationUpdate(): void {
            if (this._notificationDirty) this._nofificationUpdate();
        }

        protected _doNofificationUpdate(notificationUpdate: boolean): void {
            if (notificationUpdate) {
                this._nofificationUpdate();
            } else {
                this._notificationDirty = true;
            }
        }

        protected _nofificationUpdate(): void {
            this._notificationDirty = false;

            var worldRotationDirty: boolean = this._worldRotDirty > 0;

            let node = this._childHead;
            while (node) {
                node._receiveNofificationUpdate(worldRotationDirty);
                node = node._next;
            }

            if (this._worldRotDirty === 1) this._worldRotDirty = 0;
        }

        protected _receiveNofificationUpdate(worldRotationDirty: boolean): void {
            if (worldRotationDirty) this._worldRotDirty = 2;
            this._worldMatrixDirty = true;

            this._nofificationUpdate();
        }

        public getLocalPositon(rst: Vector3 = null): Vector3 {
            return rst ? rst.setFromXYZ(this._localMatrix.m30, this._localMatrix.m31, this._localMatrix.m32) : new Vector3(this._localMatrix.m30, this._localMatrix.m31, this._localMatrix.m32);
        }

        public setLocalPosition(x: number = 0, y: number = 0, z: number = 0, notificationUpdate: boolean = true): void {
            this._localMatrix.m30 = x;
            this._localMatrix.m31 = y;
            this._localMatrix.m32 = z;

            this._worldMatrixDirty = true;
            this._notificationDirty = true;

            this._doNofificationUpdate(notificationUpdate);
        }

        public appendLocalTranslate(x: number = 0, y: number = 0, z: number = 0, notificationUpdate: boolean = true): void {
            let vec3 = this._localRot.rotateXYZ(x, y, z, Node._tmpVec3);

            this._localMatrix.m30 += vec3.x;
            this._localMatrix.m31 += vec3.y;
            this._localMatrix.m32 += vec3.z;

            this._worldMatrixDirty = true;

            this._doNofificationUpdate(notificationUpdate);
        }

        public getWorldPosition(rst: Vector3 = null): Vector3 {
            this.updateWorldMatrix();

            return rst ? rst.setFromXYZ(this._worldMatrix.m30, this._worldMatrix.m31, this._worldMatrix.m32) : new Vector3(this._worldMatrix.m30, this._worldMatrix.m31, this._worldMatrix.m32);
        }

        public setWorldPosition(x: number = 0, y: number = 0, z: number = 0, notificationUpdate: boolean = true): void {
            this.updateWorldMatrix();

            this._worldMatrix.m30 = x;
            this._worldMatrix.m31 = y;
            this._worldMatrix.m32 = z;

            this._wordPositionChanged(notificationUpdate);
        }

        public appendWorldTranslate(x: number = 0, y: number = 0, z: number = 0, notificationUpdate: boolean = true): void {
            this.updateWorldMatrix();

            this._worldMatrix.prependTranslate34XYZ(x, y, z);

            this._wordPositionChanged(notificationUpdate);
        }

        protected _wordPositionChanged(notificationUpdate: boolean): void {
            if (this._parent) {
                let m = Node._tmpMat;
                if (this._parent._worldMatrix.invert(m)) {
                    let vec3 = m.transform34XYZ(this._localMatrix.m30, this._localMatrix.m31, this._localMatrix.m32, Node._tmpVec3);

                    this._localMatrix.m30 = vec3.x;
                    this._localMatrix.m31 = vec3.y;
                    this._localMatrix.m32 = vec3.z;
                }
            } else {
                this._localMatrix.m30 = this._worldMatrix.m30;
                this._localMatrix.m31 = this._worldMatrix.m31;
                this._localMatrix.m32 = this._worldMatrix.m32;
            }

            this._doNofificationUpdate(notificationUpdate);
        }

        public getLocalRotation(rst: Quaternion = null): Quaternion {
            return rst ? rst.setFromQuaternion(this._localRot) : this._localRot.clone();
        }

        public setLocalRotation(quat: Quaternion, notificationUpdate: boolean = true): void {
            this._localRot.setFromQuaternion(quat);

            this._localMatrix_worldMatrix_worldRot_Changed(notificationUpdate, 2);
        }

        public appendLocalRotation(quat: Quaternion, notificationUpdate: boolean = true): void {
            this._localRot.append(quat);

            this._localMatrix_worldMatrix_worldRot_Changed(notificationUpdate, 2);
        }

        protected _localMatrix_worldMatrix_worldRot_Changed(notificationUpdate: boolean, worldRotDirty: number): void {
            this._localMatrixDirty = true;
            this._worldRotDirty = worldRotDirty;
            this._worldMatrixDirty = true;

            this._doNofificationUpdate(notificationUpdate);
        }

        public appendParentRotation(quat: Quaternion, notificationUpdate: boolean = true): void {
            this._localRot.prepend(quat);

            this._localMatrix_worldMatrix_worldRot_Changed(notificationUpdate, 2);
        }

        public getWorldRotation(rst: Quaternion = null): Quaternion {
            this.updateWorldRotation();

            return rst ? rst.setFromQuaternion(this._worldRot) : this._worldRot.clone();
        }

        public setWorldRotation(quat: Quaternion, notificationUpdate: boolean = true): void {
            this._worldRot.setFromQuaternion(quat);

            this._worldRotationChanged(notificationUpdate);
        }

        public appendWorldRotation(quat: Quaternion, notificationUpdate: boolean = true): void {
            this.updateWorldRotation();

            this._worldRot.append(quat);

            this._worldRotationChanged(notificationUpdate);
        }

        protected _worldRotationChanged(notificationUpdate: boolean): void {
            if (this._parent) {
                this._parent.updateWorldRotation();

                this._parent._worldRot.append(this._worldRot, this._localRot);
            } else {
                this._localRot.setFromQuaternion(this._worldRot);
            }

            this._localMatrix_worldMatrix_worldRot_Changed(notificationUpdate, 1);
        }

        public calcLocalRotationFromWorld(quat: Quaternion, rst: Quaternion = null): Quaternion {
            if (this._parent) {
                this._parent.updateWorldRotation();

                rst = rst ? rst.setFromQuaternion(this._parent._worldRot) : this._parent._worldRot.clone();
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

        public setLocalScale(x: number, y: number, z: number, notificationUpdate: boolean = true): void {
            this._localScale.setFromXYZ(x, y, z);

            this._localMatrixDirty = true;
            this._worldMatrixDirty = true;

            this._doNofificationUpdate(notificationUpdate);
        }

        public getLocalMatrix(rst: Matrix44 = null): Matrix44 {
            this.updateLocalMatrix();

            return rst ? rst.set44FromMatrix(this._localMatrix) : this._localMatrix.clone();
        }

        public setLocalMatrix(m: Matrix44, notificationUpdate: boolean = true): void {
            this._localMatrix.set34FromMatrix(m);

            this._localMatrix.decomposition(Node._tmpMat, this._localScale);
            Node._tmpMat.toQuaternion(this._localRot);

            this._localMatrix_worldMatrix_worldRot_Changed(notificationUpdate, 2);
        }

        public getWorldMatrix(rst: Matrix44 = null): Matrix44 {
            this.updateWorldMatrix();

            return rst ? rst.set44FromMatrix(this._worldMatrix) : this._worldMatrix.clone();
        }

        public setWorldMatrix(m: Matrix44, notificationUpdate: boolean = true): void {
            this._worldMatrix.set34FromMatrix(m);

            if (this._parent) {
                this._parent.updateWorldMatrix();

                if (this._worldMatrix.invert(Node._tmpMat)) this._worldMatrix.append34(Node._tmpMat, this._localMatrix);
            } else {
                this._localMatrix.set34FromMatrix(this._worldMatrix);
            }

            this._localMatrix.decomposition(Node._tmpMat, this._localScale);
            Node._tmpMat.toQuaternion(this._localRot);

            this._localMatrix_worldMatrix_worldRot_Changed(notificationUpdate, 2);
        }

        public identity(notificationUpdate: boolean = true): void {
            this._localMatrix.identity();
            this._localRot.setFromXYZW();
            this._localScale.setFromVector3(Vector3.ConstOne);

            this._localMatrix_worldMatrix_worldRot_Changed(notificationUpdate, 2);
        }

        public updateWorldRotation(): void {
            if (this._worldRotDirty == 2) {
                this._worldRotDirty = 0;

                if (this._parent) {
                    this._parent.updateWorldRotation();

                    this._parent._worldRot.append(this._localRot, this._worldRot);
                } else {
                    this._worldRot.setFromQuaternion(this._localRot);
                }
            }
        }

        public updateLocalMatrix(): void {
            if (this._localMatrixDirty) {
                this._localMatrixDirty = false;

                this._localRot.toMatrix33(this._localMatrix);
                this._localMatrix.prependScale34Vector3(this._localScale);
            }
        }

        public updateWorldMatrix(): void {
            if (this._worldMatrixDirty) {
                this._worldMatrixDirty = false;

                this.updateLocalMatrix();

                if (this._parent) {
                    this._parent.updateWorldMatrix();

                    this._localMatrix.append34(this._parent._worldMatrix, this._worldMatrix);
                } else {
                    this._worldMatrix.set34FromMatrix(this._localMatrix);
                }
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