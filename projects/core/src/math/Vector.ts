namespace Aurora {
    export class Vector2 {
        public static readonly CONST_ZERO: Vector2 = new Vector2();
        public static readonly CONST_ONE: Vector2 = new Vector2(1, 1);

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

        public get lengthSquared(): number {
            return this.x * this.x + this.y * this.y;
        }

        public get length(): number {
            let len = this.x * this.x + this.y * this.y;
            if (len !== 1) len = Math.sqrt(len);
            return len;
        }

        public clone(): Vector2 {
            return new Vector2(this.x, this.y);
        }

        public setFromNumbers(x: number = 0, y: number = 0): Vector2 {
            this.x = x;
            this.y = y;

            return this;
        }

        public set(vec: Vector2 | Vector3 | Vector4): Vector2 {
            this.x = vec.x;
            this.y = vec.y;

            return this;
        }

        public static dot(p1: Vector2, p2: Vector2): number {
            return p1.x * p2.x + p1.y * p2.y;
        }

        public static angleBetween(p1: Vector2, p2: Vector2, clamp: boolean = false): number {
            let len = p1.length * p2.length;
            let val = p1.x * p2.x + p1.y * p2.y;
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

        public static distance(p1: Vector2, p2: Vector2): number {
            let x = p1.x - p2.x;
            let y = p1.y - p2.y;
            return Math.sqrt(x * x + y * y);
        }

        public toString(): string {
            return "Vector2(x=" + this.x + ", y=" + this.y + ")";
        }
    }

    export class Vector3 {
        public static readonly CONST_ZERO: Vector3 = new Vector3();
        public static readonly CONST_ONE: Vector3 = new Vector3(1, 1, 1);

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

        public get isZero(): boolean {
            return this.x === 0 && this.y === 0 && this.z === 0;
        }

        public get isOne(): boolean {
            return this.x === 1 && this.y === 1 && this.z === 1;
        }

        public setZero(): void {
            this.x = this.y = this.z = 0;
        }

        public get lengthSquared(): number {
            return this.x * this.x + this.y * this.y + this.z * this.z;
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

        public setFromNumbers(x: number = 0, y: number = 0, z: number = 0): Vector3 {
            this.x = x;
            this.y = y;
            this.z = z;

            return this;
        }

        public set(vec: Vector3 | Vector4): Vector3 {
            this.x = vec.x;
            this.y = vec.y;
            this.z = vec.z;

            return this;
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
        
        public addNumber(target: number): Vector3 {
            this.x += target;
            this.y += target;
            this.z += target;

            return this;
        }

        public add(target: Vector3): Vector3 {
            this.x += target.x;
            this.y += target.y;
            this.z += target.z;

            return this;
        }

        public subNumber(target: number): Vector3 {
            this.x -= target;
            this.y -= target;
            this.z -= target;

            return this;
        }

        public sub(target: Vector3): Vector3 {
            this.x -= target.x;
            this.y -= target.y;
            this.z -= target.z;

            return this;
        }

        public mulNumber(target: number): Vector3 {
            this.x *= target;
            this.y *= target;
            this.z *= target;

            return this;
        }

        public mul(target: Vector3): Vector3 {
            this.x *= target.x;
            this.y *= target.y;
            this.z *= target.z;

            return this;
        }

        public divNumber(target: number): Vector3 {
            this.x /= target;
            this.y /= target;
            this.z /= target;

            return this;
        }

        public div(target: Vector3): Vector3 {
            this.x /= target.x;
            this.y /= target.y;
            this.z /= target.z;

            return this;
        }

        public static dot(p1: Vector3, p2: Vector3): number {
            return p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
        }

        public static cross(p1: Vector3, p2: Vector3, rst: Vector3 = null): Vector3 {
            let x = p1.y * p2.z - p1.z * p2.y;
            let y = p1.z * p2.x - p1.x * p2.z;
            let z = p1.x * p2.y - p1.y * p2.x;
            return rst ? rst.setFromNumbers(x, y, z) : new Vector3(x, y, z);
        }

        public static angleBetween(p1: Vector3, p2: Vector3, clamp: boolean = false): number {
            let len = p1.length * p2.length;
            let val = p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
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

        public static distance(p1: Vector3, p2: Vector3): number {
            let x = p1.x - p2.x;
            let y = p1.y - p2.y;
            let z = p1.z - p2.z;
            return Math.sqrt(x * x + y * y + z * z);
        }

        public toString(): string {
            return "Vector3(x=" + this.x + ", y=" + this.y + ", z=" + this.z + ")";
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

        public toVector3(rst: Vector3 = null): Vector3 {
            if (rst) {
                rst.x = this.x;
                rst.y = this.y;
                rst.z = this.z;
            } else {
                rst = new Vector3(this.x, this.y, this.z);
            }

            return rst;
        }

        public setFromNumbers(x: number = 0, y: number = 0, z: number = 0, w: number = 0): Vector4 {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;

            return this;
        }

        public set(vec: Vector4): Vector4 {
            this.x = vec.x;
            this.y = vec.y;
            this.z = vec.z;
            this.w = vec.w;

            return this;
        }

        public dotVector3(p: Vector3): number {
            return this.x * p.x + this.y * p.y + this.z * p.z + this.w;
        }

        public static dot(p1: Vector4, p2: Vector4): number {
            return p1.x * p2.x + p1.y * p2.y + p1.z * p2.z + p1.w * p2.w;
        }

        public toString(): string {
            return "Vector4(x=" + this.x + ", y=" + this.y + ", z=" + this.z + ", w=" + this.w + ")";
        }
    }
}