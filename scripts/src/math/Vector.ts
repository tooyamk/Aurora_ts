namespace MITOIA {
    export class Vector2 {
        public static readonly ConstZero: Vector2 = new Vector2();
        public static readonly ConstOne: Vector2 = new Vector2(1, 1);

        public x: number;
        public y: number;

        constructor(x: number = 0, y: number = 0) {
            this.x = x;
            this.y = y;
        }

        public static get Zero(): Vector2 {
            return new Vector2();
        }

        public static get One(): Vector2 {
            return new Vector2(1, 1);
        }

        public clone(): Vector2 {
            return new Vector2(this.x, this.y);
        }

        public setFromXY(x: number = 0, y: number = 0): Vector2 {
            this.x = x;
            this.y = y;

            return this;
        }

        public setFromVector2(vec: Vector2): Vector2 {
            return this.setFromXY(vec.x, vec.y);
        }
    }

    export class Vector3 {
        public static readonly ConstZero: Vector3 = new Vector3();
        public static readonly ConstOne: Vector3 = new Vector3(1, 1, 1);

        public x: number;
        public y: number;
        public z: number;

        constructor(x: number = 0, y: number = 0, z: number = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public static get Zero(): Vector3 {
            return new Vector3();
        }

        public static get One(): Vector3 {
            return new Vector3(1, 1, 1);
        }

        public static get Up(): Vector3 {
            return new Vector3(0, 1, 0);
        }

        public static get Down(): Vector3 {
            return new Vector3(0, -1, 0);
        }

        public static get Left(): Vector3 {
            return new Vector3(-1, 0, 0);
        }

        public static get Right(): Vector3 {
            return new Vector3(1, 0, 0);
        }

        public static get Front(): Vector3 {
            return new Vector3(0, 0, 1);
        }

        public static get Back(): Vector3 {
            return new Vector3(0, 0, -1);
        }

        public get length(): number {
            let len = this.x * this.x + this.y * this.y + this.z * this.z;
            if (len !== 1) len = Math.sqrt(len);
            return len;
        }

        public clone(): Vector3 {
            return new Vector3(this.x, this.y, this.z);
        }

        public toVector4(w:number = 1, rst: Vector4 = null): Vector4 {
            if (rst) {
                rst.x = this.x;
                rst.y = this.y;
                rst.z = this.z;
                rst.w = w;
            } else {
                rst = new Vector4(this.x, this.y, this.z, w);
            }

            return rst;
        }

        public setFromXYZ(x: number = 0, y: number = 0, z: number = 0): Vector3 {
            this.x = x;
            this.y = y;
            this.z = z;

            return this;
        }

        public setFromVector3(vec: Vector3): Vector3 {
            return this.setFromXYZ(vec.x, vec.y, vec.z);
        }

        public normalize(): Vector3 {
            let len = this.x * this.x + this.y * this.y + this.z * this.z;
            if (len !== 1) {
                len = Math.sqrt(len);
                this.x /= len;
                this.y /= len;
                this.z /= len;
            }

            return this;
        }

        public static dot(p1: Vector3, p2: Vector3): number {
            return p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
        }

        public static cross(p1: Vector3, p2: Vector3, rst: Vector3 = null): Vector3 {
            let x: number = p1.y * p2.z - p1.z * p2.y;
            let y: number = p1.z * p2.x - p1.x * p2.z;
            let z: number = p1.x * p2.y - p1.y * p2.x;
            return rst ? rst.setFromXYZ(x, y, z) : new Vector3(x, y, z);
        }

        public static angleBetween(p1: Vector3, p2: Vector3, clamp: boolean = false): number {
            var len: number = p1.length * p2.length;
            var val: number = p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
            if (len !== 1) val /= len;

            if (clamp) {
                if (val > 1) {
                    val = 1;
                } else if (val < -1) {
                    val = -1;
                }
            }
            return Math.acos(val);
        }
    }

    export class Vector4 {
        public x: number;
        public y: number;
        public z: number;
        public w: number;

        constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }

        public clone(): Vector4 {
            return new Vector4(this.x, this.y, this.z, this.w);
        }

        public setFromXYZW(x: number = 0, y: number = 0, z: number = 0, w: number = 0): Vector4 {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;

            return this;
        }

        public setFromVector4(vec: Vector4): Vector4 {
            return this.setFromXYZW(vec.x, vec.y, vec.z, vec.w);
        }
    }
}