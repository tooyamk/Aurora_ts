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

        public clone(): Vector3 {
            return new Vector3(this.x, this.y, this.z);
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