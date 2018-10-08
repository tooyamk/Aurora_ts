namespace Aurora {
    export class Stats {
        public drawCalls: uint = 0;
        public drawTris: uint = 0;

        private _platform: IPlatform;
        private _color: string;
        private _delta: number = 0;
        private _time: number = 0;
        private _fps: number = 0;
        private _count: number = 0;

        private _dis: HTMLDivElement = null;
        
        constructor(platform: IPlatform, color: string = "#808080", delta: number = 1000) {
            this._platform = platform;
            this._color = color;
            this.delta = delta;

            this.reset(true);
        }

        public get fps(): number {
            return this._fps;
        }

        public get delta(): number {
            return this._delta;
        }

        public set delta(value: number) {
            this._delta = value;
        }

        public get color(): string {
            return this._color;
        }

        public set color(c: string) {
            if (this._color !== c) {
                this._color = c;
                if (this._dis) this._dis.style.color = this._color;
            }
        }

        public reset(fps: boolean = false, eachFrameData: boolean = true): void {
            if (fps) {
                this._time = this._platform.duration();
                this._count = 0;
            }

            if (eachFrameData) {
                this.drawCalls = 0;
                this.drawTris = 0;
            }
        }

        public update(): void {
            let t = this._platform.duration();

            ++this._count;
            let d = t - this._time;
            if (d >= this._delta) {
                this._fps = 1000.0 * this._count / d;
                this._count = 0;
                this._time = t;

                if (this._dis && this._dis.parentNode) this._dis.innerText = this._getShowData();
            }
        }

        public show(): void {
            this._createDisplay();
            if (!this._dis.parentNode) {
                this._dis.innerText = this._getShowData();
                document.body.appendChild(this._dis);
            }
        }

        public hide(): void {
            if (this._dis && this._dis.parentNode) this._dis.parentNode.removeChild(this._dis);
        }

        private _createDisplay(): void {
            if (!this._dis) {
                this._dis = document.createElement("div");
                this._dis.style.position = "absolute";
                this._dis.style.left = "0px";
                this._dis.style.top = "0px";
                this._dis.style.color = this._color;
                //this._dis.style.opacity = "1";
                //this._dis.style.backgroundColor = "#ffffcc";
                this._dis.innerText = "";
            }
        }

        private _getShowData(): string {
            return `FPS : ${this._fps.toFixed(3)}
                    DrawCalls : ${this.drawCalls}
                    DrawTris: ${this.drawTris}`;
        }
    }
}