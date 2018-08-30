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

        public setFromRGB(rgb: uint): Color3 {
            this.r = (rgb >> 16 & 0xFF) / 0xFF;
            this.g = (rgb >> 8 & 0xFF) / 0xFF;
            this.b = (rgb & 0xFF) / 0xFF;

            return this;
        }

        public setFromRGBSeparate(r: number = 0, g: number = 0, b: number = 0): Color3 {
            this.r = r;
            this.g = g;
            this.b = b;

            return this;
        }

        public setFromColor3(color: Color3): Color3 {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;

            return this;
        }

        public setFromColor4(color: Color4): Color3 {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;

            return this;
        }

        public isEqual(color: Color3): boolean {
            return this.r === color.r && this.g === color.g && this.b === color.b;
        }

        public toString(): string {
            return "Color3(r=" + this.r + ", g=" + this.g + ", bz=" + this.b + ")";
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
            return rst ? rst.setFromRGBSeparate(this.r, this.g, this.b) : new Color3(this.r, this.g, this.b);
        }

        public setFromARGB(argb: uint): Color4 {
            this.a = (argb >> 24 & 0xFF) / 0xFF;
            this.r = (argb >> 16 & 0xFF) / 0xFF;
            this.g = (argb >> 8 & 0xFF) / 0xFF;
            this.b = (argb & 0xFF) / 0xFF;

            return this;
        }

        public setFromRGBA(rgba: uint): Color4 {
            this.r = (rgba >> 24 & 0xFF) / 0xFF;
            this.g = (rgba >> 16 & 0xFF) / 0xFF;
            this.b = (rgba >> 8 & 0xFF) / 0xFF;
            this.a = (rgba & 0xFF) / 0xFF;

            return this;
        }

        public setFromRGBASeparate(r: number = 0, g: number = 0, b: number = 0, a: number = 1): Color4 {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;

            return this;
        }

        public setFromColor3(color: Color3): Color4 {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;

            return this;
        }

        public setFromColor4(color: Color4): Color4 {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
            this.a = color.a;

            return this;
        }

        public isEqual(color: Color4): boolean {
            return this.r === color.r && this.g === color.g && this.b === color.b && this.a === color.a;
        }

        public toString(): string {
            return "Color4(r=" + this.r + ", g=" + this.g + ", b=" + this.b + ", a=" + this.a + ")";
        }
    }
}