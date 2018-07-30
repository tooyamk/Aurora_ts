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

    export enum GLVertexBufferSize {
        ONE = 1,
        TWO = 2,
        THREE = 3,
        FOUR = 4
    }

    export enum GLVertexBufferType {
        BYTE = 5120,
        UNSIGNED_BYTE = 5121,
        SHORT = 5122,
        UNSIGNED_SHORT = 5123,
        INT = 5124,
        UNSIGNED_INT = 5125,
        FLOAT = 5126
    }

    export class GLVertexBuffer {
        private _gl: GL;
        private _buffer: WebGLBuffer;

        private _size: GLVertexBufferSize;
        private _type: GLVertexBufferType;
        private _needNormalized: boolean;

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

                this._gl = null;
            }
        }

        public upload(data: number[] | ArrayBuffer | ArrayBufferView, size: GLVertexBufferSize = GLVertexBufferSize.FOUR, type: GLVertexBufferType = GLVertexBufferType.FLOAT, needNormalized: boolean = false, updatable: boolean = false): void {
            if (this._buffer) {
                this._size = size;
                this._type = type;
                this._needNormalized = needNormalized;

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

        public bind(): void {
            this._gl.bindVertexBuffer(this);
        }

        public use(index: int): void {
            this.bind();

            this._gl.internalGL.vertexAttribPointer(index, this._size, this._type, this._needNormalized, 0, 0);
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

                this._gl = null;
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

        public bind(): void {
            this._gl.bindIndexBuffer(this);
        }
    }

    export enum GLShaderType {
        VERTEX,
        FRAGMENT
    }

    export class GLShader {
        private _gl: GL;
        private _shader: WebGLShader;

        constructor(gl: GL, type: GLShaderType) {
            this._gl = gl;

            let internalGL = this._gl.internalGL;

            this._shader = internalGL.createShader(type === GLShaderType.VERTEX ? internalGL.VERTEX_SHADER : internalGL.FRAGMENT_SHADER);
        }

        public get internalShader(): WebGLShader {
            return this._shader;
        }

        public dispose(): void {
            if (this._shader) {
                this._gl.internalGL.deleteShader(this._shader);
                this._shader = null;

                this._gl = null;
            }
        }

        public upload(source: string): null | string {
            let gl = this._gl.internalGL;

            gl.shaderSource(this._shader, source);
            gl.compileShader(this._shader);

            let err: null | string = null;
            if (!gl.getShaderParameter(this._shader, gl.COMPILE_STATUS)) {
                err = gl.getShaderInfoLog(this._shader);
            }

            return err;
        }

        public static compileShader(gl:GL, type: GLShaderType, source: string): WebGLShader {
            let internalGL = gl.internalGL;

            let shader = internalGL.createShader(type === GLShaderType.VERTEX ? internalGL.VERTEX_SHADER : internalGL.FRAGMENT_SHADER);
            internalGL.shaderSource(shader, source);
            internalGL.compileShader(shader);

            if (!internalGL.getShaderParameter(shader, internalGL.COMPILE_STATUS)) {
                console.log("compile shader error : \n" + source + "\n" + internalGL.getShaderInfoLog(shader));
                internalGL.deleteShader(shader);
                shader = null;
            }

            return shader;
        }
    }

    export class GLProgram {
        private _gl: GL;
        private _program: WebGLProgram;

        constructor(gl: GL) {
            this._gl = gl;

            this._program = this._gl.internalGL.createProgram();
        }

        public get internalProgram(): WebGLProgram {
            return this._program;
        }

        public dispose(): void {
            if (this._program) {
                this._gl.nonuseProgram(this);

                this._gl.internalGL.deleteProgram(this._program);
                this._program = null;

                this._gl = null;
            }
        }

        public compileAndLink(vertexSource: string, fragmentSource: string): null | string {
            let gl = this._gl.internalGL;

            let vert = GLShader.compileShader(this._gl, GLShaderType.VERTEX, vertexSource);
            let frag = GLShader.compileShader(this._gl, GLShaderType.FRAGMENT, fragmentSource);

            let err = this.linkByInternalShander(vert, frag);

            gl.deleteShader(vert);
            gl.deleteShader(frag);

            return err;
        }

        public link(vertexShader: GLShader, fragmentShader: GLShader): null | string {
            return this.linkByInternalShander(vertexShader.internalShader, fragmentShader.internalShader);
        }

        public linkByInternalShander(vertexShader: WebGLShader, fragmentShader: WebGLShader): null | string {
            let gl = this._gl.internalGL;

            gl.attachShader(this._program, vertexShader);
            gl.attachShader(this._program, fragmentShader);

            gl.linkProgram(this._program);

            let linked = gl.getProgramParameter(this._program, gl.LINK_STATUS);

            let err: null | string = null;
            if (!linked) {
                gl.validateProgram(this._program);
                err = gl.getProgramInfoLog(this._program);
            }

            return err;
        }

        public use(): void {
            this._gl.useProgram(this);
        }
    }

    export class GL {
        //public 

        private _gl: WebGLRenderingContext = null;

        private _version: string = "unknow";

        private _maxVertexAttributes: uint = 0;
        private _maxVaryingVectors: uint = 0;
        private _maxVertexUniformVectors: uint = 0;
        private _maxFragmentUniformVectors: uint = 0;

        private _supportUintIndexes: boolean = false;

        private _clearColor: Color4 = Color4.BLACK;
        private _depthValue: number = 1;
        private _stencilValue: uint = 0;

        private _usedProgram: WebGLProgram = null;
        private _boundVertexBuffer: WebGLBuffer = null;
        private _boundIndexBuffer: WebGLBuffer = null;

        constructor(gl: WebGLRenderingContext) {
            this._gl = gl;

            this._gl.clearColor(this._clearColor.r, this._clearColor.g, this._clearColor.b, this._clearColor.a);
            this._gl.clearDepth(this._depthValue);
            this._gl.clearStencil(this._stencilValue);

            this._version = this._gl.getParameter(this._gl.VERSION);

            this._maxVertexAttributes = this._gl.getParameter(this._gl.MAX_VERTEX_ATTRIBS);
            this._maxVaryingVectors = this._gl.getParameter(this._gl.MAX_VARYING_VECTORS);
            this._maxVertexUniformVectors = this._gl.getParameter(this._gl.MAX_VERTEX_UNIFORM_VECTORS); 
            this._maxFragmentUniformVectors = this._gl.getParameter(this._gl.MAX_FRAGMENT_UNIFORM_VECTORS);

            this._supportUintIndexes = false || this._gl.getExtension('OES_element_index_uint') !== null;
        }

        public get version(): string {
            return this._version;
        }

        public get maxVertexAttributes(): uint {
            return this._maxVertexAttributes;
        }

        public get maxVaryingVectors(): uint {
            return this._maxVaryingVectors;
        }

        public get maxVertexUniformVectors(): uint {
            return this._maxVertexUniformVectors;
        }

        public get maxFragmentUniformVectors(): uint {
            return this._maxFragmentUniformVectors;
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

        public useProgram(program: GLProgram): void {
            if (this._usedProgram !== program.internalProgram) {
                this._usedProgram = program.internalProgram;
                this._gl.useProgram(this._usedProgram);
            }
        }

        public nonuseProgram(program: GLProgram): void {
            if (this._usedProgram === program.internalProgram) {
                this._usedProgram = null;
                this._gl.useProgram(null);
            }
        }

        public bindVertexBuffer(buffer: GLVertexBuffer): void {
            if (this._boundVertexBuffer !== buffer.internalBuffer) {
                this._boundVertexBuffer = buffer.internalBuffer;
                this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._boundVertexBuffer);
            }
        }

        public unbindVertexBuffer(buffer: GLVertexBuffer): void {
            if (this._boundVertexBuffer === buffer.internalBuffer) {
                this._boundVertexBuffer = null;
                this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
            }
        }

        public bindIndexBuffer(buffer: GLIndexBuffer): void {
            if (this._boundIndexBuffer !== buffer.internalBuffer) {
                this._boundIndexBuffer = buffer.internalBuffer;
                this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._boundIndexBuffer);
            }
        }

        public unbindIndexBuffer(buffer: GLIndexBuffer): void {
            if (this._boundIndexBuffer === buffer.internalBuffer) {
                this._boundIndexBuffer = null;
                this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, null);
            }
        }

        public getAttributeLocations(program: GLProgram, names: string[], rst: number[] = null): number[] {
            rst = rst || [];

            if (program) {
                let n = names.length;
                for (let i = 0; i < n; ++i) {
                    try {
                        rst[i] = this._gl.getAttribLocation(program.internalProgram, names[i]);
                    } catch (e) {
                        rst[i] = -1;
                    }
                }
                rst.length = n;
            } else {
                rst.length = 0;
            }

            return rst;
        }
    }
}