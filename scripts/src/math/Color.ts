namespace MITOIA {
    export class Color3 {
        public r: number;
        public g: number;
        public b: number;

        constructor(r: number = 0, g: number = 0, b: number = 0) {
            this.r = r;
            this.g = g;
            this.b = b;
        }

        public static get BLACK(): Color3 {
            return new Color3(0, 0, 0);
        }
    }

    export class Color4 {
        public r: number;
        public g: number;
        public b: number;
        public a: number;

        constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 1) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }

        public static get BLACK(): Color4 {
            return new Color4(0, 0, 0, 1);
        }

        public setFromRGBA(r: number = 0, g: number = 0, b: number = 0, a: number = 1): void {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }

        public setFromColor4(color: Color4): void {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
            this.a = color.a;
        }

        public isEqual(color: Color4): boolean {
            return this.r === color.r && this.g === color.g && this.b === color.b && this.a === color.a;
        }
    }
}