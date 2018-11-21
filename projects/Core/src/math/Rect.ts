namespace Aurora {
    export class Rect {
        public x: number;
        public y: number;
        public width: number;
        public height: number;

        constructor(x: number = 0, y: number = 0, w: number = 0, h: number = 0) {
            this.x = x;
            this.y = y;
            this.width = w;
            this.height = h;
        }

        public set(x: number = 0, y: number = 0, w: number = 0, h: number = 0): void {
            this.x = x;
            this.y = y;
            this.width = w;
            this.height = h;
        }

        public toString(): string {
            return "Rect(x=" + this.x + ", y=" + this.y + ", w=" + this.width + ", h=" + this.height + ")";
        }
    }
}