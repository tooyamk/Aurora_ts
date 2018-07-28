namespace MITOIA {
    export interface EngineOptions extends WebGLContextAttributes {
        webGLVersion?: uint;
    }

    export class Engine {
        private _canvas: HTMLCanvasElement = null;
        private _gl: GL = null;
        private _glVersion: number = -1;

        constructor(canvasOrContext: HTMLCanvasElement | WebGLRenderingContext, options: EngineOptions = null) {
            if (!canvasOrContext) return;

            let canvas: HTMLCanvasElement = null;
            options = options || {};

            let gl: WebGLRenderingContext = null;

            if ((<HTMLCanvasElement>canvasOrContext).getContext) {
                canvas = <HTMLCanvasElement>canvasOrContext;
                this._canvas = canvas;

                if (options.webGLVersion === null || options.webGLVersion === undefined || options.webGLVersion === 2) {
                    try {
                        gl = <any>(canvas.getContext("webgl2", options) || canvas.getContext("experimental-webgl2", options));
                        if (gl) this._glVersion = 2.0;
                    } catch (e) {
                    }
                }

                if (!gl) {
                    try {
                        gl = <WebGLRenderingContext>(canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options));
                        if (gl) this._glVersion = 1.0;
                    } catch (e) {
                        throw new Error("WebGL not supported");
                    }
                }

                if (!gl) throw new Error("WebGL not supported");
            } else {
                gl = <WebGLRenderingContext>canvasOrContext;
                if (gl) {
                    this._canvas = gl.canvas;

                    if (gl.renderbufferStorageMultisample) {
                        this._glVersion = 2.0;
                    }
                } else {
                    throw new Error("WebGL not supported");
                }
            }

            if (gl) this._gl = new GL(gl);
        }      

        public get gl(): GL {
            return this._gl;
        }

        public get glVersion(): number {
            return this._glVersion;
        }
    }
}