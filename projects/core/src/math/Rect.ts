namespace Aurora {
    export class Rect {
        public x: number;
        public y: number;
        public width: number;
        public height: number;

        constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }

        public set(x: number = 0, y: number = 0, width: number = 0, height: number = 0): void {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }

        public toString(): string {
            return "Rect(x=" + this.x + ", y=" + this.y + ", w=" + this.width + ", h=" + this.height + ")";
        }
    }
}