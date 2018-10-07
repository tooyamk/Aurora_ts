namespace Aurora {
    export class Color3 {
        public r: number;
        public g: number;
        public b: number;

        constructor(r: number = 0, g: number = 0, b: number = 0) {
            this.r = r;
            this.g = g;
            this.b = b;
        }

        public static get WHITE(): Color3 {
            return new Color3(1, 1, 1);
        }

        public static get BLACK(): Color3 {
            return new Color3(0, 0, 0);
        }

        public clone(): Color3 {
            return new Color3(this.r, this.g, this.b);
        }

        public setRGB(rgb: uint): Color3 {
            this.r = (rgb >> 16 & 0xFF) / 0xFF;
            this.g = (rgb >> 8 & 0xFF) / 0xFF;
            this.b = (rgb & 0xFF) / 0xFF;

            return this;
        }

        public setFromNumbers(r: number = 0, g: number = 0, b: number = 0): Color3 {
            this.r = r;
            this.g = g;
            this.b = b;

            return this;
        }

        public set(color: Color3 | Color4): Color3 {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;

            return this;
        }

        public isEqual(color: Color3): boolean {
            return this.r === color.r && this.g === color.g && this.b === color.b;
        }

        public toString(): string {
            return "Color3(r=" + this.r + ", g=" + this.g + ", b=" + this.b + ")";
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

        public static get WHITE(): Color4 {
            return new Color4(1, 1, 1, 1);
        }

        public static get BLACK(): Color4 {
            return new Color4(0, 0, 0, 1);
        }

        public static get TRANSPARENT_BLACK(): Color4 {
            return new Color4(0, 0, 0, 0);
        }

        public clone(): Color4 {
            return new Color4(this.r, this.g, this.b, this.a);
        }

        public toColor3(rst: Color3): Color3 {
            return rst ? rst.setFromNumbers(this.r, this.g, this.b) : new Color3(this.r, this.g, this.b);
        }

        public setRGB(rgb: uint): Color4 {
            this.r = (rgb >> 16 & 0xFF) / 0xFF;
            this.g = (rgb >> 8 & 0xFF) / 0xFF;
            this.b = (rgb & 0xFF) / 0xFF;

            return this;
        }

        public setARGB(argb: uint): Color4 {
            this.a = (argb >> 24 & 0xFF) / 0xFF;
            this.r = (argb >> 16 & 0xFF) / 0xFF;
            this.g = (argb >> 8 & 0xFF) / 0xFF;
            this.b = (argb & 0xFF) / 0xFF;

            return this;
        }

        public setRGBA(rgba: uint): Color4 {
            this.r = (rgba >> 24 & 0xFF) / 0xFF;
            this.g = (rgba >> 16 & 0xFF) / 0xFF;
            this.b = (rgba >> 8 & 0xFF) / 0xFF;
            this.a = (rgba & 0xFF) / 0xFF;

            return this;
        }

        public setFromNumbers(r: number = 0, g: number = 0, b: number = 0, a: number = 1): Color4 {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;

            return this;
        }

        public set(color: Color4): Color4 {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
            this.a = color.a;

            return this;
        }

        public isEqual(color: Color4): boolean {
            return this.r === color.r && this.g === color.g && this.b === color.b && this.a === color.a;
        }

        public static isEqual(value0: Color4, value1: Color4): boolean {
            if (value0 === value1) return true;
            if (value0) {
                if (value1) {
                    return value0.r === value1.r && value0.g === value1.g && value0.b === value1.b && value0.a === value1.a;
                } else {
                    return false;
                }
            } else if (value1) {
                return false;
            }
            return true;
        }

        public toString(): string {
            return "Color4(r=" + this.r + ", g=" + this.g + ", b=" + this.b + ", a=" + this.a + ")";
        }
    }
}