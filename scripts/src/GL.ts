interface WebGLRenderingContext {
    renderbufferStorageMultisample(target: number, samples: number, internalformat: number, width: number, height: number): void;
}

namespace MITOIA {
    export class GLClearData {
        public readonly color: Color4 = Color4.BLACK;
        public depth = 1.0;
        public stencil = 0;
        public clearColor = true;
        public clearDepth = true;
        public clearStencil = true;
    }

    export class GLVertexBuffer {
        private _gl: GL;
        private _buffer: WebGLBuffer;

        constructor(gl: GL) {
            this._gl = gl;

            this._buffer = this._gl.internalGL.createBuffer();
        }

        public get internalBuffer(): WebGLBuffer {
            return this._buffer;
        }

        public dispose(): void {
            if (this._buffer) {
                this._gl.internalGL.deleteBuffer(this._buffer);
                this._buffer = null;
            }
        }

        public upload(data: number[] | ArrayBuffer | ArrayBufferView, updatable: boolean = false): void {
            if (this._buffer) {
                let gl = this._gl.internalGL;

                gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);

                let draw = updatable ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;

                if (data instanceof Array) {
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), draw);
                } else {
                    gl.bufferData(gl.ARRAY_BUFFER, <ArrayBuffer>data, draw);
                }

                gl.bindBuffer(gl.ARRAY_BUFFER, null);
            }
        }
    }

    export class GLIndexBuffer {
        private _gl: GL;
        private _buffer: WebGLBuffer;

        constructor(gl: GL) {
            this._gl = gl;

            this._buffer = this._gl.internalGL.createBuffer();
        }

        public get internalBuffer(): WebGLBuffer {
            return this._buffer;
        }

        public dispose(): void {
            if (this._buffer) {
                this._gl.internalGL.deleteBuffer(this._buffer);
                this._buffer = null;
            }
        }

        public upload(data: number[] | Int32Array | Uint32Array | Uint16Array, updatable: boolean = false): void {
            if (this._buffer) {
                let gl = this._gl.internalGL;

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._buffer);

                let arrayBuffer;

                if (data instanceof Uint16Array) {
                    arrayBuffer = data;
                } else {
                    if (this._gl.supprotUintIndexes) {
                        if (data instanceof Uint32Array) {
                            arrayBuffer = data;
                        } else {
                            let need32Bits = false;
                            for (let i = data.length - 1; i >= 0; --i) {
                                if (data[i] > 0xFFFF) {
                                    need32Bits = true;
                                    break;
                                }
                            }

                            arrayBuffer = need32Bits ? new Uint32Array(data) : new Uint16Array(data);
                        }
                    } else {
                        arrayBuffer = new Uint16Array(data);
                    }
                }

                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arrayBuffer, updatable ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            }
        }
    }

    export enum GLShalderType {
        VERTEX,
        FRAGMENT
    }

    export class GLShander {
        private _gl: GL;
        private _shader: WebGLShader;

        constructor(gl: GL, type: GLShalderType) {
            this._gl = gl;

            let internalGL = this._gl.internalGL;

            this._shader = internalGL.createShader(type === GLShalderType.VERTEX ? internalGL.VERTEX_SHADER : internalGL.FRAGMENT_SHADER);
        }

        public get internalShader(): WebGLShader {
            return this._shader;
        }

        public dispose(): void {
            if (this._shader) {
                this._gl.internalGL.deleteShader(this._shader);
                this._shader = null;
            }
        }

        public upload(source: string): null | string {
            let gl = this._gl.internalGL;

            gl.shaderSource(this._shader, source);
            gl.compileShader(this._shader);

            let log: null | string = null;
            if (!gl.getShaderParameter(this._shader, gl.COMPILE_STATUS)) {
                log = gl.getShaderInfoLog(this._shader);
            }

            return log;
        }
    }

    export class GLProgram {
        
    }

    export class GL {
        private _gl: WebGLRenderingContext = null;

        private _version: string = "unknow";

        private _supportUintIndexes: boolean = false;

        private _clearColor: Color4 = Color4.BLACK;
        private _depthValue: number = 1;
        private _stencilValue: uint = 0;

        constructor(gl: WebGLRenderingContext) {
            this._gl = gl;

            this._gl.clearColor(this._clearColor.r, this._clearColor.g, this._clearColor.b, this._clearColor.a);
            this._gl.clearDepth(this._depthValue);
            this._gl.clearStencil(this._stencilValue);

            this._version = this._gl.getParameter(this._gl.VERSION);

            this._supportUintIndexes = false || this._gl.getExtension('OES_element_index_uint') !== null;
        }

        public get version(): string {
            return this._version;
        }

        public get supprotUintIndexes(): boolean {
            return this._supportUintIndexes;
        }

        public get internalGL(): WebGLRenderingContext {
            return this._gl;
        }

        public clearWithClearData(data: GLClearData): void {
            this.clear(data.color, data.clearColor, data.depth, data.clearDepth, data.stencil, data.clearStencil);
        }

        public clear(color: Color4, clearColor: boolean, depth: number, clearDepth: boolean, stencil: uint, clearStencil: boolean): void {
            if (color && !this._clearColor.isEqual(color)) {
                this._clearColor.setFromColor4(color);
                this._gl.clearColor(this._clearColor.r, this._clearColor.g, this._clearColor.b, this._clearColor.a);
            }

            if (this._depthValue !== depth) {
                this._depthValue = depth;
                this._gl.clearDepth(this._depthValue);
            }

            if (this._stencilValue !== stencil) {
                this._stencilValue = stencil;
                this._gl.clearStencil(this._stencilValue);
            }

            let mask = 0;
            if (clearColor) mask |= this._gl.COLOR_BUFFER_BIT;
            if (clearDepth) mask |= this._gl.DEPTH_BUFFER_BIT;
            if (clearStencil) mask |= this._gl.STENCIL_BUFFER_BIT;

            if (mask !== 0) this._gl.clear(mask);
        }
    }
}