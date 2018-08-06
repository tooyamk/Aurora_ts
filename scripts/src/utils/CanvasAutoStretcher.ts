namespace MITOIA {
    export class CanvasAutoStretcher {
        private _gl: GL = null;

        constructor(gl: GL) {
            this._gl = gl;
        }

        public execute(devicePixelRatio: number = null): boolean {
            if (devicePixelRatio === null || devicePixelRatio === undefined) devicePixelRatio = window.devicePixelRatio;

            let canvas = this._gl.canvas;
            if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;

                this._gl.setViewport(0, 0, this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);

                return true;
            }

            return false;
        }
    }
}