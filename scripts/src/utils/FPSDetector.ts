namespace Aurora {
    export class FPSDetector {
        private _platform: IPlatform;
        private _delta: number = 0;
        private _time: number = 0;
        private _fps: number = 0;
        private _count: number = 0;

        private _dis: HTMLDivElement = null;
        
        constructor(platform: IPlatform, delta: number = 1000) {
            this._platform = platform;
            this.delta = delta;
            this.reset();
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

        public reset(): void {
            this._time = this._platform.duration();
            this._count = 0;
        }

        public record(): void {
            let t = this._platform.duration();

            ++this._count;
            let d = t - this._time;
            if (d >= this._delta) {
                this._fps = 1000.0 * this._count / d;
                this._count = 0;
                this._time = t;

                if (this._dis && this._dis.parentNode) this._dis.innerText = this._fps.toString();
            }
        }

        public show(): void {
            this._createDisplay();
            if (!this._dis.parentNode) {
                this._dis.innerText = "";
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
                this._dis.style.backgroundColor = "#ffffcc";
                this._dis.innerText = "";
            }
        }
    }
}