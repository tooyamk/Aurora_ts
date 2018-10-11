///<reference path="Types.ts" />
///<reference path="math/Color.ts" />
///<reference path="math/Rect.ts" />

//WebGL 2.0
interface WebGLRenderingContext {
    /** **WebGL Version:** 2.0 */
    drawBuffers(buffers: number[]): void;

    /** **WebGL Version:** 2.0 */
    renderbufferStorageMultisample(target: number, samples: number, internalformat: number, width: number, height: number): void;

    texImage2D(target: number, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, pixels: ArrayBufferView | null): void;
    texImage2D(target: number, level: number, internalformat: number, format: number, type: number, pixels: Aurora.GLImage): void;

    /** **WebGL Version:** 2.0 */
    texImage2D(target: number, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, offset: GLintptr): void;

    /** **WebGL Version:** 2.0 */
    texImage2D(target: number, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, source: Aurora.GLImage): void;

    /** **WebGL Version:** 2.0 */
    texImage2D(target: number, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, srcData: ArrayBufferView | null, srcOffset: number): void;

    texSubImage2D(target: number, level: number, xoffset: number, yoffset: number, width: number, height: number, format: number, type: number, pixels: ArrayBufferView | null): void;
    texSubImage2D(target: number, level: number, xoffset: number, yoffset: number, format: number, type: number, pixels: Aurora.GLImage): void;

    /** **WebGL Version:** 2.0 */
    texSubImage2D(target: number, level: number, xoffset: number, yoffset: number, format: number, type: number, offset: GLintptr): void;

    /** **WebGL Version:** 2.0 */
    texSubImage2D(target: number, level: number, xoffset: number, yoffset: number, width: number, height: number, format: number, type: number, source: Aurora.GLImage): void;

    /** **WebGL Version:** 2.0 */
    texSubImage2D(target: number, level: number, xoffset: number, yoffset: number, width: number, height: number, format: number, type: number, srcData: ArrayBufferView | null, srcOffset: number): void;
}

namespace Aurora {
    export class GLClear {
        public readonly color: Color4 = Color4.BLACK;
        public depth = 1.0;
        public stencil = 0;

        private _clearColor = true;
        private _clearDepth = true;
        private _clearStencil = true;
        private _clearMask: uint;

        constructor() {
            this._clearMask = GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT | GL.STENCIL_BUFFER_BIT;
        }

        public get clearMask(): uint {
            return this._clearMask;
        }

        public get clearColor(): boolean {
            return this._clearColor;
        }

        public set clearColor(b: boolean) {
            if (this._clearColor !== b) {
                this._clearColor = b;

                if (b) {
                    this._clearMask |= GL.COLOR_BUFFER_BIT;
                } else {
                    this._clearMask &= ~GL.COLOR_BUFFER_BIT;
                }
            }
        }

        public set clearDepth(b: boolean) {
            if (this._clearDepth !== b) {
                this._clearDepth = b;

                if (b) {
                    this._clearMask |= GL.DEPTH_BUFFER_BIT;
                } else {
                    this._clearMask &= ~GL.DEPTH_BUFFER_BIT;
                }
            }
        }

        public set clearStencil(b: boolean) {
            if (this._clearStencil !== b) {
                this._clearStencil = b;

                if (b) {
                    this._clearMask |= GL.STENCIL_BUFFER_BIT;
                } else {
                    this._clearMask &= ~GL.STENCIL_BUFFER_BIT;
                }
            }
        }
    }

    export abstract class AbstractGLObject {
        protected _gl: GL;

        constructor(gl: GL) {
            this._gl = gl;
        }

        public get gl(): GL {
            return this._gl;
        }
    }

    export abstract class AbstractGLBuffer extends AbstractGLObject {
        protected _buffer: WebGLBuffer;
        protected _bufferType: GLBufferType;
        protected _usage: GLUsageType = GLUsageType.STATIC_DRAW;

        protected _numElements: uint = 0;
        protected _sizePerElement: uint = 0;
        protected _memSize: uint = 0;

        constructor(gl: GL, type: GLBufferType) {
            super(gl);

            this._bufferType = type;
            this._buffer = this._gl.context.createBuffer();
        }

        public get bufferType(): GLBufferType {
            return this._bufferType;
        }

        public get internalBuffer(): WebGLBuffer {
            return this._buffer;
        }

        public get usage(): GLUsageType {
            return this._usage;
        }

        public get numElements(): uint {
            return this._numElements;
        }

        public get memSize(): uint {
            return this._memSize;
        }

        public get sizePerElement(): uint {
            return this._sizePerElement;
        }

        public destroy(): void {
            if (this._buffer) {
                this._gl.unbindBuffer(this);
                this._gl.context.deleteBuffer(this._buffer);
                this._buffer = null;

                this._gl = null;
            }
        }

        public reCreate(): void {
            this._gl.unbindBuffer(this);
            this._gl.context.deleteBuffer(this._buffer);
            this._buffer = this._gl.context.createBuffer();
        }

        public bind(): boolean {
            return this._gl.bindBuffer(this);
        }
    }

    export class GLVertexBuffer extends AbstractGLBuffer {
        private static _idGenerator = 0;

        private _id: number;
        private _uploadCount: number = 0;

        private _size: GLVertexBufferSize = GLVertexBufferSize.FOUR;
        private _dataType: GLVertexBufferDataType = GLVertexBufferDataType.FLOAT;
        private _normalized: boolean = false;

        constructor(gl: GL) {
            super(gl, GLBufferType.ARRAY_BUFFER);

            this._id = ++GLVertexBuffer._idGenerator;
        }

        public static calcSizePerElement(type: GLVertexBufferDataType): uint {
            switch (type) {
                case GLVertexBufferDataType.BYTE, GLVertexBufferDataType.UNSIGNED_BYTE:
                    return 1;
                case GLVertexBufferDataType.SHORT, GLVertexBufferDataType.UNSIGNED_SHORT:
                    return 2;
                case GLVertexBufferDataType.INT, GLVertexBufferDataType.UNSIGNED_INT, GLVertexBufferDataType.FLOAT:
                    return 4
                default:
                    return 0;
            }
        }

        public get id(): number {
            return this._id;
        }

        public get size(): GLVertexBufferSize {
            return this._size;
        }

        public set size(size: GLVertexBufferSize) {
            this._size = size;
        }

        public get dataType(): GLVertexBufferDataType {
            return this._dataType;
        }

        public set dataType(type: GLVertexBufferDataType) {
            this._dataType = type;
        }

        public get normalized(): boolean {
            return this._normalized;
        }

        public set normalized(b: boolean) {
            this._normalized = b;
        }

        public get uploadCount(): number {
            return this._uploadCount;
        }

        /**
         * Need keep memSize accord.
         */
        public resetDataAttrib(size: GLVertexBufferSize = GLVertexBufferSize.FOUR, type: GLVertexBufferDataType = GLVertexBufferDataType.FLOAT, normalized: boolean = false): void {
            if (this._size !== size || this._dataType !== type) {
                this._size = size;
                this._dataType = type;

                this._sizePerElement = GLVertexBuffer.calcSizePerElement(this._dataType);
                this._numElements = (this._memSize / this._sizePerElement) | 0;
            }

            this._normalized = normalized;
        }

        public allocate(numElements: uint, size: GLVertexBufferSize = GLVertexBufferSize.FOUR, type: GLVertexBufferDataType = GLVertexBufferDataType.FLOAT, normalized: boolean = false, usage: GLUsageType = GLUsageType.STATIC_DRAW): void {
            if (this._buffer) {
                ++this._uploadCount;
                this._numElements = numElements;
                this._size = size;
                this._dataType = type;
                this._normalized = normalized;
                this._usage = usage;

                let gl = this._gl.context;

                this.bind();

                this._sizePerElement = GLVertexBuffer.calcSizePerElement(this._dataType);
                this._memSize = numElements * this._sizePerElement;

                gl.bufferData(GL.ARRAY_BUFFER, this._memSize, usage);
            }
        }

        public upload(data: GLVertexBufferData, size: GLVertexBufferSize = GLVertexBufferSize.FOUR, type: GLVertexBufferDataType = GLVertexBufferDataType.FLOAT, normalized: boolean = false, usage: GLUsageType = GLUsageType.STATIC_DRAW): void {
            if (this._buffer) {
                ++this._uploadCount;
                this._size = size;
                this._dataType = type;
                this._normalized = normalized;
                this._usage = usage;

                let gl = this._gl.context;

                this.bind();

                if (data instanceof Array) {
                    let src: ArrayBufferView;
                    switch (type) {
                        case GLVertexBufferDataType.BYTE:
                            {
                                this._sizePerElement = 1;
                                src = new Int8Array(data);

                                break;
                            }
                        case GLVertexBufferDataType.UNSIGNED_BYTE:
                            {
                                this._sizePerElement = 1;
                                src = new Uint8Array(data);

                                break;
                            }
                        case GLVertexBufferDataType.SHORT:
                            {
                                this._sizePerElement = 2;
                                src = new Int16Array(data);

                                break;
                            }
                        case GLVertexBufferDataType.UNSIGNED_SHORT:
                            {
                                this._sizePerElement = 2;
                                src = new Uint16Array(data);

                                break;
                            }
                        case GLVertexBufferDataType.INT:
                            {
                                this._sizePerElement = 4;
                                src = new Uint32Array(data);

                                break;
                            }
                        case GLVertexBufferDataType.UNSIGNED_INT:
                            {
                                this._sizePerElement = 4;
                                src = new Uint32Array(data);

                                break;
                            }
                        case GLVertexBufferDataType.FLOAT:
                            {
                                this._sizePerElement = 4;
                                src = new Float32Array(data);

                                break;
                            }
                        default:
                            this._sizePerElement = 0;
                            break;
                    }

                    this._numElements = data.length;
                    this._memSize = this._numElements * this._sizePerElement;

                    gl.bufferData(GL.ARRAY_BUFFER, src, usage);
                } else {
                    this._memSize = data.byteLength;
                    this._sizePerElement = GLVertexBuffer.calcSizePerElement(this._dataType);
                    this._numElements = (this._memSize / this._sizePerElement) | 0;

                    gl.bufferData(GL.ARRAY_BUFFER, <ArrayBuffer>data, usage);
                }
            }
        }

        public uploadSub(data: GLVertexBufferData, offsetElements: int = 0): void {
            if (this._buffer) {
                ++this._uploadCount;
                let gl = this._gl.context;

                this.bind();

                if (data instanceof Array) {
                    let src: ArrayBufferView;
                    switch (this._dataType) {
                        case GLVertexBufferDataType.BYTE:
                            src = new Int8Array(data);
                            break;
                        case GLVertexBufferDataType.UNSIGNED_BYTE:
                            src = new Uint8Array(data);
                            break;
                        case GLVertexBufferDataType.SHORT:
                            src = new Int16Array(data);
                            break;
                        case GLVertexBufferDataType.UNSIGNED_SHORT:
                            src = new Uint16Array(data);
                            break;
                        case GLVertexBufferDataType.INT:
                            src = new Uint32Array(data);
                            break;
                        case GLVertexBufferDataType.UNSIGNED_INT:
                            src = new Uint32Array(data);
                            break;
                        case GLVertexBufferDataType.FLOAT:
                            src = new Float32Array(data);
                            break;
                        default:
                            break;
                    }

                    gl.bufferSubData(GL.ARRAY_BUFFER, offsetElements * this._sizePerElement, src);
                } else {
                    gl.bufferSubData(GL.ARRAY_BUFFER, offsetElements * this._sizePerElement, <ArrayBuffer>data);
                }
            }
        }

        public use(location: uint): void {
            this._gl.activeVertexAttrib(this, location, this._size, this._dataType, this._normalized, 0, 0);
        }
    }

    export class GLIndexBuffer extends AbstractGLBuffer {
        private _dataType: GLIndexDataType = GLIndexDataType.UNSIGNED_SHORT;

        constructor(gl: GL) {
            super(gl, GLBufferType.ELEMENT_ARRAY_BUFFER);
        }

        public get dataType(): GLIndexDataType {
            return this._dataType;
        }

        public set dataType(type: GLIndexDataType) {
            this._dataType = type;
        }

        public allocate(numElements: uint, type: GLIndexDataType = GLIndexDataType.UNSIGNED_SHORT, usage: GLUsageType = GLUsageType.STATIC_DRAW): void {
            if (this._buffer) {
                this._numElements = numElements;
                this._dataType = type;
                this._usage = usage;

                let gl = this._gl.context;

                this.bind();

                switch (type) {
                    case GLIndexDataType.UNSIGNED_BYTE:
                        this._sizePerElement = 1;
                        break;
                    case GLIndexDataType.UNSIGNED_SHORT:
                        this._sizePerElement = 2;
                        break;
                    case GLIndexDataType.UNSIGNED_INT:
                        this._sizePerElement = 4;
                        break;
                    case GLIndexDataType.AUTO:
                        throw new Error("type cannot set AUTO");
                        break;
                    default:
                        throw new Error("invalid type");
                        break;
                }


                this._memSize = numElements * this._sizePerElement;

                gl.bufferData(GL.ELEMENT_ARRAY_BUFFER, this._memSize, usage);
            }
        }

        public upload(data: uint[] | Uint32Array | Uint16Array | Uint8Array | ArrayBuffer, type: GLIndexDataType = GLIndexDataType.AUTO, usage: GLUsageType = GLUsageType.STATIC_DRAW): void {
            if (this._buffer) {
                this._usage = usage;

                let gl = this._gl.context;

                this.bind();

                if (data instanceof ArrayBuffer) {
                    this._dataType = type;

                    switch (this._dataType) {
                        case GLIndexDataType.UNSIGNED_BYTE:
                            this._sizePerElement = 1;
                            break;
                        case GLIndexDataType.UNSIGNED_SHORT:
                            this._sizePerElement = 2;
                            break;
                        case GLIndexDataType.UNSIGNED_INT:
                            this._sizePerElement = 4;
                            break;
                        default:
                            throw new Error("type cannot set AUTO");
                            break;
                    }

                    this._numElements = (data.byteLength / this._sizePerElement) | 0;
                    this._memSize = data.byteLength;

                    gl.bufferData(GL.ELEMENT_ARRAY_BUFFER, data, usage);
                } else {
                    let src;

                    if (data instanceof Uint8Array) {
                        src = data;
                        this._dataType = GLIndexDataType.UNSIGNED_BYTE;
                    } else if (data instanceof Uint16Array) {
                        src = data;
                        this._dataType = GLIndexDataType.UNSIGNED_SHORT;
                    } else if (data instanceof Uint32Array) {
                        if (this._gl.supprotUintIndexes) {
                            src = data;
                            this._dataType = GLIndexDataType.UNSIGNED_INT;
                        } else {
                            src = new Uint16Array(data);
                            this._dataType = GLIndexDataType.UNSIGNED_SHORT;
                        }
                    } else {
                        if (type == GLIndexDataType.AUTO) {
                            this._dataType = GLIndexDataType.UNSIGNED_BYTE;
                            for (let i = data.length - 1; i >= 0; --i) {
                                let v = data[i];
                                if (v > 0xFFFF) {
                                    this._dataType = GLIndexDataType.UNSIGNED_INT;
                                    break;
                                } else if (this._dataType === GLIndexDataType.UNSIGNED_BYTE && v > 0xFF) {
                                    this._dataType = GLIndexDataType.UNSIGNED_SHORT;
                                }
                            }

                            if (this._dataType === GLIndexDataType.UNSIGNED_INT) {
                                if (this._gl.supprotUintIndexes) {
                                    src = new Uint32Array(data);
                                } else {
                                    src = new Uint16Array(data);
                                    this._dataType = GLIndexDataType.UNSIGNED_SHORT;
                                }
                            } else if (this._dataType === GLIndexDataType.UNSIGNED_SHORT) {
                                src = new Uint16Array(data);
                            } else {
                                src = new Uint8Array(data);
                            }
                        } else {
                            this._dataType = type;
                            switch (this._dataType) {
                                case GLIndexDataType.UNSIGNED_BYTE:
                                    src = new Uint8Array(data);
                                    break;
                                case GLIndexDataType.UNSIGNED_SHORT:
                                    src = new Uint16Array(data);
                                    break;
                                case GLIndexDataType.UNSIGNED_INT:
                                    {
                                        if (this._gl.supprotUintIndexes) {
                                            src = new Uint32Array(data);
                                        } else {
                                            this._dataType = GLIndexDataType.UNSIGNED_SHORT;
                                            src = new Uint16Array(data);
                                        }

                                        break;
                                    }
                                default:
                                    throw new Error("invalid type");
                                    break;
                            }
                        }
                    }

                    switch (this._dataType) {
                        case GLIndexDataType.UNSIGNED_BYTE:
                            this._sizePerElement = 1;
                            break;
                        case GLIndexDataType.UNSIGNED_SHORT:
                            this._sizePerElement = 2;
                            break;
                        case GLIndexDataType.UNSIGNED_INT:
                            this._sizePerElement = 4;
                            break;
                        default:
                            throw new Error("invalid type");
                            break;
                    }

                    this._numElements = src.length;
                    this._memSize = this._numElements * this._sizePerElement;

                    gl.bufferData(GL.ELEMENT_ARRAY_BUFFER, src, usage);
                }
            }
        }

        public uploadSub(data: number[] | Uint32Array | Uint16Array | Uint8Array, offsetElements: int = 0): void {
            if (this._buffer) {
                let gl = this._gl.context;

                this.bind();

                if (data instanceof Array) {
                    let arrayBuffer;
                    if (this._dataType === GLIndexDataType.UNSIGNED_BYTE) {
                        arrayBuffer = new Uint8Array(data);
                    } else if (this._dataType === GLIndexDataType.UNSIGNED_SHORT) {
                        arrayBuffer = new Uint16Array(data);
                    } else {
                        arrayBuffer = new Uint32Array(data);
                    }
                    gl.bufferSubData(GL.ELEMENT_ARRAY_BUFFER, offsetElements * this._sizePerElement, arrayBuffer);
                } else {
                    gl.bufferSubData(GL.ELEMENT_ARRAY_BUFFER, offsetElements * this._sizePerElement, data);
                }
            }
        }

        public draw(mode: GLDrawMode = null, count: uint = null, offset: uint = 0): void {
            this.bind();

            if (mode === null) mode = GL.TRIANGLES;
            if (count === null) count = this._numElements;
            let last = this._numElements - offset;
            if (last > 0) {
                if (count > last) count = last;
                this._gl.drawElements(mode, count, this._dataType, offset);

                let stats = this._gl.stats;
                if (stats) {
                    stats.drawCalls++;
                    if (mode === GLDrawMode.TRIANGLES) {
                        stats.drawTris += (count / 3) | 0;
                    }
                }

                let err = this._gl.context.getError();
                if (err !== GL.NO_ERROR) {
                    this._gl.printConstant("draw error : ", err);
                }
            }
        }
    }

    export class GLShader extends AbstractGLObject {
        private _shader: WebGLShader;
        private _type: GLShaderType;

        constructor(gl: GL, type: GLShaderType) {
            super(gl);

            this._type = type;
            this._shader = this._gl.context.createShader(type);
        }

        public get internalShader(): WebGLShader {
            return this._shader;
        }

        public destroy(): void {
            if (this._shader) {
                this._gl.context.deleteShader(this._shader);
                this._shader = null;

                this._gl = null;
            }
        }

        public upload(source: string): null | string {
            let gl = this._gl.context;

            gl.shaderSource(this._shader, source);
            gl.compileShader(this._shader);

            let err: null | string = null;
            if (!gl.getShaderParameter(this._shader, gl.COMPILE_STATUS)) {
                err = gl.getShaderInfoLog(this._shader);
                GLShader.compileErrorLog(this._type, source, err);
            }

            return err;
        }

        public static compileShader(gl: GL, type: GLShaderType, source: string): WebGLShader {
            let internalGL = gl.context;

            let shader = internalGL.createShader(type);
            internalGL.shaderSource(shader, source);
            internalGL.compileShader(shader);

            if (!internalGL.getShaderParameter(shader, internalGL.COMPILE_STATUS)) {
                GLShader.compileErrorLog(type, source, internalGL.getShaderInfoLog(shader));
                internalGL.deleteShader(shader);
                shader = null;
            }

            return shader;
        }

        private static compileErrorLog(type: GLShaderType, source: string, msg: string): void {
            console.log("compile " + (type === GLShaderType.VERTEX_SHADER ? "vertex" : "fragment") + " shader error : \n" + source + "\n" + msg);
        }
    }

    export class GLProgramAttribInfo {
        public readonly name: string;
        public readonly size: number;
        public readonly type: GLAttributeType;
        public readonly location: number;

        constructor(info: WebGLActiveInfo, location: number) {
            this.name = info.name;
            this.size = info.size;
            this.type = info.type;
            this.location = location;
        }
    }

    export class GLProgramUniformInfo {
        public readonly name: string;
        public readonly isArray: boolean;
        public readonly size: number;
        public readonly type: GLUniformType;
        public readonly location: WebGLUniformLocation;
        public readonly isSampler: boolean;

        constructor(info: WebGLActiveInfo, location: WebGLUniformLocation) {
            this.name = info.name;
            this.size = info.size;
            this.type = info.type;
            this.location = location;

            let len = this.name.length;
            if (len > 3 && this.name.substr(len - 3) === "[0]") {
                this.name = this.name.substr(0, len - 3);
                this.isArray = true;
            } else {
                this.isArray = false;
            }

            this.isSampler = this.type === GLUniformType.SAMPLER_2D || this.type === GLUniformType.SAMPLER_CUBE;
        }
    }

    export const enum GLProgramStatus {
        EMPTY,
        SUCCESSED,
        COMPILE_FAILED
    }

    export class GLProgram extends AbstractGLObject {
        private _program: WebGLProgram;
        private _attributes: GLProgramAttribInfo[] = null;
        private _uniforms: GLProgramUniformInfo[] = null;
        private _numSamplers: uint = 0;
        private _status: GLProgramStatus = GLProgramStatus.EMPTY;

        constructor(gl: GL) {
            super(gl);

            this._program = this._gl.context.createProgram();
        }

        public get status(): GLProgramStatus {
            return this._status;
        }

        public get attributes(): GLProgramAttribInfo[] {
            return this._attributes;
        }

        public get uniforms(): GLProgramUniformInfo[] {
            return this._uniforms;
        }

        public get internalProgram(): WebGLProgram {
            return this._program;
        }

        public get numSamplers(): uint {
            return this._numSamplers;
        }

        public hasUniform(name: string): boolean {
            if (this._uniforms) {
                for (let i = 0, n = this._uniforms.length; i < n; ++i) {
                    if (this._uniforms[i].name === name) return true;
                }
            }

            return false;
        }

        public destroy(): void {
            if (this._program) {
                this._gl.nonuseProgram(this);

                this._gl.context.deleteProgram(this._program);
                this._program = null;

                this._gl = null;
            }
        }

        public compileAndLink(vertexSource: string, fragmentSource: string): null | string {
            let gl = this._gl.context;

            let vert = GLShader.compileShader(this._gl, GLShaderType.VERTEX_SHADER, vertexSource);
            let frag = GLShader.compileShader(this._gl, GLShaderType.FRAGMENT_SHADER, fragmentSource);

            let err = this.linkByInternalShander(vert, frag);

            gl.deleteShader(vert);
            gl.deleteShader(frag);

            return err;
        }

        public link(vertexShader: GLShader, fragmentShader: GLShader): null | string {
            return this.linkByInternalShander(vertexShader.internalShader, fragmentShader.internalShader);
        }

        public linkByInternalShander(vertexShader: WebGLShader, fragmentShader: WebGLShader): null | string {
            let gl = this._gl.context;

            gl.attachShader(this._program, vertexShader);
            gl.attachShader(this._program, fragmentShader);

            gl.linkProgram(this._program);

            let linked = gl.getProgramParameter(this._program, GL.LINK_STATUS);
            let err: null | string = null;
            if (linked) {
                let count = gl.getProgramParameter(this._program, GL.ACTIVE_ATTRIBUTES);
                this._attributes = [];
                for (let i = 0; i < count; ++i) {
                    let info = gl.getActiveAttrib(this._program, i);
                    this._attributes[i] = new GLProgramAttribInfo(info, gl.getAttribLocation(this._program, info.name));
                }

                count = gl.getProgramParameter(this._program, GL.ACTIVE_UNIFORMS);
                this._uniforms = [];
                for (let i = 0; i < count; ++i) {
                    let info = gl.getActiveUniform(this._program, i);
                    let pu = new GLProgramUniformInfo(info, gl.getUniformLocation(this._program, info.name));
                    this._uniforms[i] = pu;
                    if (pu.isSampler)++this._numSamplers;
                }

                this._status = GLProgramStatus.SUCCESSED;
            } else {
                gl.validateProgram(this._program);
                err = gl.getProgramInfoLog(this._program);
                console.log("link program error : " + err);

                this._attributes = null;
                this._uniforms = null;
                this._status = GLProgramStatus.COMPILE_FAILED;
            }

            return err;
        }

        public use(): void {
            this._gl.useProgram(this);
        }
    }

    export abstract class AbstractGLTexture extends AbstractGLObject {
        protected _tex: WebGLTexture;
        protected _textureType: GLTexType;
        protected _width: uint = 0;
        protected _height: uint = 0;

        constructor(gl: GL, type: GLTexType) {
            super(gl);

            this._textureType = type;
            this._tex = this._gl.context.createTexture();

            this.setWraps(GLTexWrapValue.CLAMP_TO_EDGE);
            this.setFilters(GLTexFilterValue.LINEAR);
        }

        public get width(): uint {
            return this._width;
        }

        public get height(): uint {
            return this._height;
        }

        public get textureType(): GLTexType {
            return this._textureType;
        }

        public get internalTexture(): WebGLTexture {
            return this._tex;
        }

        public destroy(): void {
            if (this._tex) {
                this._gl.unbindTexture(this);

                this._gl.context.deleteTexture(this._tex);
                this._tex = null;

                this._gl = null;
            }
        }

        public setFilters(value: GLTexFilterValue): void {
            if (this.bind()) {
                let gl = this._gl.context;
                gl.texParameteri(this._textureType, GLTexFilterType.TEXTURE_MIN_FILTER, value);
                gl.texParameteri(this._textureType, GLTexFilterType.TEXTURE_MAG_FILTER, value);
            }
        }

        public setFilter(type: GLTexFilterType, value: GLTexFilterValue): void {
            if (this.bind()) this._gl.context.texParameteri(this._textureType, type, value);
        }

        public setWraps(value: GLTexWrapValue): void {
            if (this.bind()) {
                let gl = this._gl.context;
                gl.texParameteri(this._textureType, GLTexWrapType.TEXTURE_WRAP_S, value);
                gl.texParameteri(this._textureType, GLTexWrapType.TEXTURE_WRAP_T, value);
            }
        }

        public setWrap(type: GLTexWrapType, value: GLTexFilterValue): void {
            if (this.bind()) this._gl.context.texParameteri(this._textureType, type, value);
        }

        public generateMipmap(): void {
            if (this.bind()) this._gl.context.generateMipmap(this._textureType);
        }

        public bind(force: boolean = false): boolean {
            if (this._tex) {
                this._gl.bindTexture(this, force);
                return true;
            } else {
                console.log("can not call bind method, tex is destroyed");
                return false;
            }
        }

        public use(index: uint, location: WebGLUniformLocation): boolean {
            if (this._tex) {
                if (this._gl.activeTexture(this, index)) {
                    this._gl.context.uniform1i(location, index);
                    return true;
                }
            } else {
                console.log("can not call use method, tex is destroyed");
            }
            return false;
        }

        protected _upload2D(target: int, level: int, internalformat: GLTexInternalFormat, args: any[]): void {
            if (this._tex) {
                this.bind();

                if (this._gl.version >= 2) {
                    if (args.length > 5) {
                        if (level === 0) {
                            this._width = args[0];
                            this._height = args[1];
                        }
                        if (args[4] instanceof AbstractGLBuffer) {
                            args[4].bind();
                            this._gl.context.texImage2D(target, level, internalformat, <uint>args[0], <uint>args[1], 0, <GLTexFormat>args[2], <GLTexDataType>args[3], <GLintptr>args[5]);
                        } else {
                            let buf = <ArrayBufferView>args[4];
                            if (buf) {
                                this._gl.context.texImage2D(target, level, internalformat, <uint>args[0], <uint>args[1], 0, <GLTexFormat>args[2], <GLTexDataType>args[3], buf, <int>args[1]);
                            } else {
                                this._gl.context.texImage2D(target, level, internalformat, <uint>args[0], <uint>args[1], 0, <GLTexFormat>args[2], <GLTexDataType>args[3], buf);
                            }
                        }
                    } else if (args.length > 4) {
                        if (level === 0) {
                            this._width = args[0];
                            this._height = args[1];
                        }
                        this._gl.context.texImage2D(target, level, internalformat, <uint>args[0], <uint>args[1], 0, <GLTexFormat>args[2], <GLTexDataType>args[3], <GLImage>args[4]);
                    } else {
                        let img = <GLImage>args[2];
                        if (level === 0) {
                            this._width = img.width;
                            this._height = img.height;
                        }
                        this._gl.context.texImage2D(target, level, internalformat, img.width, img.height, 0, <GLTexFormat>args[0], <GLTexDataType>args[1], img);
                    }
                } else {
                    if (args.length > 5) {
                        if (args[4] instanceof AbstractGLBuffer) {
                            //not supproted
                        } else {
                            if (level === 0) {
                                this._width = args[0];
                                this._height = args[1];
                            }
                            this._gl.context.texImage2D(target, level, internalformat, <uint>args[0], <uint>args[1], 0, <GLTexFormat>args[2], <GLTexDataType>args[3], <ArrayBufferView>args[4]);
                        }
                    } else if (args.length > 4) {
                        let img = <GLImage>args[4];
                        if (level === 0) {
                            this._width = img.width;
                            this._height = img.height;
                        }
                        this._gl.context.texImage2D(target, level, internalformat, <GLTexFormat>args[2], <GLTexDataType>args[3], img);
                    } else {
                        let img = <GLImage>args[2];
                        if (level === 0) {
                            this._width = img.width;
                            this._height = img.height;
                        }
                        this._gl.context.texImage2D(target, level, internalformat, <GLTexFormat>args[0], <GLTexDataType>args[1], img);
                    }
                }
            }
        }

        protected _uploadSub2D(target: int, level: int, xoffset: number, yoffset: number, args: any[]): void {
            if (this._tex) {
                this.bind();

                let argsLen = args.length;

                if (this._gl.version >= 2) {
                    switch (args.length) {
                        case 6:
                            this._gl.context.texSubImage2D(target, level, xoffset, yoffset, <uint>args[0], <uint>args[1], <GLTexFormat>args[2], <GLTexDataType>args[3], <ArrayBufferView>args[4], <int>args[1]);
                            break;
                        case 5:
                            this._gl.context.texSubImage2D(target, level, xoffset, yoffset, <uint>args[0], <uint>args[1], <GLTexFormat>args[2], <GLTexDataType>args[3], <GLImage>args[4]);
                            break;
                        case 4:
                            {
                                (<AbstractGLBuffer>args[2]).bind();
                                this._gl.context.texSubImage2D(target, level, xoffset, yoffset, <GLTexFormat>args[0], <GLTexDataType>args[1], <GLintptr>args[3]);

                                break;
                            }
                        case 3:
                            {
                                let img = <GLImage>args[2];
                                this._gl.context.texSubImage2D(target, level, xoffset, yoffset, img.width, img.height, <GLTexFormat>args[0], <GLTexDataType>args[1], img);

                                break;
                            }
                        default:
                            break;
                    }
                } else {
                    switch (args.length) {
                        case 6:
                            this._gl.context.texSubImage2D(target, level, xoffset, yoffset, <uint>args[0], <uint>args[1], <GLTexFormat>args[2], <GLTexDataType>args[3], <ArrayBufferView>args[4]);
                            break;
                        case 5:
                            this._gl.context.texSubImage2D(target, level, xoffset, yoffset, <GLTexFormat>args[2], <GLTexDataType>args[3], <GLImage>args[4]);
                            break;
                        case 4://not supported
                            break;
                        case 3:
                            this._gl.context.texSubImage2D(target, level, xoffset, yoffset, <GLTexFormat>args[0], <GLTexDataType>args[1], <GLImage>args[2]);
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    export class GLTexture2D extends AbstractGLTexture {
        constructor(gl: GL) {
            super(gl, GLTexType.TEXTURE_2D);
        }

        /**
         * **WebGL Version:** 2.0.
         */
        public upload(level: int, internalformat: GLTexInternalFormat, width: uint, height: uint, format: GLTexFormat, type: GLTexDataType, buffer: AbstractGLBuffer, offset: GLintptr): void;

        /**
         * @param format In WebGL 1.0 the value must equal internalformat.
         */
        public upload(level: int, internalformat: GLTexInternalFormat, format: GLTexFormat, type: GLTexDataType, source: GLImage): void;

        /**
         * @param width Use for WebGL 2.0.
         * @param height Use for WebGL 2.0.
         * @param format In WebGL 1.0 the value must equal internalformat.
         */
        public upload(level: int, internalformat: GLTexInternalFormat, width: uint, height: uint, format: GLTexFormat, type: GLTexDataType, source: GLImage): void;

        /**
         * @param format In WebGL 1.0 the value must equal internalformat.
         * @param srcOffset Use for WebGL 2.0
         */
        public upload(level: int, internalformat: GLTexInternalFormat, width: uint, height: uint, format: GLTexFormat, type: GLTexDataType, srcData: ArrayBufferView, srcOffset: int): void;

        public upload(level: int, internalformat: GLTexInternalFormat, ...args: any[]): void {
            this._upload2D(this._textureType, level, internalformat, args);
        }

        /**
         * **WebGL Version:** 2.0.
         * 
         * ---
         * @param format In WebGL 1.0 the value must equal internalformat.
         */
        public uploadSub(level: int, xoffset: number, yoffset: number, format: GLTexFormat, type: GLTexDataType, buffer: AbstractGLBuffer, offset: GLintptr): void;

        /**
         * @param format In WebGL 1.0 the value must equal internalformat.
         */
        public uploadSub(level: int, xoffset: number, yoffset: number, format: GLTexFormat, type: GLTexDataType, source: GLImage): void

        /**
         * @param width Use for WebGL 2.0.
         * @param height Use for WebGL 2.0.
         * @param format In WebGL 1.0 the value must equal internalformat.
         */
        public uploadSub(level: int, xoffset: number, yoffset: number, width: uint, height: uint, format: GLTexFormat, type: GLTexDataType, source: GLImage): void;

        /**
         * @param format In WebGL 1.0 the value must equal internalformat.
         * @param srcOffset Use for WebGL 2.0
         */
        public uploadSub(level: int, xoffset: number, yoffset: number, width: uint, height: uint, format: GLTexFormat, type: GLTexDataType, srcData: ArrayBufferView, srcOffset: int): void;

        public uploadSub(level: int, xoffset: number, yoffset: number, ...args: any[]): void {
            this._uploadSub2D(this._textureType, level, xoffset, yoffset, args);
        }
    }

    export class GLTextureCube extends AbstractGLTexture {
        constructor(gl: GL) {
            super(gl, GLTexType.TEXTURE_CUBE_MAP);
        }

        /**
         * **WebGL Version:** 2.0.
         */
        public upload(face: GLTexCubeFace, level: int, internalformat: GLTexInternalFormat, width: uint, height: uint, format: GLTexFormat, type: GLTexDataType, buffer: AbstractGLBuffer, offset: GLintptr): void;

        /**
         * @param format In WebGL 1.0 the value must equal internalformat.
         */
        public upload(face: GLTexCubeFace, level: int, internalformat: GLTexInternalFormat, format: GLTexFormat, type: GLTexDataType, source: GLImage): void;

        /**
         * @param width Use for WebGL 2.0.
         * @param height Use for WebGL 2.0.
         * @param format In WebGL 1.0 the value must equal internalformat.
         */
        public upload(face: GLTexCubeFace, level: int, internalformat: GLTexInternalFormat, width: uint, height: uint, format: GLTexFormat, type: GLTexDataType, source: GLImage): void;

        /**
         * @param format In WebGL 1.0 the value must equal internalformat.
         * @param srcOffset Use for WebGL 2.0
         */
        public upload(face: GLTexCubeFace, level: int, internalformat: GLTexInternalFormat, width: uint, height: uint, format: GLTexFormat, type: GLTexDataType, srcData: ArrayBufferView, srcOffset: int): void;

        public upload(face: GLTexCubeFace, level: int, internalformat: GLTexInternalFormat, ...args: any[]): void {
            this._upload2D(face, level, internalformat, args);
        }

        /**
         * **WebGL Version:** 2.0.
         * 
         * ---
         * @param format In WebGL 1.0 the value must equal internalformat.
         */
        public uploadSub(face: GLTexCubeFace, level: int, xoffset: number, yoffset: number, format: GLTexFormat, type: GLTexDataType, buffer: AbstractGLBuffer, offset: GLintptr): void;

        /**
         * @param format In WebGL 1.0 the value must equal internalformat.
         */
        public uploadSub(face: GLTexCubeFace, level: int, xoffset: number, yoffset: number, format: GLTexFormat, type: GLTexDataType, source: GLImage): void

        /**
         * @param width Use for WebGL 2.0.
         * @param height Use for WebGL 2.0.
         * @param format In WebGL 1.0 the value must equal internalformat.
         */
        public uploadSub(face: GLTexCubeFace, level: int, xoffset: number, yoffset: number, width: uint, height: uint, format: GLTexFormat, type: GLTexDataType, source: GLImage): void;

        /**
         * @param format In WebGL 1.0 the value must equal internalformat.
         * @param srcOffset Use for WebGL 2.0
         */
        public uploadSub(face: GLTexCubeFace, level: int, xoffset: number, yoffset: number, width: uint, height: uint, format: GLTexFormat, type: GLTexDataType, srcData: ArrayBufferView, srcOffset: int): void;

        public uploadSub(face: GLTexCubeFace, level: int, xoffset: number, yoffset: number, ...args: any[]): void {
            this._uploadSub2D(face, level, xoffset, yoffset, args);
        }
    }

    export class GLFrameBuffer extends AbstractGLObject {
        private _buffer: WebGLFramebuffer;
        private _width: uint;
        private _height: uint;

        constructor(gl: GL, width: uint = 0, height: uint = 0) {
            super(gl);

            this._width = width;
            this._height = height;

            this._buffer = this._gl.context.createFramebuffer();
        }

        public get width(): uint {
            return this._width;
        }

        public get height(): uint {
            return this._height;
        }

        public get internalBuffer(): WebGLFramebuffer {
            return this._buffer;
        }

        public destroy(): void {
            if (this._buffer) {
                this._gl.unbindFrameBuffer(0, this);

                this._gl.context.deleteFramebuffer(this._buffer);
                this._buffer = null;

                this._gl = null;
            }
        }

        public setSize(width: uint, height: uint): void {
            this._width = width;
            this._height = height;
        }

        public setAttachmentRenderBuffer(attachment: GLRenderBufferAttachment, renderBuffer: GLRenderBuffer): void {
            if (this._buffer) {
                this.bind();

                let buf: WebGLRenderbuffer = renderBuffer ? renderBuffer.internalBuffer : null;
                //renderBuffer.bind();

                this._gl.context.framebufferRenderbuffer(GL.FRAMEBUFFER, attachment, GL.RENDERBUFFER, buf);
            }
        }

        public setAttachmentTexture2D(attachment: GLTex2DAttachment, texTarget: GLFrameBufferTexTarget, tex: AbstractGLTexture): void {
            if (this._buffer) {
                this.bind();

                let internalTex = tex ? tex.internalTexture : null;

                this._gl.context.framebufferTexture2D(GL.FRAMEBUFFER, attachment, texTarget, internalTex, 0);
            }
        }

        public checkStatus(): boolean {
            if (this._buffer) {
                this.bind();

                let err = this._gl.context.checkFramebufferStatus(GL.FRAMEBUFFER);
                if (err === GL.FRAMEBUFFER_COMPLETE) {
                    return true;
                } else {
                    this._gl.printConstant("frame buffer status error : ", err);
                    return false;
                }
            } else {
                return false;
            }
        }

        public bind(target: GLFrameBufferTarget = GLFrameBufferTarget.FRAMEBUFFER): void {
            this._gl.bindFrameBuffer(target, this);
        }

        public clear(data: GLClear): void {
            this.bind();
            this._gl.clear(data);
        }
    }

    export class GLRenderBuffer extends AbstractGLObject {
        private _buffer: WebGLRenderbuffer;

        constructor(gl: GL) {
            super(gl);

            this._buffer = this._gl.context.createRenderbuffer();
        }

        public get internalBuffer(): WebGLRenderbuffer {
            return this._buffer;
        }

        public destroy(): void {
            if (this._buffer) {
                this._gl.unbindRenderBuffer(this);

                this._gl.context.deleteRenderbuffer(this._buffer);
                this._buffer = null;

                this._gl = null;
            }
        }

        public storage(internalFormat: GLRenderBufferInternalFormat, width: uint, height: uint): void {
            if (this._buffer) {
                this.bind();
                this._gl.context.renderbufferStorage(GL.RENDERBUFFER, internalFormat, width, height);
            }
        }

        /**
         * **WebGL Version:** WebGL 2.0
         * 
         * ---
         */
        public multiSample(internalFormat: GLRenderBufferInternalFormat, samples: int, width: uint, height: uint): void {
            if (this._buffer) {
                this.bind();
                this._gl.context.renderbufferStorageMultisample(GL.RENDERBUFFER, samples, internalFormat, width, height);
            }
        }

        public bind(): void {
            this._gl.bindRenderBuffer(this);
        }
    }

    /** 
     * In the WebGL, constant color and constant alpha cannot be used together as source and destination factors in the blend function.
     */
    export class GLBlendFunc {
        public srcRGB: GLBlendFactorValue = GLBlendFactorValue.ONE;
        public srcAlpha: GLBlendFactorValue = GLBlendFactorValue.ONE;
        public dstRGB: GLBlendFactorValue = GLBlendFactorValue.ZERO;
        public dstAlpha: GLBlendFactorValue = GLBlendFactorValue.ZERO;

        public set(sfactor: GLBlendFactorValue, dfactor: GLBlendFactorValue): GLBlendFunc {
            this.srcRGB = sfactor;
            this.srcAlpha = sfactor;
            this.dstRGB = dfactor;
            this.dstAlpha = dfactor;
            return this;
        }

        public setSeparate(sRGB: GLBlendFactorValue, dRGB: GLBlendFactorValue, sA: GLBlendFactorValue, dA: GLBlendFactorValue): GLBlendFunc {
            this.srcRGB = sRGB;
            this.srcAlpha = sA;
            this.dstRGB = dRGB;
            this.dstAlpha = dA;
            return this;
        }

        public copy(target: GLBlendFunc): GLBlendFunc {
            this.srcRGB = target.srcRGB;
            this.srcAlpha = target.srcAlpha;
            this.dstRGB = target.dstRGB;
            this.dstAlpha = target.dstAlpha;
            return this;
        }

        public clone(): GLBlendFunc {
            let bf = new GLBlendFunc();
            bf.srcRGB = this.srcRGB;
            bf.srcAlpha = this.srcAlpha;
            bf.dstRGB = this.dstRGB;
            bf.dstAlpha = this.dstAlpha;
            return bf;
        }

        public isEqual(target: GLBlendFunc): boolean {
            return this.srcRGB === target.srcRGB && this.srcAlpha === target.srcAlpha && this.dstRGB === target.dstRGB && this.dstAlpha === target.dstAlpha;
        }

        public static isEqual(value0: GLBlendFunc, value1: GLBlendFunc): boolean {
            if (value0 === value1) return true;
            if (value0) {
                if (value1) {
                    return value0.srcRGB === value1.srcRGB && value0.srcAlpha === value1.srcAlpha && value0.dstRGB === value1.dstRGB && value0.dstAlpha === value1.dstAlpha;
                } else {
                    return false;
                }
            } else if (value1) {
                return false;
            }
            return true;
        }
    }

    export class GLBlendEquation {
        public rgb: GLBlendEquationType = GLBlendEquationType.FUNC_ADD;
        public alpha: GLBlendEquationType = GLBlendEquationType.FUNC_ADD;

        public clone(): GLBlendEquation {
            let be = new GLBlendEquation();
            be.rgb = this.rgb;
            be.alpha = this.alpha;
            return be;
        }

        public isEqual(target: GLBlendEquation): boolean {
            return this.rgb === target.rgb && this.alpha === target.alpha;
        }

        public static isEqual(value0: GLBlendEquation, value1: GLBlendEquation): boolean {
            if (value0 === value1) return true;
            if (value0) {
                if (value1) {
                    return value0.rgb === value1.rgb && value0.alpha === value1.alpha;
                } else {
                    return false;
                }
            } else if (value1) {
                return false;
            }
            return true;
        }

        public set(mode: GLBlendEquationType): void {
            this.rgb = mode;
            this.alpha = mode;
        }

        public setSeparate(modeRGB: GLBlendEquationType, modeA: GLBlendEquationType): void {
            this.rgb = modeRGB;
            this.alpha = modeA;
        }
    }

    export class GLBlend {
        public equation: GLBlendEquation = null;
        public func: GLBlendFunc = null;
        public constantColor: Color4 = null;

        constructor(equation: GLBlendEquation = null, func: GLBlendFunc = null, color: Color4 = null) {
            this.equation = equation || new GLBlendEquation();
            this.func = func || new GLBlendFunc();
            this.constantColor = color || Color4.TRANSPARENT_BLACK;
        }

        public clone() : GLBlend {
            let b = new GLBlend();
            if (this.equation) b.equation = this.equation.clone();
            if (this.func) b.func = this.func.clone();
            if (this.constantColor) b.constantColor = this.constantColor.clone();
            return b;
        }

        public static isEqual(value0: GLBlend, value1: GLBlend): boolean {
            if (value0 === value1) return true;
            if (value0) {
                if (value1) {
                    return GLBlendEquation.isEqual(value0.equation, value1.equation) &&
                        GLBlendFunc.isEqual(value0.func, value1.func) &&
                        Color4.isEqual(value0.constantColor, value1.constantColor);
                } else {
                    return false;
                }
            } else if (value1) {
                return false;
            }
            return true;
        }
    }

    export class GLColorWrite {
        public r: boolean = true;
        public g: boolean = true;
        public b: boolean = true;
        public a: boolean = true;

        public clone() : GLColorWrite {
            let cw = new GLColorWrite();
            cw.r = this.r;
            cw.g = this.g;
            cw.b = this.b;
            cw.a = this.a;
            return cw;
        }

        public isEqual(target: GLColorWrite): boolean {
            return this.r === target.r && this.g === target.g && this.b === target.b && this.a === target.a;
        }

        public static isEqual(value0: GLColorWrite, value1: GLColorWrite): boolean {
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

        public set(target: GLColorWrite): void {
            this.r = target.r;
            this.g = target.g;
            this.b = target.b;
            this.a = target.a;
        }
    }

    export class GLStencil {
        /** In the WebGL, Front and Back must be consistent. */
        public writeMask: uint = 0xFFFFFFF;

        //func
        public func: GLStencilFunc = GLStencilFunc.ALWAYS;
        /** In the WebGL, Front and Back must be consistent. */
        public ref: uint = 0;
        /** In the WebGL, Front and Back must be consistent. */
        public funcMask: uint = 0xFFFFFFFF;

        //op
        public stenciFail: GLStencilOpType = GLStencilOpType.KEEP;
        public depthlFail: GLStencilOpType = GLStencilOpType.KEEP;
        public pass: GLStencilOpType = GLStencilOpType.KEEP;

        public copyFunc(target: GLStencil): void {
            this.func = target.func;
            this.ref = target.ref;
            this.funcMask = target.funcMask;
        }

        public copyOp(target: GLStencil): void {
            this.stenciFail = target.stenciFail;
            this.depthlFail = target.depthlFail;
            this.pass = target.pass;
        }

        public clone(): GLStencil {
            let s = new GLStencil();
            s.writeMask = this.writeMask;
            s.func = this.func;
            s.ref = this.ref;
            s.funcMask = this.funcMask;
            s.stenciFail = this.stenciFail;
            s.depthlFail = this.depthlFail;
            s.pass = this.pass;
            return s;
        }

        public isEqual(target: GLStencil): boolean {
            return this.writeMask === target.writeMask && this.isFuncEqual(target) && this.isOpEqual(target);
        }

        public static isEqual(value0: GLStencil, value1: GLStencil): boolean {
            if (value0 === value1) return true;
            if (value0) {
                if (value1) {
                    return value0.writeMask === value1.writeMask && value0.isFuncEqual(value1) && value0.isOpEqual(value1);
                } else {
                    return false;
                }
            } else if (value1) {
                return false;
            }
            return true;
        }

        public isFuncEqual(target: GLStencil): boolean {
            return this.func === target.func && this.ref === target.ref && this.funcMask === target.funcMask;
        }

        public isOpEqual(target: GLStencil): boolean {
            return this.stenciFail === target.stenciFail && this.depthlFail === target.depthlFail && this.pass === target.pass;
        }
    }

    class UsedVertexAttribInfo {
        public bufferID: number = null;
        public uploadCount: number = null;
        public size: number = null;
        public type: number = null;
        public normalized: boolean = null;
        public stride: number = null;
        public offset: number = null;
    }

    class ActivedTextureInfo {
        public texID: number = null;
    }

    export interface GLOptions extends WebGLContextAttributes {
        version?: number;
    }

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
     * @see https://www.khronos.org/registry/webgl/specs/1.0/#6.10
     */
    export class GL {
        /** 
         * Clearing buffers 
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/clear
         * 
         * Constants passed to WebGLRenderingContext.clear() to clear buffer masks.
         */
        /** Passed to clear to clear the current depth buffer. */
        public static readonly DEPTH_BUFFER_BIT = 0x00000100;
        /** Passed to clear to clear the current stencil buffer. */
        public static readonly STENCIL_BUFFER_BIT = 0x00000400;
        /** Passed to clear to clear the current color buffer. */
        public static readonly COLOR_BUFFER_BIT = 0x00004000;

        /** 
         * Rendering primitives 
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawArrays
         * 
         * Constants passed to WebGLRenderingContext.drawElements() or WebGLRenderingContext.drawArrays() 
         * to specify what kind of primitive to render.
         */
        /** Passed to drawElements or drawArrays to draw single points. */
        public static readonly POINTS = 0x0000;
        /** Passed to drawElements or drawArrays to draw lines. Each vertex connects to the one after it. */
        public static readonly LINES = 0x0001;
        /** Passed to drawElements or drawArrays to draw lines. Each set of two vertices is treated as a separate line segment. */
        public static readonly LINE_LOOP = 0x0002;
        /** Passed to drawElements or drawArrays to draw a connected group of line segments from the first vertex to the last. */
        public static readonly LINE_STRIP = 0x0003;
        /** Passed to drawElements or drawArrays to draw triangles. Each set of three vertices creates a separate triangle. */
        public static readonly TRIANGLES = 0x0004;
        /** Passed to drawElements or drawArrays to draw a connected group of triangles. */
        public static readonly TRIANGLE_STRIP = 0x0005;
        /** Passed to drawElements or drawArrays to draw a connected group of triangles. Each vertex connects to the previous and the first vertex in the fan. */
        public static readonly TRIANGLE_FAN = 0x0006;

        /**
         * Blending modes
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFuncSeparate
         * 
         * Constants passed to WebGLRenderingContext.blendFunc() or WebGLRenderingContext.blendFuncSeparate() 
         * to specify the blending mode (for both, RBG and alpha, or separately).
         */
        /** Passed to blendFunc or blendFuncSeparate to turn off a component. */
        public static readonly ZERO = 0;
        /** Passed to blendFunc or blendFuncSeparate to turn on a component. */
        public static readonly ONE = 1;
        /** Passed to blendFunc or blendFuncSeparate to multiply a component by the source elements color.    */
        public static readonly SRC_COLOR = 0x0300;
        /** Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source elements color. */
        public static readonly ONE_MINUS_SRC_COLOR = 0x0301;
        /** Passed to blendFunc or blendFuncSeparate to multiply a component by the source's alpha. */
        public static readonly SRC_ALPHA = 0x0302;
        /** Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source's alpha. */
        public static readonly ONE_MINUS_SRC_ALPHA = 0x0303;
        /** Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's alpha. */
        public static readonly DST_ALPHA = 0x0304;
        /** Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's alpha. */
        public static readonly ONE_MINUS_DST_ALPHA = 0x0305;
        /** Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's color. */
        public static readonly DST_COLOR = 0x0306;
        /** Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's color. */
        public static readonly ONE_MINUS_DST_COLOR = 0x0307;
        /** Passed to blendFunc or blendFuncSeparate to multiply a component by the minimum of source's alpha or one minus the destination's alpha. */
        public static readonly SRC_ALPHA_SATURATE = 0x0308;
        /** Passed to blendFunc or blendFuncSeparate to specify a constant color blend function. */
        public static readonly CONSTANT_COLOR = 0x8001;
        /** Passed to blendFunc or blendFuncSeparate to specify one minus a constant color blend function. */
        public static readonly ONE_MINUS_CONSTANT_COLOR = 0x8002;
        /** Passed to blendFunc or blendFuncSeparate to specify a constant alpha blend function. */
        public static readonly CONSTANT_ALPHA = 0x8003;
        /** Passed to blendFunc or blendFuncSeparate to specify one minus a constant alpha blend function. */
        public static readonly ONE_MINUS_CONSTANT_ALPHA = 0x8004;

        /**
         * Blending equations
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquationSeparate
         * 
         * Constants passed to WebGLRenderingContext.blendEquation() or 
         * WebGLRenderingContext.blendEquationSeparate() to control how the blending is 
         * calculated (for both, RBG and alpha, or separately).
         */
        /** Passed to blendEquation or blendEquationSeparate to set an addition blend function. */
        public static readonly FUNC_ADD = 0x8006;
        /** Passed to blendEquation or blendEquationSeparate to specify a subtraction blend function (source - destination). */
        public static readonly FUNC_SUBTRACT = 0x800A;
        /** Passed to blendEquation or blendEquationSeparate to specify a reverse subtraction blend function (destination - source). */
        public static readonly FUNC_REVERSE_SUBTRACT = 0x800B;

        /**
         * Getting GL parameter information
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
         * 
         * Constants passed to WebGLRenderingContext.getParameter() to specify what information to return.
         */
        /** Passed to getParameter to get the current RGB blend function. */
        public static readonly BLEND_EQUATION = 0x8009;
        /** Passed to getParameter to get the current RGB blend function. Same as BLEND_EQUATION. */
        public static readonly BLEND_EQUATION_RGB = 0x8009;
        /** Passed to getParameter to get the current alpha blend function. Same as BLEND_EQUATION. */
        public static readonly BLEND_EQUATION_ALPHA = 0x883D;
        /** Passed to getParameter to get the current destination RGB blend function. */
        public static readonly BLEND_DST_RGB = 0x80C8;
        /** Passed to getParameter to get the current destination RGB blend function. */
        public static readonly BLEND_SRC_RGB = 0x80C9;
        /** Passed to getParameter to get the current destination alpha blend function. */
        public static readonly BLEND_DST_ALPHA = 0x80CA;
        /** Passed to getParameter to get the current source alpha blend function. */
        public static readonly BLEND_SRC_ALPHA = 0x80CB;
        /** Passed to getParameter to return a the current blend color. */
        public static readonly BLEND_COLOR = 0x8005;
        /** Passed to getParameter to get the array buffer binding. */
        public static readonly ARRAY_BUFFER_BINDING = 0x8894;
        /** Passed to getParameter to get the current element array buffer. */
        public static readonly ELEMENT_ARRAY_BUFFER_BINDING = 0x8895;
        /** Passed to getParameter to get the current lineWidth (set by the lineWidth method). */
        public static readonly LINE_WIDTH = 0x0B21;
        /** Passed to getParameter to get the current size of a point drawn with gl.POINTS. */
        public static readonly ALIASED_POINT_SIZE_RANGE = 0x846D;
        /** Passed to getParameter to get the range of available widths for a line. Returns a length-2 array with the lo value at 0, and hight at 1. */
        public static readonly ALIASED_LINE_WIDTH_RANGE = 0x846E;
        /** Passed to getParameter to get the current value of cullFace. Should return FRONT, BACK, or FRONT_AND_BACK. */
        public static readonly CULL_FACE_MODE = 0x0B45;
        /** Passed to getParameter to determine the current value of frontFace. Should return CW or CCW. */
        public static readonly FRONT_FACE = 0x0B46;
        /** Passed to getParameter to return a length-2 array of floats giving the current depth range. */
        public static readonly DEPTH_RANGE = 0x0B70;
        /** Passed to getParameter to determine if the depth write mask is enabled. */
        public static readonly DEPTH_WRITEMASK = 0x0B72;
        /** Passed to getParameter to determine the current depth clear value. */
        public static readonly DEPTH_CLEAR_VALUE = 0x0B73;
        /** Passed to getParameter to get the current depth function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL. */
        public static readonly DEPTH_FUNC = 0x0B74;
        /** Passed to getParameter to get the value the stencil will be cleared to. */
        public static readonly STENCIL_CLEAR_VALUE = 0x0B91;
        /** Passed to getParameter to get the current stencil function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL. */
        public static readonly STENCIL_FUNC = 0x0B92;
        /** Passed to getParameter to get the current stencil fail function. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP. */
        public static readonly STENCIL_FAIL = 0x0B94;
        /** Passed to getParameter to get the current stencil fail function should the depth buffer test fail. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP. */
        public static readonly STENCIL_PASS_DEPTH_FAIL = 0x0B95;
        /** Passed to getParameter to get the current stencil fail function should the depth buffer test pass. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP. */
        public static readonly STENCIL_PASS_DEPTH_PASS = 0x0B96;
        /** Passed to getParameter to get the reference value used for stencil tests. */
        public static readonly STENCIL_REF = 0x0B97;
        public static readonly STENCIL_VALUE_MASK = 0x0B93;
        public static readonly STENCIL_WRITEMASK = 0x0B98;
        public static readonly STENCIL_BACK_FUNC = 0x8800;
        public static readonly STENCIL_BACK_FAIL = 0x8801;
        public static readonly STENCIL_BACK_PASS_DEPTH_FAIL = 0x8802;
        public static readonly STENCIL_BACK_PASS_DEPTH_PASS = 0x8803;
        public static readonly STENCIL_BACK_REF = 0x8CA3;
        public static readonly STENCIL_BACK_VALUE_MASK = 0x8CA4;
        public static readonly STENCIL_BACK_WRITEMASK = 0x8CA5;
        /** Returns an Int32Array with four elements for the current viewport dimensions. */
        public static readonly VIEWPORT = 0x0BA2;
        /** Returns an Int32Array with four elements for the current scissor box dimensions. */
        public static readonly SCISSOR_BOX = 0x0C10;
        public static readonly COLOR_CLEAR_VALUE = 0x0C22;
        public static readonly COLOR_WRITEMASK = 0x0C23;
        public static readonly UNPACK_ALIGNMENT = 0x0CF5;
        public static readonly PACK_ALIGNMENT = 0x0D05;
        public static readonly MAX_TEXTURE_SIZE = 0x0D33;
        public static readonly MAX_VIEWPORT_DIMS = 0x0D3A;
        public static readonly SUBPIXEL_BITS = 0x0D50;
        public static readonly RED_BITS = 0x0D52;
        public static readonly GREEN_BITS = 0x0D53;
        public static readonly BLUE_BITS = 0x0D54;
        public static readonly ALPHA_BITS = 0x0D55;
        public static readonly DEPTH_BITS = 0x0D56;
        public static readonly STENCIL_BITS = 0x0D57;
        public static readonly POLYGON_OFFSET_UNITS = 0x2A00;
        public static readonly POLYGON_OFFSET_FACTOR = 0x8038;
        public static readonly TEXTURE_BINDING_2D = 0x8069;
        public static readonly SAMPLE_BUFFERS = 0x80A8;
        public static readonly SAMPLES = 0x80A9;
        public static readonly SAMPLE_COVERAGE_VALUE = 0x80AA;
        public static readonly SAMPLE_COVERAGE_INVERT = 0x80AB;
        public static readonly COMPRESSED_TEXTURE_FORMATST = 0x86A3;
        public static readonly VENDOR = 0x1F00;
        public static readonly RENDERER = 0x1F01;
        public static readonly VERSION = 0x1F02;
        public static readonly IMPLEMENTATION_COLOR_READ_TYPE = 0x8B9A;
        public static readonly IMPLEMENTATION_COLOR_READ_FORMAT = 0x8B9B;
        public static readonly BROWSER_DEFAULT_WEBGL = 0x9244;

        /**
         * Buffers
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferSubData
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getBufferParameter
         * 
         * Constants passed to WebGLRenderingContext.bufferData(), WebGLRenderingContext.bufferSubData(), 
         * WebGLRenderingContext.bindBuffer(), or WebGLRenderingContext.getBufferParameter().
         */
        /** Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and not change often. */
        public static readonly STREAM_DRAW = 0x88E0;
        /** Passed to bufferData as a hint about whether the contents of the buffer are likely to not be used often. */
        public static readonly STATIC_DRAW = 0x88E4;
        /** Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and change often. */
        public static readonly DYNAMIC_DRAW = 0x88E8;
        /** Passed to bindBuffer or bufferData to specify the type of buffer being used. */
        public static readonly ARRAY_BUFFER = 0x8892;
        /** Passed to bindBuffer or bufferData to specify the type of buffer being used. */
        public static readonly ELEMENT_ARRAY_BUFFER = 0x8893;
        /** Passed to getBufferParameter to get a buffer's size. */
        public static readonly BUFFER_SIZE = 0x8764;
        /** Passed to getBufferParameter to get the hint for the buffer passed in when it was created. */
        public static readonly BUFFER_USAGE = 0x8765;

        /**
         * Vertex attributes
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getVertexAttrib
         * 
         * Constants passed to WebGLRenderingContext.getVertexAttrib().
         */
        /** Passed to getVertexAttrib to read back the current vertex attribute. */
        public static readonly CURRENT_VERTEX_ATTRIB = 0x8626;
        public static readonly VERTEX_ATTRIB_ARRAY_ENABLED = 0x8622;
        public static readonly VERTEX_ATTRIB_ARRAY_SIZE = 0x8623;
        public static readonly VERTEX_ATTRIB_ARRAY_STRIDE = 0x8624;
        public static readonly VERTEX_ATTRIB_ARRAY_TYPE = 0x8625;
        public static readonly VERTEX_ATTRIB_ARRAY_NORMALIZED = 0x886A;
        public static readonly VERTEX_ATTRIB_ARRAY_POINTER = 0x8645;
        public static readonly VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 0x889F;

        /** 
         * Culling 
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
         * 
         * Constants passed to WebGLRenderingContext.cullFace().
         */
        /** Passed to enable/disable to turn on/off culling. Can also be used with getParameter to find the current culling method. */
        public static readonly CULL_FACE = 0x0B44;
        /** Passed to cullFace to specify that only front faces should be culled. */
        public static readonly FRONT = 0x0404;
        /** Passed to cullFace to specify that only back faces should be culled. */
        public static readonly BACK = 0x0405;
        /** Passed to cullFace to specify that front and back faces should be culled. */
        public static readonly FRONT_AND_BACK = 0x0408;

        /**
         * Enabling and disabling
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/enable
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/disable
         * 
         * Constants passed to WebGLRenderingContext.enable() or WebGLRenderingContext.disable().
         */
        /** Passed to enable/disable to turn on/off blending. Can also be used with getParameter to find the current blending method. */
        public static readonly BLEND = 0x0BE2;
        /** Passed to enable/disable to turn on/off the depth test. Can also be used with getParameter to query the depth test. */
        public static readonly DEPTH_TEST = 0x0B71;
        /** Passed to enable/disable to turn on/off dithering. Can also be used with getParameter to find the current dithering method. */
        public static readonly DITHER = 0x0BD0;
        /** Passed to enable/disable to turn on/off the polygon offset. Useful for rendering hidden-line images, decals, and or solids with highlighted edges. Can also be used with getParameter to query the scissor test. */
        public static readonly POLYGON_OFFSET_FILL = 0x8037;
        /** Passed to enable/disable to turn on/off the alpha to coverage. Used in multi-sampling alpha channels. */
        public static readonly SAMPLE_ALPHA_TO_COVERAGE = 0x809E;
        /** Passed to enable/disable to turn on/off the sample coverage. Used in multi-sampling. */
        public static readonly SAMPLE_COVERAGE = 0x80A0;
        /** Passed to enable/disable to turn on/off the scissor test. Can also be used with getParameter to query the scissor test. */
        public static readonly SCISSOR_TEST = 0x0C11;
        /** Passed to enable/disable to turn on/off the stencil test. Can also be used with getParameter to query the stencil test. */
        public static readonly STENCIL_TEST = 0x0B90;

        /** 
         * Errors
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getError
         * 
         * Constants returned from WebGLRenderingContext.getError().
         */
        public static readonly NO_ERROR = 0;
        public static readonly INVALID_ENUM = 0x0500;
        public static readonly INVALID_VALUE = 0x0501;
        public static readonly INVALID_OPERATION = 0x0502;
        public static readonly OUT_OF_MEMORY = 0x0505;
        public static readonly CONTEXT_LOST_WEBGL = 0x9242;

        /**
         * Front face directions
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace
         * 
         * Constants passed to WebGLRenderingContext.frontFace().
         */
        /** Passed to frontFace to specify the front face of a polygon is drawn in the clockwise direction. */
        public static readonly CW = 0x0900;
        /** Passed to frontFace to specify the front face of a polygon is drawn in the counter clockwise direction. */
        public static readonly CCW = 0x0901;

        /**
         * Hints
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/hint
         * 
         * Constants passed to WebGLRenderingContext.hint()
         */
        /** There is no preference for this behavior. */
        public static readonly DONT_CARET = 0x1100;
        /** The most efficient behavior should be used. */
        public static readonly FASTESTT = 0x1101;
        /** The most correct or the highest quality option should be used. */
        public static readonly NICESTT = 0x1102;
        /**
         * Hint for the quality of filtering when generating mipmap images with WebGLRenderingContext.generateMipmap(). 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/generateMipmap 
         */
        public static readonly GENERATE_MIPMAP_HINT = 0x8192;

        /**
         * Data types
         */
        public static readonly BYTE = 0x1400;
        public static readonly UNSIGNED_BYTE = 0x1401;
        public static readonly SHORT = 0x1402;
        public static readonly UNSIGNED_SHORT = 0x1403;
        public static readonly INT = 0x1404;
        public static readonly UNSIGNED_INT = 0x1405;
        public static readonly FLOAT = 0x1406;

        /**
         * Pixel formats
         */
        public static readonly DEPTH_COMPONENT = 0x1902;
        public static readonly ALPHA = 0x1906;
        public static readonly RGB = 0x1907;
        public static readonly RGBA = 0x1908;
        public static readonly LUMINANCE = 0x1909;
        public static readonly LUMINANCE_ALPHA = 0x190A;

        /**
         * Pixel types
         */
        /** UNSIGNED_BYTE = 0x1401 //already define */
        public static readonly UNSIGNED_SHORT_4_4_4_4 = 0x8033;
        public static readonly UNSIGNED_SHORT_5_5_5_1 = 0x8034;
        public static readonly UNSIGNED_SHORT_5_6_5 = 0x8363;

        /**
         * Shaders
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createShader
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getShaderParameter
         * 
         * Constants passed to WebGLRenderingContext.createShader() or WebGLRenderingContext.getShaderParameter()
         */
        /** Passed to createShader to define a fragment shader. */
        public static readonly FRAGMENT_SHADER = 0x8B30;
        /** Passed to createShader to define a vertex shader. */
        public static readonly VERTEX_SHADER = 0x8B31;
        /** Passed to getShaderParamter to get the status of the compilation. Returns false if the shader was not compiled. You can then query getShaderInfoLog to find the exact error. */
        public static readonly COMPILE_STATUS = 0x8B81;
        /** Passed to getShaderParamter to determine if a shader was deleted via deleteShader. Returns true if it was, false otherwise. */
        public static readonly DELETE_STATUS = 0x8B80;
        /** Passed to getProgramParameter after calling linkProgram to determine if a program was linked correctly. Returns false if there were errors. Use getProgramInfoLog to find the exact error. */
        public static readonly LINK_STATUS = 0x8B82;
        /** Passed to getProgramParameter after calling validateProgram to determine if it is valid. Returns false if errors were found. */
        public static readonly VALIDATE_STATUS = 0x8B83;
        /** Passed to getProgramParameter after calling attachShader to determine if the shader was attached correctly. Returns false if errors occurred. */
        public static readonly ATTACHED_SHADERS = 0x8B85;
        /** Passed to getProgramParameter to get the number of attributes active in a program. */
        public static readonly ACTIVE_ATTRIBUTES = 0x8B89;
        /** Passed to getProgramParamter to get the number of uniforms active in a program. */
        public static readonly ACTIVE_UNIFORMS = 0x8B86;
        /** The maximum number of entries possible in the vertex attribute list. */
        public static readonly MAX_VERTEX_ATTRIBS = 0x8869;
        public static readonly MAX_VERTEX_UNIFORM_VECTORS = 0x8DFB;
        public static readonly MAX_VARYING_VECTORS = 0x8DFC;
        public static readonly MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8B4D;
        public static readonly MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8B4C;
        /** Implementation dependent number of maximum texture units. At least 8. */
        public static readonly MAX_TEXTURE_IMAGE_UNITS = 0x8872;
        public static readonly MAX_FRAGMENT_UNIFORM_VECTORS = 0x8DFD;
        public static readonly SHADER_TYPE = 0x8B4F;
        public static readonly SHADING_LANGUAGE_VERSION = 0x8B8C;
        public static readonly CURRENT_PROGRAM = 0x8B8D;

        /**
         * Depth or stencil tests
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
         * 
         * Constants passed to WebGLRenderingContext.depthFunc() or WebGLRenderingContext.stencilFunc().
         */
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn. */
        public static readonly NEVER = 0x0200;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn. */
        public static readonly ALWAYS = 0x0207;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value. */
        public static readonly LESS = 0x0201;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value. */
        public static readonly EQUAL = 0x0202;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value. */
        public static readonly LEQUAL = 0x0203;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value. */
        public static readonly GREATER = 0x0204;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value. */
        public static readonly GEQUAL = 0x0206;
        /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value. */
        public static readonly NOTEQUAL = 0x0205;

        /**
         * Stencil actions
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp
         * 
         * Constants passed to WebGLRenderingContext.stencilOp().
         */
        public static readonly KEEP = 0x1E00;
        public static readonly REPLACE = 0x1E01;
        public static readonly INCR = 0x1E02;
        public static readonly DECR = 0x1E03;
        public static readonly INVERT = 0x150A;
        public static readonly INCR_WRAP = 0x8507;
        public static readonly DECR_WRAP = 0x8508;

        /**
         * Textures
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
         * 
         * Constants passed to WebGLRenderingContext.texParameteri(), WebGLRenderingContext.texParameterf(), 
         * WebGLRenderingContext.bindTexture(), WebGLRenderingContext.texImage2D(), and others.
         */
        public static readonly NEAREST = 0x2600;
        public static readonly LINEAR = 0x2601;
        public static readonly NEAREST_MIPMAP_NEAREST = 0x2700;
        public static readonly LINEAR_MIPMAP_NEAREST = 0x2701;
        public static readonly NEAREST_MIPMAP_LINEAR = 0x2702;
        public static readonly LINEAR_MIPMAP_LINEAR = 0x2703;
        public static readonly TEXTURE_MAG_FILTER = 0x2800;
        public static readonly TEXTURE_MIN_FILTER = 0x2801;
        public static readonly TEXTURE_WRAP_S = 0x2802;
        public static readonly TEXTURE_WRAP_T = 0x2803;
        public static readonly TEXTURE_2D = 0x0DE1;
        public static readonly TEXTURE = 0x1702;
        public static readonly TEXTURE_CUBE_MAP = 0x8513;
        public static readonly TEXTURE_BINDING_CUBE_MAP = 0x8514;
        public static readonly TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
        public static readonly TEXTURE_CUBE_MAP_NEGATIVE_X = 0x8516;
        public static readonly TEXTURE_CUBE_MAP_POSITIVE_Y = 0x8517;
        public static readonly TEXTURE_CUBE_MAP_NEGATIVE_Y = 0x8518;
        public static readonly TEXTURE_CUBE_MAP_POSITIVE_Z = 0x8519;
        public static readonly TEXTURE_CUBE_MAP_NEGATIVE_Z = 0x851A;
        public static readonly MAX_CUBE_MAP_TEXTURE_SIZE = 0x851C;
        public static readonly TEXTURE0 = 0x84C0;
        public static readonly TEXTURE1 = 0x84C1;
        public static readonly TEXTURE2 = 0x84C2;
        public static readonly TEXTURE3 = 0x84C3;
        public static readonly TEXTURE4 = 0x84C4;
        public static readonly TEXTURE5 = 0x84C5;
        public static readonly TEXTURE6 = 0x84C6;
        public static readonly TEXTURE7 = 0x84C7;
        public static readonly TEXTURE8 = 0x84C8;
        public static readonly TEXTURE9 = 0x84C9;
        public static readonly TEXTURE10 = 0x84CA;
        public static readonly TEXTURE11 = 0x84CB;
        public static readonly TEXTURE12 = 0x84CC;
        public static readonly TEXTURE13 = 0x84CD;
        public static readonly TEXTURE14 = 0x84CE;
        public static readonly TEXTURE15 = 0x84CF;
        public static readonly TEXTURE16 = 0x84D0;
        public static readonly TEXTURE17 = 0x84D1;
        public static readonly TEXTURE18 = 0x84D2;
        public static readonly TEXTURE19 = 0x84D3;
        public static readonly TEXTURE20 = 0x84D4;
        public static readonly TEXTURE21 = 0x84D5;
        public static readonly TEXTURE22 = 0x84D6;
        public static readonly TEXTURE23 = 0x84D7;
        public static readonly TEXTURE24 = 0x84D8;
        public static readonly TEXTURE25 = 0x84D9;
        public static readonly TEXTURE26 = 0x84DA;
        public static readonly TEXTURE27 = 0x84DB;
        public static readonly TEXTURE28 = 0x84DC;
        public static readonly TEXTURE29 = 0x84DD;
        public static readonly TEXTURE30 = 0x84DE;
        public static readonly TEXTURE31 = 0x84DF;
        public static readonly ACTIVE_TEXTURE = 0x84E0; //The current active texture unit.
        public static readonly REPEAT = 0x2901;
        public static readonly CLAMP_TO_EDGE = 0x812F;
        public static readonly MIRRORED_REPEAT = 0x8370;

        /**
         * Uniform types
         */
        public static readonly FLOAT_VEC2 = 0x8B50;
        public static readonly FLOAT_VEC3 = 0x8B51;
        public static readonly FLOAT_VEC4 = 0x8B52;
        public static readonly INT_VEC2 = 0x8B53;
        public static readonly INT_VEC3 = 0x8B54;
        public static readonly INT_VEC4 = 0x8B55;
        public static readonly BOOL = 0x8B56;
        public static readonly BOOL_VEC2 = 0x8B57;
        public static readonly BOOL_VEC3 = 0x8B58;
        public static readonly BOOL_VEC4 = 0x8B59;
        public static readonly FLOAT_MAT2 = 0x8B5A;
        public static readonly FLOAT_MAT3 = 0x8B5B;
        public static readonly FLOAT_MAT4 = 0x8B5C;
        public static readonly SAMPLER_2D = 0x8B5E;
        public static readonly SAMPLER_CUBE = 0x8B60;

        /**
         * Shader precision-specified types
         */
        public static readonly LOW_FLOAT = 0x8DF0;
        public static readonly MEDIUM_FLOAT = 0x8DF1;
        public static readonly HIGH_FLOAT = 0x8DF2;
        public static readonly LOW_INT = 0x8DF3;
        public static readonly MEDIUM_INT = 0x8DF4;
        public static readonly HIGH_INT = 0x8DF5;

        /**
         * Framebuffers and renderbuffers
         */
        public static readonly FRAMEBUFFER = 0x8D40;
        public static readonly RENDERBUFFER = 0x8D41;
        public static readonly RGBA4 = 0x8056;
        public static readonly RGB5_A1 = 0x8057;
        public static readonly RGB565 = 0x8D62;
        public static readonly DEPTH_COMPONENT16 = 0x81A5;
        public static readonly STENCIL_INDEX = 0x1901;
        public static readonly STENCIL_INDEX8 = 0x8D48;
        public static readonly DEPTH_STENCIL = 0x84F9;
        public static readonly RENDERBUFFER_WIDTH = 0x8D42;
        public static readonly RENDERBUFFER_HEIGHT = 0x8D43;
        public static readonly RENDERBUFFER_INTERNAL_FORMAT = 0x8D44;
        public static readonly RENDERBUFFER_RED_SIZE = 0x8D50;
        public static readonly RENDERBUFFER_GREEN_SIZE = 0x8D51;
        public static readonly RENDERBUFFER_BLUE_SIZE = 0x8D52;
        public static readonly RENDERBUFFER_ALPHA_SIZE = 0x8D53;
        public static readonly RENDERBUFFER_DEPTH_SIZE = 0x8D54;
        public static readonly RENDERBUFFER_STENCIL_SIZE = 0x8D55;
        public static readonly FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE = 0x8CD0;
        public static readonly FRAMEBUFFER_ATTACHMENT_OBJECT_NAME = 0x8CD1;
        public static readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL = 0x8CD2;
        public static readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE = 0x8CD3;
        public static readonly COLOR_ATTACHMENT0 = 0x8CE0;
        public static readonly DEPTH_ATTACHMENT = 0x8D00;
        public static readonly STENCIL_ATTACHMENT = 0x8D20;
        public static readonly DEPTH_STENCIL_ATTACHMENT = 0x821A;
        public static readonly NONE = 0;
        public static readonly FRAMEBUFFER_COMPLETE = 0x8CD5;
        public static readonly FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 0x8CD6;
        public static readonly FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 0x8CD7;
        public static readonly FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 0x8CD9;
        public static readonly FRAMEBUFFER_UNSUPPORTED = 0x8CDD;
        public static readonly FRAMEBUFFER_BINDING = 0x8CA6;
        public static readonly RENDERBUFFER_BINDING = 0x8CA7;
        public static readonly MAX_RENDERBUFFER_SIZE = 0x84E8;
        public static readonly INVALID_FRAMEBUFFER_OPERATION = 0x0506;

        /**
         * Pixel storage modes
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/pixelStorei
         * 
         * Constants passed to WebGLRenderingContext.pixelStorei().
         */
        public static readonly UNPACK_FLIP_Y_WEBGL = 0x9240;
        public static readonly UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;
        public static readonly UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;

        /** WebGL 2.0 */

        /**
         * Getting GL parameter information
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
         * 
         * Constants passed to WebGLRenderingContext.getParameter() to specify what information to return.
         */
        public static readonly READ_BUFFER = 0x0C02;
        public static readonly UNPACK_ROW_LENGTH = 0x0CF2;
        public static readonly UNPACK_SKIP_ROWS = 0x0CF3;
        public static readonly UNPACK_SKIP_PIXELS = 0x0CF4;
        public static readonly PACK_ROW_LENGTH = 0x0D02;
        public static readonly PACK_SKIP_ROWS = 0x0D03;
        public static readonly PACK_SKIP_PIXELS = 0x0D04;
        public static readonly TEXTURE_BINDING_3D = 0x806A;
        public static readonly UNPACK_SKIP_IMAGES = 0x806D;
        public static readonly UNPACK_IMAGE_HEIGHT = 0x806E;
        public static readonly MAX_3D_TEXTURE_SIZE = 0x8073;
        public static readonly MAX_ELEMENTS_VERTICES = 0x80E8;
        public static readonly MAX_ELEMENTS_INDICES = 0x80E9;
        public static readonly MAX_TEXTURE_LOD_BIAS = 0x84FD;
        public static readonly MAX_FRAGMENT_UNIFORM_COMPONENTS = 0x8B49;
        public static readonly MAX_VERTEX_UNIFORM_COMPONENTS = 0x8B4A;
        public static readonly MAX_ARRAY_TEXTURE_LAYERS = 0x88FF;
        public static readonly MIN_PROGRAM_TEXEL_OFFSET = 0x8904;
        public static readonly MAX_PROGRAM_TEXEL_OFFSET = 0x8905;
        public static readonly MAX_VARYING_COMPONENTS = 0x8B4B;
        public static readonly FRAGMENT_SHADER_DERIVATIVE_HINT = 0x8B8B;
        public static readonly RASTERIZER_DISCARD = 0x8C89;
        public static readonly VERTEX_ARRAY_BINDING = 0x85B5;
        public static readonly MAX_VERTEX_OUTPUT_COMPONENTS = 0x9122;
        public static readonly MAX_FRAGMENT_INPUT_COMPONENTS = 0x9125;
        public static readonly MAX_SERVER_WAIT_TIMEOUT = 0x9111;
        public static readonly MAX_ELEMENT_INDEX = 0x8D6B;

        /**
         * Textures
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
         * 
         * Constants passed to WebGLRenderingContext.texParameteri(), WebGLRenderingContext.texParameterf(),
         * WebGLRenderingContext.bindTexture(), WebGLRenderingContext.texImage2D(), and others.
         */
        public static readonly RED = 0x1903;
        public static readonly RGB8 = 0x8051;
        public static readonly RGBA8 = 0x8058;
        public static readonly RGB10_A2 = 0x8059;
        public static readonly TEXTURE_3D = 0x806F;
        public static readonly TEXTURE_WRAP_R = 0x0D03;
        public static readonly TEXTURE_MIN_LOD = 0x813A;
        public static readonly TEXTURE_MAX_LOD = 0x813B;
        public static readonly TEXTURE_BASE_LEVEL = 0x813C;
        public static readonly TEXTURE_MAX_LEVEL = 0x813D;
        public static readonly TEXTURE_COMPARE_MODE = 0x884C;
        public static readonly TEXTURE_COMPARE_FUNC = 0x884D;
        public static readonly SRGB = 0x8C40;
        public static readonly SRGB8 = 0x8C41;
        public static readonly SRGB8_ALPHA8 = 0x8C43;
        public static readonly COMPARE_REF_TO_TEXTURE = 0x884E;
        public static readonly RGBA32F = 0x8814;
        public static readonly RGB32F = 0x8815;
        public static readonly RGBA16F = 0x881A;
        public static readonly RGB16F = 0x881B;
        public static readonly TEXTURE_2D_ARRAY = 0x8C1A;
        public static readonly TEXTURE_BINDING_2D_ARRAY = 0x8C1D;
        public static readonly R11F_G11F_B10F = 0x8C3A;
        public static readonly RGB9_E5 = 0x8C3D;
        public static readonly RGBA32UI = 0x8D70;
        public static readonly RGB32UI = 0x8D71;
        public static readonly RGBA16UI = 0x8D76;
        public static readonly RGB16UI = 0x8D77;
        public static readonly RGBA8UI = 0x8D7C;
        public static readonly RGB8UI = 0x8D7D;
        public static readonly RGBA32I = 0x8D82;
        public static readonly RGB32I = 0x8D83;
        public static readonly RGBA16I = 0x8D88;
        public static readonly RGB16I = 0x8D89;
        public static readonly RGBA8I = 0x8D8E;
        public static readonly RGB8I = 0x8D8F;
        public static readonly RED_INTEGER = 0x8D94;
        public static readonly RGB_INTEGER = 0x8D98;
        public static readonly RGBA_INTEGER = 0x8D99;
        public static readonly R8 = 0x8229;
        public static readonly RG8 = 0x822B;
        public static readonly R16F = 0x822D;
        public static readonly R32F = 0x822E;
        public static readonly RG16F = 0x822F;
        public static readonly RG32F = 0x8230;
        public static readonly R8I = 0x8231;
        public static readonly R8UI = 0x8232;
        public static readonly R16I = 0x8233;
        public static readonly R16UI = 0x8234;
        public static readonly R32I = 0x8235;
        public static readonly R32UI = 0x8236;
        public static readonly RG8I = 0x8237;
        public static readonly RG8UI = 0x8238;
        public static readonly RG16I = 0x8239;
        public static readonly RG16UI = 0x823A;
        public static readonly RG32I = 0x823B;
        public static readonly RG32UI = 0x823C;
        public static readonly R8_SNORM = 0x8F94;
        public static readonly RG8_SNORM = 0x8F95;
        public static readonly RGB8_SNORM = 0x8F96;
        public static readonly RGBA8_SNORM = 0x8F97;
        public static readonly RGB10_A2UI = 0x906F;
        public static readonly TEXTURE_IMMUTABLE_FORMAT = 0x912F;
        public static readonly TEXTURE_IMMUTABLE_LEVELS = 0x82DF;

        /**
         * Pixel types
         */
        public static readonly UNSIGNED_INT_2_10_10_10_REV = 0x8368;
        public static readonly UNSIGNED_INT_10F_11F_11F_REV = 0x8C3B;
        public static readonly UNSIGNED_INT_5_9_9_9_REV = 0x8C3E;
        public static readonly FLOAT_32_UNSIGNED_INT_24_8_REV = 0x8DAD;
        public static readonly UNSIGNED_INT_24_8 = 0x84FA;
        public static readonly HALF_FLOAT = 0x140B;
        public static readonly RG = 0x8227;
        public static readonly RG_INTEGER = 0x8228;
        public static readonly INT_2_10_10_10_REV = 0x8D9F;

        /**
         * Queries
         */
        public static readonly CURRENT_QUERY = 0x8865;
        public static readonly QUERY_RESULT = 0x8866;
        public static readonly QUERY_RESULT_AVAILABLE = 0x8867;
        public static readonly ANY_SAMPLES_PASSED = 0x8C2F;
        public static readonly ANY_SAMPLES_PASSED_CONSERVATIVE = 0x8D6A;

        /**
         * Draw buffers
         */
        public static readonly MAX_DRAW_BUFFERS = 0x8824;
        public static readonly DRAW_BUFFER0 = 0x8825;
        public static readonly DRAW_BUFFER1 = 0x8826;
        public static readonly DRAW_BUFFER2 = 0x8827;
        public static readonly DRAW_BUFFER3 = 0x8828;
        public static readonly DRAW_BUFFER4 = 0x8829;
        public static readonly DRAW_BUFFER5 = 0x882A;
        public static readonly DRAW_BUFFER6 = 0x882B;
        public static readonly DRAW_BUFFER7 = 0x882C;
        public static readonly DRAW_BUFFER8 = 0x882D;
        public static readonly DRAW_BUFFER9 = 0x882E;
        public static readonly DRAW_BUFFER10 = 0x882F;
        public static readonly DRAW_BUFFER11 = 0x8830;
        public static readonly DRAW_BUFFER12 = 0x8831;
        public static readonly DRAW_BUFFER13 = 0x8832;
        public static readonly DRAW_BUFFER14 = 0x8833;
        public static readonly DRAW_BUFFER15 = 0x8834;
        public static readonly MAX_COLOR_ATTACHMENTS = 0x8CDF;
        public static readonly COLOR_ATTACHMENT1 = 0x8CE1;
        public static readonly COLOR_ATTACHMENT2 = 0x8CE2;
        public static readonly COLOR_ATTACHMENT3 = 0x8CE3;
        public static readonly COLOR_ATTACHMENT4 = 0x8CE4;
        public static readonly COLOR_ATTACHMENT5 = 0x8CE5;
        public static readonly COLOR_ATTACHMENT6 = 0x8CE6;
        public static readonly COLOR_ATTACHMENT7 = 0x8CE7;
        public static readonly COLOR_ATTACHMENT8 = 0x8CE8;
        public static readonly COLOR_ATTACHMENT9 = 0x8CE9;
        public static readonly COLOR_ATTACHMENT10 = 0x8CEA;
        public static readonly COLOR_ATTACHMENT11 = 0x8CEB;
        public static readonly COLOR_ATTACHMENT12 = 0x8CEC;
        public static readonly COLOR_ATTACHMENT13 = 0x8CED;
        public static readonly COLOR_ATTACHMENT14 = 0x8CEE;
        public static readonly COLOR_ATTACHMENT15 = 0x8CEF;

        /**
         * Samplers
         */
        public static readonly SAMPLER_3D = 0x8B5F;
        public static readonly SAMPLER_2D_SHADOW = 0x8B62;
        public static readonly SAMPLER_2D_ARRAY = 0x8DC1;
        public static readonly SAMPLER_2D_ARRAY_SHADOW = 0x8DC4;
        public static readonly SAMPLER_CUBE_SHADOW = 0x8DC5;
        public static readonly INT_SAMPLER_2D = 0x8DCA;
        public static readonly INT_SAMPLER_3D = 0x8DCB;
        public static readonly INT_SAMPLER_CUBE = 0x8DCC;
        public static readonly INT_SAMPLER_2D_ARRAY = 0x8DCF;
        public static readonly UNSIGNED_INT_SAMPLER_2D = 0x8DD2;
        public static readonly UNSIGNED_INT_SAMPLER_3D = 0x8DD3;
        public static readonly UNSIGNED_INT_SAMPLER_CUBE = 0x8DD4;
        public static readonly UNSIGNED_INT_SAMPLER_2D_ARRAY = 0x8DD7;
        public static readonly MAX_SAMPLES = 0x8D57;
        public static readonly SAMPLER_BINDING = 0x8919;

        /**
         * Buffers
         */
        public static readonly PIXEL_PACK_BUFFER = 0x88EB;
        public static readonly PIXEL_UNPACK_BUFFER = 0x88EC;
        public static readonly PIXEL_PACK_BUFFER_BINDING = 0x88ED;
        public static readonly PIXEL_UNPACK_BUFFER_BINDING = 0x88EF;
        public static readonly COPY_READ_BUFFER = 0x8F36;
        public static readonly COPY_WRITE_BUFFER = 0x8F37;
        public static readonly COPY_READ_BUFFER_BINDING = 0x8F36;
        public static readonly COPY_WRITE_BUFFER_BINDING = 0x8F37;

        /**
         * Data types
         */
        public static readonly FLOAT_MAT2x3 = 0x8B65;
        public static readonly FLOAT_MAT2x4 = 0x8B66;
        public static readonly FLOAT_MAT3x2 = 0x8B67;
        public static readonly FLOAT_MAT3x4 = 0x8B68;
        public static readonly FLOAT_MAT4x2 = 0x8B69;
        public static readonly FLOAT_MAT4x3 = 0x8B6A;
        public static readonly UNSIGNED_INT_VEC2 = 0x8DC6;
        public static readonly UNSIGNED_INT_VEC3 = 0x8DC7;
        public static readonly UNSIGNED_INT_VEC4 = 0x8DC8;
        public static readonly UNSIGNED_NORMALIZED = 0x8C17;
        public static readonly SIGNED_NORMALIZED = 0x8F9C;

        /**
         * Vertex attributes
         */
        public static readonly VERTEX_ATTRIB_ARRAY_INTEGER = 0x88FD;
        public static readonly VERTEX_ATTRIB_ARRAY_DIVISOR = 0x88FE;

        /**
         * Transform feedback
         */
        public static readonly TRANSFORM_FEEDBACK_BUFFER_MODE = 0x8C7F;
        public static readonly MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS = 0x8C80;
        public static readonly TRANSFORM_FEEDBACK_VARYINGS = 0x8C83;
        public static readonly TRANSFORM_FEEDBACK_BUFFER_START = 0x8C84;
        public static readonly TRANSFORM_FEEDBACK_BUFFER_SIZE = 0x8C85;
        public static readonly TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN = 0x8C88;
        public static readonly MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS = 0x8C8A;
        public static readonly MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS = 0x8C8B;
        public static readonly INTERLEAVED_ATTRIBS = 0x8C8C;
        public static readonly SEPARATE_ATTRIBS = 0x8C8D;
        public static readonly TRANSFORM_FEEDBACK_BUFFER = 0x8C8E;
        public static readonly TRANSFORM_FEEDBACK_BUFFER_BINDING = 0x8C8F;
        public static readonly TRANSFORM_FEEDBACK = 0x8E22;
        public static readonly TRANSFORM_FEEDBACK_PAUSED = 0x8E23;
        public static readonly TRANSFORM_FEEDBACK_ACTIVE = 0x8E24;
        public static readonly TRANSFORM_FEEDBACK_BINDING = 0x8E25;

        /**
         * Framebuffers and renderbuffers
         */
        public static readonly FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING = 0x8210;
        public static readonly FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE = 0x8211;
        public static readonly FRAMEBUFFER_ATTACHMENT_RED_SIZE = 0x8212;
        public static readonly FRAMEBUFFER_ATTACHMENT_GREEN_SIZE = 0x8213;
        public static readonly FRAMEBUFFER_ATTACHMENT_BLUE_SIZE = 0x8214;
        public static readonly FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE = 0x8215;
        public static readonly FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE = 0x8216;
        public static readonly FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE = 0x8217;
        public static readonly FRAMEBUFFER_DEFAULT = 0x8218;
        public static readonly DEPTH24_STENCIL8 = 0x88F0;
        public static readonly DRAW_FRAMEBUFFER_BINDING = 0x8CA6;
        public static readonly READ_FRAMEBUFFER = 0x8CA8;
        public static readonly DRAW_FRAMEBUFFER = 0x8CA9;
        public static readonly READ_FRAMEBUFFER_BINDING = 0x8CAA;
        public static readonly RENDERBUFFER_SAMPLES = 0x8CAB;
        public static readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER = 0x8CD4;
        public static readonly FRAMEBUFFER_INCOMPLETE_MULTISAMPLE = 0x8D56;

        /**
         * Uniforms
         */
        public static readonly UNIFORM_BUFFER = 0x8A11;
        public static readonly UNIFORM_BUFFER_BINDING = 0x8A28;
        public static readonly UNIFORM_BUFFER_START = 0x8A29;
        public static readonly UNIFORM_BUFFER_SIZE = 0x8A2A;
        public static readonly MAX_VERTEX_UNIFORM_BLOCKS = 0x8A2B;
        public static readonly MAX_FRAGMENT_UNIFORM_BLOCKS = 0x8A2D;
        public static readonly MAX_COMBINED_UNIFORM_BLOCKS = 0x8A2E;
        public static readonly MAX_UNIFORM_BUFFER_BINDINGS = 0x8A2F;
        public static readonly MAX_UNIFORM_BLOCK_SIZE = 0x8A30;
        public static readonly MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS = 0x8A31;
        public static readonly MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS = 0x8A33;
        public static readonly UNIFORM_BUFFER_OFFSET_ALIGNMENT = 0x8A34;
        public static readonly ACTIVE_UNIFORM_BLOCKS = 0x8A36;
        public static readonly UNIFORM_TYPE = 0x8A37;
        public static readonly UNIFORM_SIZE = 0x8A38;
        public static readonly UNIFORM_BLOCK_INDEX = 0x8A3A;
        public static readonly UNIFORM_OFFSET = 0x8A3B;
        public static readonly UNIFORM_ARRAY_STRIDE = 0x8A3C;
        public static readonly UNIFORM_MATRIX_STRIDE = 0x8A3D;
        public static readonly UNIFORM_IS_ROW_MAJOR = 0x8A3E;
        public static readonly UNIFORM_BLOCK_BINDING = 0x8A3F;
        public static readonly UNIFORM_BLOCK_DATA_SIZE = 0x8A40;
        public static readonly UNIFORM_BLOCK_ACTIVE_UNIFORMS = 0x8A42;
        public static readonly UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES = 0x8A43;
        public static readonly UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER = 0x8A44;
        public static readonly UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER = 0x8A46;

        /**
         * Sync objects
         */
        public static readonly OBJECT_TYPE = 0x9112;
        public static readonly SYNC_CONDITION = 0x9113;
        public static readonly SYNC_STATUS = 0x9114;
        public static readonly SYNC_FLAGS = 0x9115;
        public static readonly SYNC_FENCE = 0x9116;
        public static readonly SYNC_GPU_COMMANDS_COMPLETE = 0x9117;
        public static readonly UNSIGNALED = 0x9118;
        public static readonly SIGNALED = 0x9119;
        public static readonly ALREADY_SIGNALED = 0x911A;
        public static readonly TIMEOUT_EXPIRED = 0x911B;
        public static readonly CONDITION_SATISFIED = 0x911C;
        public static readonly WAIT_FAILED = 0x911D;
        public static readonly SYNC_FLUSH_COMMANDS_BIT = 0x00000001;

        /**
         * Miscellaneous constants
         */
        public static readonly COLOR = 0x1800;
        public static readonly DEPTH = 0x1801;
        public static readonly STENCIL = 0x1802;
        public static readonly MIN = 0x8007;
        public static readonly MAX = 0x8008;
        public static readonly DEPTH_COMPONENT24 = 0x81A6;
        public static readonly STREAM_READ = 0x88E1;
        public static readonly STREAM_COPY = 0x88E2;
        public static readonly STATIC_READ = 0x88E5;
        public static readonly STATIC_COPY = 0x88E6;
        public static readonly DYNAMIC_READ = 0x88E9;
        public static readonly DYNAMIC_COPY = 0x88EA;
        public static readonly DEPTH_COMPONENT32F = 0x8CAC;
        public static readonly DEPTH32F_STENCIL8 = 0x8CAD;
        public static readonly INVALID_INDEX = 0xFFFFFFFF;
        public static readonly TIMEOUT_IGNORED = -1;
        public static readonly MAX_CLIENT_WAIT_TIMEOUT_WEBGL = 0x9247;


        /** WebGL extensions */

        /**
         * ANGLE_instanced_arrays
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays
         */
        /** Describes the frequency divisor used for instanced rendering. */
        public static readonly VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE = 0x88FE;

        /**
         * WEBGL_debug_renderer_info
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info
         */
        /** Passed to getParameter to get the vendor string of the graphics driver. */
        public static readonly UNMASKED_VENDOR_WEBGL = 0x9245;
        /** Passed to getParameter to get the renderer string of the graphics driver. */
        public static readonly UNMASKED_RENDERER_WEBGL = 0x9246;

        /**
         * EXT_texture_filter_anisotropic
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/EXT_texture_filter_anisotropic
         */
        /** Returns the maximum available anisotropy. */
        public static readonly MAX_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FF;
        /** Passed to texParameter to set the desired maximum anisotropy for a texture. */
        public static readonly TEXTURE_MAX_ANISOTROPY_EXT = 0x84FE;

        /**
         * WEBGL_compressed_texture_s3tc
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_s3tc
         */
        /** A DXT1-compressed image in an RGB image format. */
        public static readonly COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
        /** A DXT1-compressed image in an RGB image format with a simple on/off alpha value. */
        public static readonly COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
        /** A DXT3-compressed image in an RGBA image format. Compared to a 32-bit RGBA texture, it offers 4:1 compression. */
        public static readonly COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
        /** A DXT5-compressed image in an RGBA image format. It also provides a 4:1 compression, but differs to the DXT3 compression in how the alpha compression is done. */
        public static readonly COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

        /**
         * WEBGL_compressed_texture_etc
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_etc
         */
        /** One-channel (red) unsigned format compression. */
        public static readonly COMPRESSED_R11_EAC = 0x9270;
        /** One-channel (red) signed format compression. */
        public static readonly COMPRESSED_SIGNED_R11_EAC = 0x9271;
        /** Two-channel (red and green) unsigned format compression. */
        public static readonly COMPRESSED_RG11_EAC = 0x9272;
        /** Two-channel (red and green) signed format compression. */
        public static readonly COMPRESSED_SIGNED_RG11_EAC = 0x9273;
        /** Compresses RBG8 data with no alpha channel. */
        public static readonly COMPRESSED_RGB8_ETC2 = 0x9274;
        /** Compresses RGBA8 data. The RGB part is encoded the same as RGB_ETC2, but the alpha part is encoded separately. */
        public static readonly COMPRESSED_RGBA8_ETC2_EAC = 0x9275;
        /** Compresses sRBG8 data with no alpha channel. */
        public static readonly COMPRESSED_SRGB8_ETC2 = 0x9276;
        /** Compresses sRGBA8 data. The sRGB part is encoded the same as SRGB_ETC2, but the alpha part is encoded separately. */
        public static readonly COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = 0x9277;
        /** Similar to RGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent. */
        public static readonly COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 0x9278;
        /** Similar to SRGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent. */
        public static readonly COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 0x9279;

        /**
         * WEBGL_compressed_texture_pvrtc
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_pvrtc
         */
        /** RGB compression in 4-bit mode. One block for each 4×4 pixels. */
        public static readonly COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
        /** RGBA compression in 4-bit mode. One block for each 4×4 pixels. */
        public static readonly COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
        /** RGB compression in 2-bit mode. One block for each 8×4 pixels. */
        public static readonly COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8C01;
        /** RGBA compression in 2-bit mode. One block for each 8×4 pixe. */
        public static readonly COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8C03;

        /**
         * WEBGL_compressed_texture_etc1
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_etc1
         */
        /** Compresses 24-bit RGB data with no alpha channel. */
        public static readonly COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;

        /**
         * WEBGL_compressed_texture_atc
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_compressed_texture_atc
         */
        /** Compresses RGB textures with no alpha channel. */
        public static readonly COMPRESSED_RGB_ATC_WEBGL = 0x8C92;
        /** Compresses RGBA textures using explicit alpha encoding (useful when alpha transitions are sharp). */
        public static readonly COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = 0x8C92;
        /** Compresses RGBA textures using interpolated alpha encoding (useful when alpha transitions are gradient). */
        public static readonly COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = 0x87EE;

        /**
         * WEBGL_depth_texture
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_depth_texture
         */
        /** Unsigned integer type for 24-bit depth texture data. */
        public static readonly UNSIGNED_INT_24_8_WEBGL = 0x84FA;

        /**
         * OES_texture_half_float
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/OES_texture_half_float
         */
        /** Half floating-point type (16-bit). */
        public static readonly HALF_FLOAT_OES = 0x8D61;

        /**
         * WEBGL_color_buffer_float
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_color_buffer_float
         */
        /** RGBA 32-bit floating-point color-renderable format. */
        public static readonly RGBA32F_EXT = 0x8814;
        /** RGB 32-bit floating-point color-renderable format. */
        public static readonly RGB32F_EXT = 0x8815;
        public static readonly FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT = 0x8211;
        public static readonly UNSIGNED_NORMALIZED_EXT = 0x8C17;

        /**
         * EXT_blend_minmax
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/EXT_blend_minmax
         */
        /** Produces the minimum color components of the source and destination colors. */
        public static readonly MIN_EXT = 0x8007;
        /** Produces the maximum color components of the source and destination colors. */
        public static readonly MAX_EXT = 0x8008;

        /**
         * EXT_sRGB
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/EXT_sRGB
         */
        /** Unsized sRGB format that leaves the precision up to the driver. */
        public static readonly SRGB_EXT = 0x8C40;
        /** Unsized sRGB format with unsized alpha component. */
        public static readonly SRGB_ALPHA_EXT = 0x8C42;
        /** Sized (8-bit) sRGB and alpha formats. */
        public static readonly SRGB8_ALPHA8_EXT = 0x8C43;
        /** Returns the framebuffer color encoding. */
        public static readonly FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT = 0x8210;

        /**
         * OES_standard_derivatives
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/OES_standard_derivatives
         */
        /** Indicates the accuracy of the derivative calculation for the GLSL built-in functions: dFdx, dFdy, and fwidth. */
        public static readonly FRAGMENT_SHADER_DERIVATIVE_HINT_OES = 0x8B8B;

        /**
         * WEBGL_draw_buffers
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_draw_buffers
         */
        /** ramebuffer color attachment point. */
        public static readonly COLOR_ATTACHMENT0_WEBGL = 0x8CE0;
        public static readonly COLOR_ATTACHMENT1_WEBGL = 0x8CE1;
        public static readonly COLOR_ATTACHMENT2_WEBGL = 0x8CE2;
        public static readonly COLOR_ATTACHMENT3_WEBGL = 0x8CE3;
        public static readonly COLOR_ATTACHMENT4_WEBGL = 0x8CE4;
        public static readonly COLOR_ATTACHMENT5_WEBGL = 0x8CE5;
        public static readonly COLOR_ATTACHMENT6_WEBGL = 0x8CE6;
        public static readonly COLOR_ATTACHMENT7_WEBGL = 0x8CE7;
        public static readonly COLOR_ATTACHMENT8_WEBGL = 0x8CE8;
        public static readonly COLOR_ATTACHMENT9_WEBGL = 0x8CE9;
        public static readonly COLOR_ATTACHMENT10_WEBGL = 0x8CEA;
        public static readonly COLOR_ATTACHMENT11_WEBGL = 0x8CEB;
        public static readonly COLOR_ATTACHMENT12_WEBGL = 0x8CEC;
        public static readonly COLOR_ATTACHMENT13_WEBGL = 0x8CED;
        public static readonly COLOR_ATTACHMENT14_WEBGL = 0x8CEE;
        public static readonly COLOR_ATTACHMENT15_WEBGL = 0x8CEF;
        /** Draw buffer. */
        public static readonly DRAW_BUFFER0_WEBGL = 0x8825;
        public static readonly DRAW_BUFFER1_WEBGL = 0x8826;
        public static readonly DRAW_BUFFER2_WEBGL = 0x8827;
        public static readonly DRAW_BUFFER3_WEBGL = 0x8828;
        public static readonly DRAW_BUFFER4_WEBGL = 0x8829;
        public static readonly DRAW_BUFFER5_WEBGL = 0x882A;
        public static readonly DRAW_BUFFER6_WEBGL = 0x882B;
        public static readonly DRAW_BUFFER7_WEBGL = 0x882C;
        public static readonly DRAW_BUFFER8_WEBGL = 0x882D;
        public static readonly DRAW_BUFFER9_WEBGL = 0x882E;
        public static readonly DRAW_BUFFER10_WEBGL = 0x882F;
        public static readonly DRAW_BUFFER11_WEBGL = 0x8830;
        public static readonly DRAW_BUFFER12_WEBGL = 0x8831;
        public static readonly DRAW_BUFFER13_WEBGL = 0x8832;
        public static readonly DRAW_BUFFER14_WEBGL = 0x8833;
        public static readonly DRAW_BUFFER15_WEBGL = 0x8834;
        /** Maximum number of framebuffer color attachment points. */
        public static readonly MAX_COLOR_ATTACHMENTS_WEBGL = 0x8CDF;
        /** Maximum number of draw buffers. */
        public static readonly MAX_DRAW_BUFFERS_WEBGL = 0x8824;

        /**
         * OES_vertex_array_object
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/OES_vertex_array_object
         */
        /** The bound vertex array object (VAO). */
        public static readonly VERTEX_ARRAY_BINDING_OES = 0x85B5;

        /**
         * EXT_disjoint_timer_query
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query
         */
        /** The number of bits used to hold the query result for the given target. */
        public static readonly QUERY_COUNTER_BITS_EXT = 0x8864;
        /** The currently active query. */
        public static readonly CURRENT_QUERY_EXT = 0x8865;
        /** The query result. */
        public static readonly QUERY_RESULT_EXT = 0x8866;
        /** A Boolean indicating whether or not a query result is available. */
        public static readonly QUERY_RESULT_AVAILABLE_EXT = 0x8867;
        /** Elapsed time (in nanoseconds). */
        public static readonly TIME_ELAPSED_EXT = 0x88BF;
        /** The current time. */
        public static readonly TIMESTAMP_EXT = 0x8E28;
        /** A Boolean indicating whether or not the GPU performed any disjoint operation. */
        public static readonly GPU_DISJOINT_EXT = 0x8FBB;


        public stats: Stats = null;

        private _canvas: HTMLCanvasElement = null;
        private _gl: WebGLRenderingContext = null;

        private _version: number;
        private _versionFullInfo: string = "";
        private _vendor: string = "";
        private _renderer: string = "";

        private _maxVertexAttributes: uint = 0;
        private _maxVaryingVectors: uint = 0;
        private _maxVertexUniformVectors: uint = 0;
        private _maxFragmentUniformVectors: uint = 0;
        private _maxTextureSize: uint = 0;
        private _maxTexutreImageUnits: uint = 0;
        private _stencilBits: uint = 0;

        private _supportUintIndexes: boolean = false;

        private _defaultClear: GLClear = new GLClear();
        private _clear: GLClear = new GLClear();

        private _usedProgram: WebGLProgram = null;
        private _boundVertexBuffer: WebGLBuffer = null;
        private _boundIndexBuffer: WebGLBuffer = null;

        private _enabledBlend: boolean = false;
        private _defaultBlend: GLBlend = new GLBlend();
        private _blend: GLBlend = new GLBlend();

        private _enabledCullFace: boolean;
        private _cullFace: GLCullFace;

        private _enabledDepthTest: boolean;
        private _depthTest: GLDepthTest;

        private _depthWrite: boolean;

        private _viewport: Rect = new Rect();

        private _enabledStencilTest: boolean;
        private _defaultStencil: GLStencil = new GLStencil();
        private _stencilFrontFace: GLStencil = new GLStencil();
        private _stencilBackFace: GLStencil = new GLStencil();

        private _defaultColorWrite: GLColorWrite = new GLColorWrite();
        private _colorWrite: GLColorWrite = new GLColorWrite();

        private _bindingTexture2D: WebGLTexture = null;
        private _bindingTextureCube: WebGLTexture = null;
        private _bindingFrameBuffer: WebGLFramebuffer = null;
        private _bindingReadFrameBuffer: WebGLFramebuffer = null;
        private _bindingDrawFrameBuffer: WebGLFramebuffer = null;
        private _bindingRenderBuffer: WebGLRenderbuffer = null;

        private _activingTextureIndex: uint = 0;

        private _usedVertexAttribs: UsedVertexAttribInfo[] = [];

        constructor(canvasOrContext: HTMLCanvasElement | WebGLRenderingContext, options: GLOptions = null) {
            this._acquireGL(canvasOrContext, options);

            this._versionFullInfo = this._gl.getParameter(GL.VERSION);
            this._vendor = this._gl.getParameter(GL.VENDOR);
            this._renderer = this._gl.getParameter(GL.RENDERER);

            this._maxVertexAttributes = this._gl.getParameter(GL.MAX_VERTEX_ATTRIBS);
            this._maxVaryingVectors = this._gl.getParameter(GL.MAX_VARYING_VECTORS);
            this._maxVertexUniformVectors = this._gl.getParameter(GL.MAX_VERTEX_UNIFORM_VECTORS);
            this._maxFragmentUniformVectors = this._gl.getParameter(GL.MAX_FRAGMENT_UNIFORM_VECTORS);
            this._maxTexutreImageUnits = this._gl.getParameter(GL.MAX_TEXTURE_IMAGE_UNITS);
            this._maxTextureSize = this._gl.getParameter(GL.MAX_TEXTURE_SIZE);
            this._stencilBits = this._gl.getParameter(GL.STENCIL_BITS);

            this._supportUintIndexes = false || this._gl.getExtension('OES_element_index_uint') !== null;

            this._initViewport();
            this._initClear();
            this._initBlend();
            this._initDepth();
            this._initStencil();
            this._initCullFace();
            this._initVertexAttribs();
            this._initColorMask();
            this._initFrameBuffer();
            this._initRenderBUffer();
            this._initTexture();
        }

        private _acquireGL(canvasOrContext: HTMLCanvasElement | WebGLRenderingContext, options: GLOptions): void {
            let canvas: HTMLCanvasElement = null;
            options = options || {};

            let gl: WebGLRenderingContext = null;

            if ((<HTMLCanvasElement>canvasOrContext).getContext) {
                canvas = <HTMLCanvasElement>canvasOrContext;

                let ver: number = 2;

                if (typeof options.version === "number") {
                    ver = options.version >= 2 ? 2 : 1;
                }

                if (ver === 2) {
                    try {
                        gl = <any>(canvas.getContext("webgl2", options) || canvas.getContext("experimental-webgl2", options));
                        if (gl) this._version = 2;
                    } catch (e) {
                    }
                }

                if (!gl) {
                    try {
                        gl = <WebGLRenderingContext>(canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options));
                        if (gl) this._version = 1;
                    } catch (e) {
                        throw new Error("WebGL not supported");
                    }
                }

                if (!gl) throw new Error("WebGL not supported");

                gl.frontFace(GL.CW);
            } else {
                gl = <WebGLRenderingContext>canvasOrContext;
                if (gl) {
                    if (gl.drawBuffers) this._version = 2.0;
                } else {
                    throw new Error("WebGL not supported");
                }
            }

            this._gl = gl;
            this._canvas = gl.canvas;
        }

        private _initViewport(): void {
            let vp = this._gl.getParameter(GL.VIEWPORT);
            this._viewport.set(vp[0], vp[1], vp[2], vp[3]);
        }

        private _initClear(): void {
            let color = this._gl.getParameter(GL.COLOR_CLEAR_VALUE);
            this._clear.color.r = color[0];
            this._clear.color.g = color[1];
            this._clear.color.b = color[2];
            this._clear.color.a = color[3];
            this._clear.depth = this._gl.getParameter(GL.DEPTH_CLEAR_VALUE);
            this._clear.stencil = this._gl.getParameter(GL.STENCIL_CLEAR_VALUE);
        }

        private _initBlend(): void {
            this._enabledBlend = this._gl.isEnabled(GL.BLEND);

            this._blend.equation.rgb = this._gl.getParameter(GL.BLEND_EQUATION_RGB);
            this._blend.equation.alpha = this._gl.getParameter(GL.BLEND_EQUATION_ALPHA);

            this._blend.func.srcRGB = this._gl.getParameter(GL.BLEND_SRC_RGB);
            this._blend.func.srcAlpha = this._gl.getParameter(GL.BLEND_SRC_ALPHA);
            this._blend.func.dstRGB = this._gl.getParameter(GL.BLEND_DST_RGB);
            this._blend.func.dstAlpha = this._gl.getParameter(GL.BLEND_DST_ALPHA);

            let blendColor = this._gl.getParameter(GL.BLEND_COLOR);
            this._blend.constantColor.setFromNumbers(blendColor[0], blendColor[1], blendColor[2], blendColor[3]);
        }

        private _initCullFace(): void {
            this._enabledCullFace = this._gl.isEnabled(GL.CULL_FACE);
            this._cullFace = this._gl.getParameter(GL.CULL_FACE_MODE);
        }

        private _initVertexAttribs(): void {
            this._usedVertexAttribs.length = this._maxFragmentUniformVectors;
            for (let i = 0; i < this._maxFragmentUniformVectors; ++i) this._usedVertexAttribs[i] = new UsedVertexAttribInfo();
        }

        private _initDepth(): void {
            this._depthWrite = this._gl.getParameter(GL.DEPTH_WRITEMASK);

            this._enabledDepthTest = this._gl.isEnabled(GL.DEPTH_TEST);
            this._depthTest = this._gl.getParameter(GL.DEPTH_FUNC);
        }

        private _initStencil(): void {
            this._enabledStencilTest = this._gl.isEnabled(GL.STENCIL_TEST);

            this._stencilFrontFace.writeMask = this._gl.getParameter(GL.STENCIL_WRITEMASK);
            this._stencilFrontFace.func = this._gl.getParameter(GL.STENCIL_FUNC);
            this._stencilFrontFace.ref = this._gl.getParameter(GL.STENCIL_REF);
            this._stencilFrontFace.funcMask = this._gl.getParameter(GL.STENCIL_VALUE_MASK);
            this._stencilFrontFace.stenciFail = this._gl.getParameter(GL.STENCIL_FAIL);
            this._stencilFrontFace.depthlFail = this._gl.getParameter(GL.STENCIL_PASS_DEPTH_FAIL);
            this._stencilFrontFace.pass = this._gl.getParameter(GL.STENCIL_PASS_DEPTH_PASS);

            this._stencilBackFace.writeMask = this._gl.getParameter(GL.STENCIL_BACK_WRITEMASK);
            this._stencilBackFace.func = this._gl.getParameter(GL.STENCIL_BACK_FUNC);
            this._stencilBackFace.ref = this._gl.getParameter(GL.STENCIL_BACK_REF);
            this._stencilBackFace.funcMask = this._gl.getParameter(GL.STENCIL_BACK_VALUE_MASK);
            this._stencilBackFace.stenciFail = this._gl.getParameter(GL.STENCIL_BACK_FAIL);
            this._stencilBackFace.depthlFail = this._gl.getParameter(GL.STENCIL_BACK_PASS_DEPTH_FAIL);
            this._stencilBackFace.pass = this._gl.getParameter(GL.STENCIL_BACK_PASS_DEPTH_PASS);
        }

        private _initColorMask(): void {
            let color = this._gl.getParameter(GL.COLOR_WRITEMASK);
            this._colorWrite.r = color[0];
            this._colorWrite.g = color[1];
            this._colorWrite.b = color[2];
            this._colorWrite.a = color[3];
        }

        private _initFrameBuffer(): void {
            this._bindingFrameBuffer = this._gl.getParameter(GL.FRAMEBUFFER_BINDING);

            if (this._version >= 2) {
                this._bindingReadFrameBuffer = this._gl.getParameter(GL.READ_FRAMEBUFFER_BINDING);
                this._bindingDrawFrameBuffer = this._gl.getParameter(GL.DRAW_FRAMEBUFFER_BINDING);
            }
        }

        private _initRenderBUffer(): void {
            this._bindingRenderBuffer = this._gl.getParameter(GL.RENDERBUFFER_BINDING);
        }

        private _initTexture(): void {
            this._bindingTexture2D = this._gl.getParameter(GL.TEXTURE_BINDING_2D);
            this._bindingTextureCube = this._gl.getParameter(GL.TEXTURE_BINDING_CUBE_MAP);
        }

        public get canvas(): HTMLCanvasElement {
            return this._canvas;
        }

        public get version(): number {
            return this._version;
        }

        public get versionFullInfo(): string {
            return this._versionFullInfo;
        }

        public get vendor(): string {
            return this._vendor;
        }

        public get renderer(): string {
            return this._renderer;
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

        public get maxTexutreImageUnits(): uint {
            return this._maxTexutreImageUnits;
        }

        public get maxTextureSize(): uint {
            return this._maxTextureSize;
        }

        public get stencilBits(): uint {
            return this._stencilBits;
        }

        public get supprotUintIndexes(): boolean {
            return this._supportUintIndexes;
        }

        public get context(): WebGLRenderingContext {
            return this._gl;
        }

        public get drawingBufferWidth(): number {
            return this._gl.drawingBufferWidth;
        }

        public get drawingBufferHeight(): number {
            return this._gl.drawingBufferHeight;
        }

        public setViewport(x: int, y: int, width: int, height: int): void {
            if (this._viewport.x !== x || this._viewport.y !== y || this._viewport.width !== width || this._viewport.height !== height) {
                this._viewport.set(x, y, width, height);

                this._gl.viewport(x, y, width, height);
            }
        }

        public restoreBackBuffer(): void {
            if (this._bindingFrameBuffer !== null) {
                this._bindingFrameBuffer = null;

                if (this._version >= 2) {
                    this._bindingReadFrameBuffer = null;
                    this._bindingDrawFrameBuffer = null;
                }

                this._gl.bindFramebuffer(GL.FRAMEBUFFER, null);
            }
        }

        public clear(data: GLClear): void {
            data = data || this._defaultClear;

            if (!this._clear.color.isEqualColor4(data.color)) {
                this._clear.color.set(data.color);
                this._gl.clearColor(data.color.r, data.color.g, data.color.b, data.color.a);
            }

            if (this._clear.depth !== data.depth) {
                this._clear.depth = data.depth;
                this._gl.clearDepth(data.depth);
            }

            if (this._clear.stencil !== data.stencil) {
                this._clear.stencil = data.stencil;
                this._gl.clearStencil(data.stencil);
            }

            let mask = data.clearMask;
            if (mask !== 0) this._gl.clear(mask);
        }

        public enableBlend(b: boolean): void {
            if (this._enabledBlend !== b) {
                this._enabledBlend = b;

                if (this._enabledBlend) {
                    this._gl.enable(GL.BLEND);
                } else {
                    this._gl.disable(GL.BLEND);
                }
            }
        }

        /**
         * color(RGB) = (sourceColor * srcRGB) + (destinationColor * dstRGB)                                                    
         * color(A) = (sourceAlpha * srcAlpha) + (destinationAlpha * dstAlpha)
         */
        public setBlendFunc(func: GLBlendFunc): void {
            func = func || this._defaultBlend.func;
            if (!this._blend.func.isEqual(func)) {
                this._blend.func.copy(func);

                this._gl.blendFuncSeparate(func.srcRGB, func.dstRGB, func.srcAlpha, func.dstAlpha);
            }
        }

        public setBlendColor(color: Color4): void {
            color = color || this._defaultBlend.constantColor;
            if (!this._blend.constantColor.isEqualColor4(color)) {
                this._blend.constantColor.set(color);

                this._gl.blendColor(color.r, color.g, color.b, color.a);
            }
        }

        public setBlendEquation(mode: GLBlendEquation): void {
            mode = mode || this._defaultBlend.equation;
            if (this._blend.equation.rgb !== mode.rgb || this._blend.equation.alpha !== mode.alpha) {
                this._blend.equation.rgb = mode.rgb;
                this._blend.equation.alpha = mode.alpha;

                this._gl.blendEquationSeparate(mode.rgb, mode.alpha);
            }
        }

        public setBlend(blend: GLBlend): void {
            if (blend) {
                this.enableBlend(true);
                this.setBlendEquation(blend.equation);
                this.setBlendFunc(blend.func);
                this.setBlendColor(blend.constantColor);
            } else {
                this.enableBlend(false);
            }
        }

        public setFrontFace(mode: GLFrontFace): void {
            this._gl.frontFace(mode);
        }

        public setCullFace(mode: GLCullFace): void {
            if (mode === GLCullFace.NONE) {
                if (this._enabledCullFace) {
                    this._enabledCullFace = false;
                    this._gl.disable(GL.CULL_FACE);
                }
            } else {
                if (!this._enabledCullFace) {
                    this._enabledCullFace = true;
                    this._gl.enable(GL.CULL_FACE);
                }

                if (this._cullFace !== mode) {
                    this._cullFace = mode;

                    this._gl.cullFace(mode);
                }
            }
        }

        public setDepthTest(mode: GLDepthTest): void {
            if (mode === GLDepthTest.NONE) {
                if (this._enabledDepthTest) {
                    this._enabledDepthTest = false;
                    this._gl.disable(GL.DEPTH_TEST);
                }
            } else {
                if (!this._enabledDepthTest) {
                    this._enabledDepthTest = true;
                    this._gl.enable(GL.DEPTH_TEST);
                }

                if (this._depthTest !== mode) {
                    this._depthTest = mode;

                    this._gl.depthFunc(mode);
                }
            }
        }

        public setDepthWrite(b: boolean) {
            if (this._depthWrite !== b) {
                this._depthWrite = b;

                this._gl.depthMask(b);
            }
        }

        public setColorWrite(cw: GLColorWrite) {
            cw = cw || this._defaultColorWrite;
            if (!this._colorWrite.isEqual(cw)) {
                this._colorWrite.set(cw);

                this._gl.colorMask(cw.r, cw.g, cw.b, cw.a);
            }
        }

        public setStencil(front: GLStencil, back: GLStencil): void {
            if (front || back) {
                //webgl special handling
                let writeMask: number = null, ref: number = null, funcMask: number = null;

                if (front) {
                    if (!back) {
                        back = this._defaultStencil;
                        writeMask = back.writeMask;
                        ref = back.ref;
                        funcMask = back.funcMask;

                        back.writeMask = front.writeMask;
                        back.ref = front.ref;
                        back.funcMask = front.funcMask;
                    }
                } else {
                    front = this._defaultStencil;
                    writeMask = front.writeMask;
                    ref = front.ref;
                    funcMask = front.funcMask;

                    front.writeMask = back.writeMask;
                    front.ref = back.ref;
                    front.funcMask = back.funcMask;
                }
                //

                //front = front || this._defaultStencil;
                //back = back || this._defaultStencil;

                if (!this._enabledStencilTest) {
                    this._enabledStencilTest = true;

                    this._gl.enable(GL.STENCIL_TEST);
                }

                if (front === back || front.isEqual(back)) {
                    if (this._stencilFrontFace.writeMask !== front.writeMask || this._stencilBackFace.writeMask !== front.writeMask) {
                        this._stencilFrontFace.writeMask = front.writeMask;
                        this._stencilBackFace.writeMask = front.writeMask;

                        this._gl.stencilMaskSeparate(GL.FRONT_AND_BACK, front.writeMask);
                    }

                    if (!this._stencilFrontFace.isFuncEqual(front) || this._stencilBackFace.isFuncEqual(front)) {
                        this._stencilFrontFace.copyFunc(front);
                        this._stencilBackFace.copyFunc(front);

                        this._gl.stencilFuncSeparate(GL.FRONT_AND_BACK, front.func, front.ref, front.funcMask);
                    }

                    if (!this._stencilFrontFace.isOpEqual(front) || !this._stencilBackFace.isOpEqual(front)) {
                        this._stencilFrontFace.copyOp(front);
                        this._stencilBackFace.copyOp(front);

                        this._gl.stencilOpSeparate(GL.FRONT_AND_BACK, front.stenciFail, front.depthlFail, front.pass);
                    }
                } else {
                    this._setStencilSingleFace(GLStencilFace.FRONT, this._stencilFrontFace, front);
                    this._setStencilSingleFace(GLStencilFace.BACK, this._stencilBackFace, back);
                }

                if (writeMask !== null) {
                    this._defaultStencil.writeMask = writeMask;
                    this._defaultStencil.ref = ref;
                    this._defaultStencil.funcMask = funcMask;
                }
            } else {
                if (this._enabledStencilTest) {
                    this._enabledStencilTest = false;

                    this._gl.disable(GL.STENCIL_TEST);
                }
            }
        }

        private _setStencilSingleFace(face: GLStencilFace, self: GLStencil, target: GLStencil): void {
            if (self.writeMask !== target.writeMask) {
                self.writeMask = target.writeMask;

                this._gl.stencilMaskSeparate(face, target.writeMask);
            }

            if (!self.isFuncEqual(target)) {
                self.copyFunc(target);

                this._gl.stencilFuncSeparate(face, target.func, target.ref, target.funcMask);
            }

            if (!self.isOpEqual(target)) {
                self.copyOp(target);

                this._gl.stencilOpSeparate(face, target.stenciFail, target.depthlFail, target.pass);
            }
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

        public drawElements(mode: GLDrawMode, count: GLsizei, type: GLIndexDataType, offset: GLintptr): void {
            this._gl.drawElements(mode, count, type, offset);
        }

        public bindBuffer(buffer: AbstractGLBuffer): boolean {
            let type = buffer.bufferType;
            if (type === GLBufferType.ARRAY_BUFFER) {
                if (this._boundVertexBuffer !== buffer.internalBuffer) {
                    this._boundVertexBuffer = buffer.internalBuffer;
                    this._gl.bindBuffer(type, this._boundVertexBuffer);
                    return true;
                }
            } else if (type === GLBufferType.ELEMENT_ARRAY_BUFFER) {
                if (this._boundIndexBuffer !== buffer.internalBuffer) {
                    this._boundIndexBuffer = buffer.internalBuffer;
                    this._gl.bindBuffer(type, this._boundIndexBuffer);
                    return true;
                }
            }

            return false;
        }

        public unbindBuffer(buffer: AbstractGLBuffer): void {
            let type = buffer.bufferType;
            if (type === GLBufferType.ARRAY_BUFFER) {
                if (this._boundVertexBuffer === buffer.internalBuffer) {
                    this._boundVertexBuffer = null;
                    this._gl.bindBuffer(type, null);
                }
            } else if (type === GLBufferType.ELEMENT_ARRAY_BUFFER) {
                if (this._boundIndexBuffer === buffer.internalBuffer) {
                    this._boundIndexBuffer = null;
                    this._gl.bindBuffer(type, null);
                }
            }
        }

        public bindTexture(tex: AbstractGLTexture, force: boolean = false): boolean {
            let type = tex.textureType;
            if (type === GLTexType.TEXTURE_2D) {
                if (force || this._bindingTexture2D !== tex.internalTexture) {
                    this._bindingTexture2D = tex.internalTexture;
                    this._gl.bindTexture(type, this._bindingTexture2D);
                    return true;
                }
            } else if (type === GLTexType.TEXTURE_CUBE_MAP) {
                if (force || this._bindingTextureCube !== tex.internalTexture) {
                    this._bindingTextureCube = tex.internalTexture;
                    this._gl.bindTexture(type, this._bindingTextureCube);
                    return true;
                }
            }

            return false;
        }

        public unbindTexture(tex: AbstractGLTexture): void {
            let type = tex.textureType;
            if (type === GLTexType.TEXTURE_2D) {
                if (this._bindingTexture2D === tex.internalTexture) {
                    this._bindingTexture2D = null;
                    this._gl.bindBuffer(type, null);
                }
            } else if (type === GLTexType.TEXTURE_CUBE_MAP) {
                if (this._bindingTextureCube === tex.internalTexture) {
                    this._bindingTextureCube = null;
                    this._gl.bindBuffer(type, null);
                }
            }
        }

        public unbindTextureByType(type: GLTexType): void {
            if (type === GLTexType.TEXTURE_2D) {
                if (this._bindingTexture2D) {
                    this._bindingTexture2D = null;
                    this._gl.bindBuffer(type, null);
                }
            } else if (type === GLTexType.TEXTURE_CUBE_MAP) {
                if (this._bindingTextureCube) {
                    this._bindingTextureCube = null;
                    this._gl.bindBuffer(type, null);
                }
            }
        }

        public bindFrameBuffer(target: GLFrameBufferTarget, buffer: GLFrameBuffer): void {
            let buf = buffer.internalBuffer;

            switch (target) {
                case 0:
                    {
                        if (this._bindingFrameBuffer !== buf) {
                            this._bindingFrameBuffer = buf;

                            if (this._version >= 2) {
                                this._bindingReadFrameBuffer = buf;
                                this._bindingDrawFrameBuffer = buf;
                            }

                            this._gl.bindFramebuffer(target, buf);
                        }

                        break;
                    }
                case GLFrameBufferTarget.FRAMEBUFFER:
                    {
                        if (this._bindingFrameBuffer !== buf) {
                            this._bindingFrameBuffer = buf;

                            if (this._version >= 2) {
                                this._bindingReadFrameBuffer = buf;
                                this._bindingDrawFrameBuffer = buf;
                            }

                            this._gl.bindFramebuffer(target, buf);
                        }

                        break;
                    }
                case GLFrameBufferTarget.READ_FRAMEBUFFER:
                    {
                        if (this._version >= 2 && this._bindingReadFrameBuffer !== buf) {
                            this._bindingReadFrameBuffer = buf;

                            this._gl.bindFramebuffer(target, buf);
                        }

                        break;
                    }
                case GLFrameBufferTarget.DRAW_FRAMEBUFFER:
                    {
                        if (this._version >= 2 && this._bindingDrawFrameBuffer !== buf) {
                            this._bindingDrawFrameBuffer = buf;
                            this._bindingFrameBuffer = buf;

                            this._gl.bindFramebuffer(target, buf);
                        }

                        break;
                    }
                default:
                    break;
            }
        }

        public unbindFrameBuffer(target: GLFrameBufferTarget, buffer: GLFrameBuffer): void {
            let buf = buffer.internalBuffer;

            switch (target) {
                case 0:
                    {
                        if (this._bindingFrameBuffer === buf) {
                            this._bindingFrameBuffer = null;

                            if (this._version >= 2) {
                                this._bindingReadFrameBuffer = null;
                                this._bindingDrawFrameBuffer = null;
                            }

                            this._gl.bindFramebuffer(target, null);
                        }

                        break;
                    }
                case GLFrameBufferTarget.FRAMEBUFFER:
                    {
                        if (this._bindingFrameBuffer === buf) {
                            this._bindingFrameBuffer = null;

                            if (this._version >= 2) {
                                this._bindingReadFrameBuffer = null;
                                this._bindingDrawFrameBuffer = null;
                            }

                            this._gl.bindFramebuffer(target, null);
                        }

                        break;
                    }
                case GLFrameBufferTarget.READ_FRAMEBUFFER:
                    {
                        if (this._version >= 2 && this._bindingReadFrameBuffer === buf) {
                            this._bindingReadFrameBuffer = null;

                            this._gl.bindFramebuffer(target, null);
                        }

                        break;
                    }
                case GLFrameBufferTarget.DRAW_FRAMEBUFFER:
                    {
                        if (this._version >= 2 && this._bindingDrawFrameBuffer === buf) {
                            this._bindingDrawFrameBuffer = null;
                            this._bindingFrameBuffer = null;

                            this._gl.bindFramebuffer(target, null);
                        }

                        break;
                    }
                default:
                    break;
            }
        }

        public bindRenderBuffer(buffer: GLRenderBuffer): void {
            if (buffer) {
                if (this._bindingRenderBuffer !== buffer.internalBuffer) {
                    this._bindingRenderBuffer = buffer.internalBuffer;
                    this._gl.bindRenderbuffer(GLRenderBufferType.RENDERBUFFER, this._bindingRenderBuffer);
                }
            } else {
                if (this._bindingRenderBuffer) {
                    this._bindingRenderBuffer = null;
                    this._gl.bindRenderbuffer(GLRenderBufferType.RENDERBUFFER, null);
                }
            }
        }

        public unbindRenderBuffer(buffer: GLRenderBuffer): void {
            if (buffer) {
                if (this._bindingRenderBuffer === buffer.internalBuffer) {
                    this._bindingRenderBuffer = null;
                    this._gl.bindRenderbuffer(GLRenderBufferType.RENDERBUFFER, null);
                }
            } else {
                if (this._bindingRenderBuffer) {
                    this._bindingRenderBuffer = null;
                    this._gl.bindRenderbuffer(GLRenderBufferType.RENDERBUFFER, null);
                }
            }
        }

        public activeVertexAttrib(buffer: GLVertexBuffer, index: uint, size: GLVertexBufferSize, type: GLVertexBufferDataType, normalized: boolean, stride: number, offset: number): void {
            if (index < this._maxVertexAttributes) {
                let info = this._usedVertexAttribs[index];

                if (info.bufferID !== buffer.id || info.uploadCount !== buffer.uploadCount || info.size !== size || info.type !== type || info.normalized !== normalized || info.stride !== stride || info.offset !== offset) {
                    info.bufferID = buffer.id;
                    info.uploadCount = buffer.uploadCount;
                    info.size = size;
                    info.type = type;
                    info.normalized = normalized;
                    info.stride = stride;
                    info.offset = offset;

                    this._gl.enableVertexAttribArray(index);
                    buffer.bind();
                    this._gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
                }
            }
        }

        public deactiveVertexAttrib(index: uint): void {
            if (index < this._maxVertexAttributes) {
                let info = this._usedVertexAttribs[index];
                if (info.bufferID !== 0) {
                    info.bufferID = 0;

                    this._gl.disableVertexAttribArray(index);
                }
            }
        }

        public activeTexture(tex: AbstractGLTexture, index: uint): boolean {
            if (index < this._maxTexutreImageUnits) {

                let idx = GL.TEXTURE0 + index;
                if (this._activingTextureIndex !== idx) {
                    this._activingTextureIndex = idx;
                    this._gl.activeTexture(idx);
                }
                tex.bind(true);

                return true;
            }

            return false;
        }

        public activeNullTexture(type: GLTexType, index: uint): boolean {
            if (index < this._maxTexutreImageUnits) {
                let idx = GL.TEXTURE0 + index;
                if (this._activingTextureIndex !== idx) {
                    this._activingTextureIndex = idx;
                    this._gl.activeTexture(idx);
                }

                switch (type) {
                    case GLTexType.TEXTURE_2D:
                        if (this._bindingTexture2D) this._bindingTexture2D = null;
                        break;
                    case GLTexType.TEXTURE_CUBE_MAP:
                        if (this._bindingTextureCube) this._bindingTextureCube = null;
                        break;
                    default:
                        break;
                }

                this._gl.bindTexture(type, null);

                return true;
            }

            return false;
        }

        public printConstant(msg: string, value: number): void {
            console.log(msg + value + "(" + value.toString(16).toUpperCase() + ")");
        }
    }

    export enum GLDrawMode {
        POINTS = GL.POINTS,
        LINES = GL.LINES,
        LINE_LOOP = GL.LINE_LOOP,
        LINE_STRIP = GL.LINE_STRIP,
        TRIANGLES = GL.TRIANGLES,
        TRIANGLE_STRIP = GL.TRIANGLE_STRIP,
        TRIANGLE_FAN = GL.TRIANGLE_FAN
    }

    export const enum GLVertexBufferSize {
        ONE = 1,
        TWO = 2,
        THREE = 3,
        FOUR = 4
    }

    export enum GLVertexBufferDataType {
        BYTE = GL.BYTE,
        UNSIGNED_BYTE = GL.UNSIGNED_BYTE,
        SHORT = GL.SHORT,
        UNSIGNED_SHORT = GL.UNSIGNED_SHORT,
        INT = GL.INT,
        UNSIGNED_INT = GL.UNSIGNED_INT,
        FLOAT = GL.FLOAT
    }

    export enum GLIndexDataType {
        AUTO = 0,
        UNSIGNED_BYTE = GL.UNSIGNED_BYTE,
        UNSIGNED_SHORT = GL.UNSIGNED_SHORT,
        UNSIGNED_INT = GL.UNSIGNED_INT
    }

    export enum GLUsageType {
        STREAM_DRAW = GL.STREAM_DRAW,
        STATIC_DRAW = GL.STATIC_DRAW,
        DYNAMIC_DRAW = GL.DYNAMIC_DRAW
    }

    export enum GLShaderType {
        VERTEX_SHADER = GL.VERTEX_SHADER,
        FRAGMENT_SHADER = GL.FRAGMENT_SHADER
    }

    export enum GLAttributeType {
        FLOAT = GL.FLOAT,
        FLOAT_VEC2 = GL.FLOAT_VEC2,
        FLOAT_VEC3 = GL.FLOAT_VEC3,
        FLOAT_VEC4 = GL.FLOAT_VEC4,
        INT_VEC2 = GL.INT_VEC2,
        INT_VEC3 = GL.INT_VEC3,
        INT_VEC4 = GL.INT_VEC4
    }

    export enum GLUniformType {
        FLOAT = GL.FLOAT,
        FLOAT_VEC2 = GL.FLOAT_VEC2,
        FLOAT_VEC3 = GL.FLOAT_VEC3,
        FLOAT_VEC4 = GL.FLOAT_VEC4,
        INT = GL.INT,
        INT_VEC2 = GL.INT_VEC2,
        INT_VEC3 = GL.INT_VEC3,
        INT_VEC4 = GL.INT_VEC4,
        BOOL = GL.BOOL,
        BOOL_VEC2 = GL.BOOL_VEC2,
        BOOL_VEC3 = GL.BOOL_VEC3,
        BOOL_VEC4 = GL.BOOL_VEC4,
        FLOAT_MAT2 = GL.FLOAT_MAT2,
        FLOAT_MAT3 = GL.FLOAT_MAT3,
        FLOAT_MAT4 = GL.FLOAT_MAT4,
        SAMPLER_2D = GL.SAMPLER_2D,
        SAMPLER_CUBE = GL.SAMPLER_CUBE
    }

    export enum GLBlendEquationType {
        FUNC_ADD = GL.FUNC_ADD,
        FUNC_SUBTRACT = GL.FUNC_SUBTRACT,
        FUNC_REVERSE_SUBTRACT = GL.FUNC_REVERSE_SUBTRACT,

        /** **WebGL Version:** EXT_blend_minmax or WebGL 2.0. */
        MIN = GL.MIN,
        /** **WebGL Version:** EXT_blend_minmax or WebGL 2.0. */
        MAX = GL.MAX
    }

    export enum GLBlendFactorValue {
        ZERO = GL.ZERO,
        ONE = GL.ONE,
        SRC_COLOR = GL.SRC_COLOR,
        ONE_MINUS_SRC_COLOR = GL.ONE_MINUS_SRC_COLOR,
        DST_COLOR = DST_COLOR,
        ONE_MINUS_DST_COLOR = ONE_MINUS_DST_COLOR,
        SRC_ALPHA = GL.SRC_ALPHA,
        ONE_MINUS_SRC_ALPHA = GL.ONE_MINUS_SRC_ALPHA,
        DST_ALPHA = GL.DST_ALPHA,
        ONE_MINUS_DST_ALPHA = GL.ONE_MINUS_DST_ALPHA,
        CONSTANT_COLOR = GL.CONSTANT_COLOR,
        ONE_MINUS_CONSTANT_COLOR = GL.ONE_MINUS_CONSTANT_COLOR,
        CONSTANT_ALPHA = GL.CONSTANT_ALPHA,
        ONE_MINUS_CONSTANT_ALPHA = GL.ONE_MINUS_CONSTANT_ALPHA,
        SRC_ALPHA_SATURATE = SRC_ALPHA_SATURATE
    }

    export enum GLBufferType {
        ARRAY_BUFFER = GL.ARRAY_BUFFER,
        ELEMENT_ARRAY_BUFFER = GL.ELEMENT_ARRAY_BUFFER
    }

    export enum GLTexType {
        TEXTURE_2D = GL.TEXTURE_2D,
        TEXTURE_CUBE_MAP = GL.TEXTURE_CUBE_MAP,

        /** **WebGL Version:** WebGL 2.0. */
        TEXTURE_3D = GL.TEXTURE_3D,

        /** **WebGL Version:** WebGL 2.0. */
        TEXTURE_2D_ARRAY = GL.TEXTURE_2D_ARRAY
    }

    export enum GLFrameBufferType {
        FRAMEBUFFER = GL.FRAMEBUFFER
    }

    export enum GLRenderBufferType {
        RENDERBUFFER = GL.RENDERBUFFER
    }

    export enum GLTexFilterType {
        TEXTURE_MAG_FILTER = GL.TEXTURE_MAG_FILTER,
        TEXTURE_MIN_FILTER = GL.TEXTURE_MIN_FILTER
    }

    export enum GLTexFilterValue {
        NEAREST = GL.NEAREST,
        /** mag default value. */
        LINEAR = GL.LINEAR,
        NEAREST_MIPMAP_NEAREST = GL.NEAREST_MIPMAP_NEAREST,
        LINEAR_MIPMAP_NEAREST = GL.LINEAR_MIPMAP_NEAREST,
        /** min default value. */
        NEAREST_MIPMAP_LINEAR = GL.NEAREST_MIPMAP_LINEAR,
        LINEAR_MIPMAP_LINEAR = GL.LINEAR_MIPMAP_LINEAR
    }

    export enum GLTexWrapType {
        TEXTURE_WRAP_S = GL.TEXTURE_WRAP_S,
        TEXTURE_WRAP_T = GL.TEXTURE_WRAP_T
    }

    export enum GLTexWrapValue {
        /** default value. */
        REPEAT = GL.REPEAT,
        CLAMP_TO_EDGE = GL.CLAMP_TO_EDGE,
        MIRRORED_REPEAT = GL.MIRRORED_REPEAT
    }

    export enum GLTexCubeFace {
        TEXTURE_CUBE_MAP_POSITIVE_X = GL.TEXTURE_CUBE_MAP_POSITIVE_X,
        TEXTURE_CUBE_MAP_NEGATIVE_X = GL.TEXTURE_CUBE_MAP_NEGATIVE_X,
        TEXTURE_CUBE_MAP_POSITIVE_Y = GL.TEXTURE_CUBE_MAP_POSITIVE_Y,
        TEXTURE_CUBE_MAP_NEGATIVE_Y = GL.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        TEXTURE_CUBE_MAP_POSITIVE_Z = GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
        TEXTURE_CUBE_MAP_NEGATIVE_Z = GL.TEXTURE_CUBE_MAP_NEGATIVE_Z
    }

    export enum GLTexInternalFormat {
        /**
         ** **Format:** ALPHA
         ** **Type:** UNSIGNED_BYTE
         *
         * Discards the red, green and blue components and reads the alpha component.
         */
        ALPHA = GL.ALPHA,

        /**
         ** **Format:** RGB
         ** **Type:** UNSIGNED_BYTE, UNSIGNED_SHORT_5_6_5
         *
         * Discards the alpha components and reads the red, green and blue components.
         */
        RGB = GL.RGB,

        /**
         ** **Format:** RGBA
         ** **Type:** UNSIGNED_BYTE, UNSIGNED_SHORT_4_4_4_4, UNSIGNED_SHORT_5_5_5_1
         * 
         * Red, green, blue and alpha components are read from the color buffer.
         */
        RGBA = GL.RGBA,

        /**
         ** **Format:** LUMINANCE
         ** **Type:** UNSIGNED_BYTE
         *
         * Each color component is a luminance component, alpha is 1.0.
         */
        LUMINANCE = GL.LUMINANCE,

        /**
         ** **Format:** LUMINANCE_ALPHA
         ** **Type:** UNSIGNED_BYTE
         *
         * Each component is a luminance/alpha component.
         */
        LUMINANCE_ALPHA = GL.LUMINANCE_ALPHA,

        /** **WebGL Version:** WEBGL_depth_texture extension. */
        DEPTH_COMPONENT = GL.DEPTH_COMPONENT,
        /** **WebGL Version:** WEBGL_depth_texture extension. */
        DEPTH_STENCIL = GL.DEPTH_STENCIL,

        /** **WebGL Version:** EXT_sRGB extension. */
        SRGB_EXT = GL.SRGB_EXT,
        /** **WebGL Version:** EXT_sRGB extension. */
        SRGB_ALPHA_EXT = GL.SRGB_ALPHA_EXT,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RED
         ** **Type:** UNSIGNED_BYTE
         */
        R8 = GL.R8,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         * Format: RED
         * Type: HALF_FLOAT, FLOAT
         */
        R16F = GL.R16F,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         * Format: RED
         * Type: FLOAT
         */
        R32F = GL.R32F,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         * Format: RED_INTEGER
         * Type: UNSIGNED_BYTE
         */
        R8UI = GL.R8UI,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RG
         ** **Type:** UNSIGNED_BYTE
         */
        RG8 = GL.RG8,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RG
         ** **Type:** HALF_FLOAT, FLOAT
         */
        RG16F = GL.RG16F,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RG
         ** **Type:** FLOAT
         */
        RG32F = GL.RG32F,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RG_INTEGER
         ** **Type:** UNSIGNED_BYTE
         */
        RG8UI = GL.RG8UI,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         */
        RG16UI = GL.RG16UI,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         */
        RG32UI = GL.RG32UI,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGB
         ** **Type:** UNSIGNED_BYTE
         */
        RGB8 = GL.RGB8,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGB
         ** **Type:** UNSIGNED_BYTE
         */
        SRGB8 = GL.SRGB8,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGB
         ** **Type:** UNSIGNED_BYTE, UNSIGNED_SHORT_5_6_5
         */
        RGB565 = GL.RGB565,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGB
         ** **Type:** UNSIGNED_INT_10F_11F_11F_REV, HALF_FLOAT, FLOAT
         */
        R11F_G11F_B10F = GL.R11F_G11F_B10F,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGB
         ** **Type:** HALF_FLOAT, FLOAT
         */
        RGB9_E5 = GL.RGB9_E5,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGB
         ** **Type:** HALF_FLOAT, FLOAT
         */
        RGB16F = GL.RGB16F,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGB
         ** **Type:** FLOAT
         */
        RGB32F = GL.RGB32F,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGB_INTEGER
         ** **Type:** UNSIGNED_BYTE
         */
        RGB8UI = GL.RGB8UI,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGBA
         ** **Type:** UNSIGNED_BYTE
         */
        RGBA8 = GL.RGBA8,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGBA
         ** **Type:** UNSIGNED_BYTE
         */
        SRGB8_ALPHA8 = GL.SRGB8_ALPHA8,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGBA
         ** **Type:** UNSIGNED_BYTE, UNSIGNED_SHORT_5_5_5_1
         */
        RGB5_A1 = GL.RGB5_A1,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGBA
         ** **Type:** UNSIGNED_INT_2_10_10_10_REV
         */
        RGB10_A2 = GL.RGB10_A2,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGBA
         ** **Type:** UNSIGNED_BYTE, UNSIGNED_SHORT_4_4_4_4
         */
        RGBA4 = GL.RGBA4,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGBA
         ** **Type:** HALF_FLOAT, FLOAT
         */
        RGBA16F = GL.RGBA16F,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGBA
         ** **Type:** FLOAT
         */
        RGBA32F = GL.RGBA32F,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         ** **Format:** RGBA_INTEGER
         ** **Type:** UNSIGNED_BYTE
         */
        RGBA8UI = GL.RGBA8UI
    }

    export enum GLTexFormat {
        RGB = GL.RGB,
        RGBA = GL.RGBA,
        LUMINANCE_ALPHA = GL.LUMINANCE_ALPHA,
        LUMINANCE = GL.LUMINANCE,
        ALPHA = GL.ALPHA,
        RED = GL.RED,
        RED_INTEGER = GL.RED_INTEGER,
        RG = GL.RG,
        RG_INTEGER = GL.RG_INTEGER,
        RGB_INTEGER = GL.RGB_INTEGER,
        RGBA_INTEGER = GL.RGBA_INTEGER
    }

    export enum GLTexDataType {
        UNSIGNED_BYTE = GL.UNSIGNED_BYTE,
        UNSIGNED_SHORT_5_6_5 = GL.UNSIGNED_SHORT_5_6_5,
        UNSIGNED_SHORT_4_4_4_4 = GL.UNSIGNED_SHORT_4_4_4_4,
        UNSIGNED_SHORT_5_5_5_1 = GL.UNSIGNED_SHORT_5_5_5_1,

        /** **WebGL Version:** WEBGL_depth_texture extension or WebGL 2.0. */
        UNSIGNED_SHORT = GL.UNSIGNED_SHORT,
        /** **WebGL Version:** WEBGL_depth_texture extension or WebGL 2.0. */
        UNSIGNED_INT = GL.UNSIGNED_INT,
        /** 
         * **WebGL Version:** WEBGL_depth_texture extension.
         * 
         * ---
         * constant provided by the extension.
         */
        UNSIGNED_INT_24_8_WEBGL = GL.UNSIGNED_INT_24_8_WEBGL,

        /** **WebGL Version:** WOES_texture_float extension or WebGL 2.0. */
        FLOAT = GL.FLOAT,

        /** 
         * **WebGL Version:** OES_texture_half_float extension.
         * 
         * ---
         * constant provided by the extension.
         */
        HALF_FLOAT_OES = GL.HALF_FLOAT_OES,

        /** **WebGL Version:** 2.0 */
        BYTE = GL.BYTE,
        // UNSIGNED_SHORT = GL.UNSIGNED_SHORT, //already define.
        /** **WebGL Version:** 2.0 */
        SHORT = GL.SHORT,
        // UNSIGNED_INT = GL.UNSIGNED_INT, //already define.    
        /** **WebGL Version:** 2.0 */
        INT = GL.INT,
        /** **WebGL Version:** 2.0 */
        HALF_FLOAT = GL.HALF_FLOAT,
        // FLOAT = GL.FLOAT, //already define.  
        /** **WebGL Version:** 2.0 */
        UNSIGNED_INT_2_10_10_10_REV = GL.UNSIGNED_INT_2_10_10_10_REV,
        /** **WebGL Version:** 2.0 */
        UNSIGNED_INT_10F_11F_11F_REV = GL.UNSIGNED_INT_10F_11F_11F_REV,
        /** **WebGL Version:** 2.0 */
        UNSIGNED_INT_5_9_9_9_REV = GL.UNSIGNED_INT_5_9_9_9_REV,
        /** **WebGL Version:** 2.0 */
        UNSIGNED_INT_24_8 = GL.UNSIGNED_INT_24_8,
        /** 
         * **WebGL Version:** WebGL 2.0
         * 
         * ---
         * pixels must be null. 
         */
        FLOAT_32_UNSIGNED_INT_24_8_REV = GL.FLOAT_32_UNSIGNED_INT_24_8_REV
    }

    export enum GLFrontFace {
        CW = GL.CW,
        CCW = GL.CCW
    }

    export enum GLCullFace {
        NONE = GL.NONE,
        FRONT = GL.FRONT,
        BACK = GL.BACK,
        FRONT_AND_BACK = GL.FRONT_AND_BACK
    }

    export enum GLDepthTest {
        NONE = GL.NONE,
        NEVER = GL.NEVER,
        LESS = GL.LESS,
        EQUAL = GL.EQUAL,
        LEQUAL = GL.LEQUAL,
        GREATER = GL.GREATER,
        NOTEQUAL = GL.NOTEQUAL,
        GEQUAL = GL.GEQUAL,
        ALWAYS = GL.ALWAYS
    }

    export enum GLStencilFace {
        FRONT = GL.FRONT,
        BACK = GL.BACK,
        FRONT_AND_BACK = GL.FRONT_AND_BACK
    }

    export enum GLStencilFunc {
        /**Always fails. */
        NEVER = GL.NEVER,
        /** Passes if ( ref & funcMask ) < ( stencil & funcMask ). */
        LESS = GL.LESS,
        /** Passes if ( ref & funcMask ) <= ( stencil & funcMask ). */
        LEQUAL = GL.LEQUAL,
        /** Passes if ( ref & funcMask ) > ( stencil & funcMask ). */
        GREATER = GL.GREATER,
        /** Passes if ( ref & funcMask ) >= ( stencil & funcMask ). */
        GEQUAL = GL.GEQUAL,
        /** Passes if ( ref & funcMask ) = ( stencil & funcMask ). */
        EQUAL = GL.EQUAL,
        /** Passes if ( ref & funcMask ) != ( stencil & funcMask ). */
        NOTEQUAL = GL.NOTEQUAL,
        /** Always passes. default value */
        ALWAYS = GL.ALWAYS
    }

    export enum GLStencilOpType {
        /** Keeps the current value. default value */
        KEEP = GL.KEEP,
        /** Sets the stencil buffer value to 0. */
        ZERO = GL.ZERO,
        /** Sets the stencil buffer value to ref. */
        REPLACE = GL.REPLACE,
        /** Increments the current stencil buffer value. Clamps to the maximum representable unsigned value. */
        INCR = GL.INCR,
        /** Increments the current stencil buffer value. Wraps stencil buffer value to zero when incrementing the maximum representable unsigned value. */
        INCR_WRAP = GL.INCR_WRAP,
        /** Decrements the current stencil buffer value. Clamps to 0. */
        DECR = GL.DECR,
        /** Decrements the current stencil buffer value. Wraps stencil buffer value to the maximum representable unsigned value when decrementing a stencil buffer value of zero. */
        DECR_WRAP = GL.DECR_WRAP,
        /** Bitwise inverts the current stencil buffer value. */
        INVERT = GL.INVERT
    }

    export enum GLFrameBufferTarget {
        FRAMEBUFFER = GL.FRAMEBUFFER,

        /**
         * **WebGL Version:** WebGL 2.0.
         * 
         * ---
         * Equivalent to FRAMEBUFFER. Used as a destination for drawing, rendering, clearing, and writing operations.
         */
        DRAW_FRAMEBUFFER = GL.DRAW_FRAMEBUFFER,

        /** **WebGL Version:** WebGL 2.0. */
        READ_FRAMEBUFFER = GL.READ_FRAMEBUFFER,
    }

    export enum GLRenderBufferInternalFormat {
        RGBA4 = GL.RGBA4,
        RGB565 = GL.RGB565,
        RGB5_A1 = GL.RGB5_A1,
        DEPTH_COMPONENT16 = GL.DEPTH_COMPONENT16,
        STENCIL_INDEX8 = GL.STENCIL_INDEX8,
        DEPTH_STENCIL = GL.DEPTH_STENCIL,

        /**
         * **WebGL Version:** WEBGL_color_buffer_float extension
         * 
         * ---
         * RGBA 32-bit floating-point type.
         */
        RGBA32F_EXT = GL.RGBA32F_EXT,

        /**
         * **WebGL Version:** WEBGL_color_buffer_float extension
         * 
         * ---
         * RGB 32-bit floating-point type.
         */
        RGB32F_EXT = GL.RGB32F_EXT,

        /**
         * **WebGL Version:** EXT_sRGB extension or WebGL 2.0.
         * 
         * ---
         * 8-bit sRGB and alpha.
         */
        SRGB8_ALPHA8_EXT = GL.SRGB8_ALPHA8_EXT,

        /** **WebGL Version:** EXT_color_buffer_float extension or WebGL 2.0. */
        R16F = GL.R16F,

        /** **WebGL Version:** EXT_color_buffer_float extension or WebGL 2.0. */
        RG16F = GL.RG16F,

        /** **WebGL Version:** EXT_color_buffer_float extension or WebGL 2.0. */
        RGBA16F = GL.RGBA16F,

        /** **WebGL Version:** EXT_color_buffer_float extension or WebGL 2.0. */
        R32F = GL.R32F,

        /** **WebGL Version:** EXT_color_buffer_float extension or WebGL 2.0. */
        RG32F = GL.RG32F,

        /** **WebGL Version:** EXT_color_buffer_float extension or WebGL 2.0. */
        RGBA32F = GL.RGBA32F,

        /** **WebGL Version:** EXT_color_buffer_float extension or WebGL 2.0. */
        R11F_G11F_B10F = GL.R11F_G11F_B10F,

        /** **WebGL Version:** WebGL 2.0. */
        R8 = GL.R8,

        /** **WebGL Version:** WebGL 2.0. */
        R8UI = GL.R8UI,

        /** **WebGL Version:** WebGL 2.0. */
        R8I = GL.R8I,

        /** **WebGL Version:** WebGL 2.0. */
        R16UI = GL.R16UI,

        /** **WebGL Version:** WebGL 2.0. */
        R16I = GL.R16I,

        /** **WebGL Version:** WebGL 2.0. */
        R32UI = GL.R32UI,

        /** **WebGL Version:** WebGL 2.0. */
        R32I = GL.R32I,

        /** **WebGL Version:** WebGL 2.0. */
        RG8 = GL.RG8,

        /** **WebGL Version:** WebGL 2.0. */
        RG8UI = GL.RG8UI,

        /** **WebGL Version:** WebGL 2.0. */
        RG8I = GL.RG8I,

        /** **WebGL Version:** WebGL 2.0. */
        RG16UI = GL.RG16UI,

        /** **WebGL Version:** WebGL 2.0. */
        RG16I = GL.RG16I,

        /** **WebGL Version:** WebGL 2.0. */
        RG32UI = GL.RG32UI,

        /** **WebGL Version:** WebGL 2.0. */
        RG32I = GL.RG32I,

        /** **WebGL Version:** WebGL 2.0. */
        RGB8 = GL.RGB8,

        /** **WebGL Version:** WebGL 2.0. */
        RGBA8 = GL.RGBA8,

        /** **WebGL Version:** WebGL 2.0. */
        RGB10_A2 = GL.RGB10_A2,

        /** **WebGL Version:** WebGL 2.0. */
        RGBA8UI = GL.RGBA8UI,

        /** **WebGL Version:** WebGL 2.0. */
        RGBA8I = GL.RGBA8I,

        /** **WebGL Version:** WebGL 2.0. */
        RGB10_A2UI = GL.RGB10_A2UI,

        /** **WebGL Version:** WebGL 2.0. */
        RGBA16UI = GL.RGBA16UI,

        /** **WebGL Version:** WebGL 2.0. */
        RGBA16I = GL.RGBA16I,

        /** **WebGL Version:** WebGL 2.0. */
        RGBA32I = GL.RGBA32I,

        /** **WebGL Version:** WebGL 2.0. */
        RGBA32UI = GL.RGBA32UI,

        /** **WebGL Version:** WebGL 2.0. */
        DEPTH_COMPONENT24 = GL.DEPTH_COMPONENT24,

        /** **WebGL Version:** WebGL 2.0. */
        DEPTH_COMPONENT32F = GL.DEPTH_COMPONENT32F,

        /** **WebGL Version:** WebGL 2.0. */
        DEPTH24_STENCIL8 = GL.DEPTH24_STENCIL8,

        /** **WebGL Version:** WebGL 2.0. */
        DEPTH32F_STENCIL8 = GL.DEPTH32F_STENCIL8
    }

    export enum GLRenderBufferAttachment {
        COLOR_ATTACHMENT0 = GL.COLOR_ATTACHMENT0,
        DEPTH_ATTACHMENT = GL.DEPTH_ATTACHMENT,
        DEPTH_STENCIL_ATTACHMENT = GL.DEPTH_STENCIL_ATTACHMENT,
        STENCIL_ATTACHMENT = GL.STENCIL_ATTACHMENT,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT1 = GL.COLOR_ATTACHMENT1,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT2 = GL.COLOR_ATTACHMENT2,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT3 = GL.COLOR_ATTACHMENT3,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT4 = GL.COLOR_ATTACHMENT4,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT5 = GL.COLOR_ATTACHMENT5,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT6 = GL.COLOR_ATTACHMENT6,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT7 = GL.COLOR_ATTACHMENT7,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT8 = GL.COLOR_ATTACHMENT8,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT9 = GL.COLOR_ATTACHMENT9,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT10 = GL.COLOR_ATTACHMENT10,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT11 = GL.COLOR_ATTACHMENT11,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT12 = GL.COLOR_ATTACHMENT12,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT13 = GL.COLOR_ATTACHMENT13,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT14 = GL.COLOR_ATTACHMENT14,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT15 = GL.COLOR_ATTACHMENT15
    }

    export enum GLTex2DAttachment {
        COLOR_ATTACHMENT0 = GL.COLOR_ATTACHMENT0,
        DEPTH_ATTACHMENT = GL.DEPTH_ATTACHMENT,
        STENCIL_ATTACHMENT = GL.STENCIL_ATTACHMENT,

        /** **WebGL Version:** WEBGL_depth_texture extension or WebGL 2.0. */
        DEPTH_STENCIL_ATTACHMENT = GL.DEPTH_STENCIL_ATTACHMENT,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT1 = GL.COLOR_ATTACHMENT1,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT2 = GL.COLOR_ATTACHMENT2,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT3 = GL.COLOR_ATTACHMENT3,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT4 = GL.COLOR_ATTACHMENT4,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT5 = GL.COLOR_ATTACHMENT5,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT6 = GL.COLOR_ATTACHMENT6,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT7 = GL.COLOR_ATTACHMENT7,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT8 = GL.COLOR_ATTACHMENT8,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT9 = GL.COLOR_ATTACHMENT9,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT10 = GL.COLOR_ATTACHMENT10,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT11 = GL.COLOR_ATTACHMENT11,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT12 = GL.COLOR_ATTACHMENT12,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT13 = GL.COLOR_ATTACHMENT13,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT14 = GL.COLOR_ATTACHMENT14,

        /** **WebGL Version:** WEBGL_draw_buffers extension or WebGL 2.0. */
        COLOR_ATTACHMENT15 = GL.COLOR_ATTACHMENT15
    }

    export enum GLFrameBufferTexTarget {
        /** A 2D image. */
        TEXTURE_2D = GL.TEXTURE_2D,
        /** Image for the positive X face of the cube. */
        TEXTURE_CUBE_MAP_POSITIVE_X = GL.TEXTURE_CUBE_MAP_POSITIVE_X,
        /** Image for the negative X face of the cube. */
        TEXTURE_CUBE_MAP_NEGATIVE_X = GL.TEXTURE_CUBE_MAP_NEGATIVE_X,
        /** Image for the positive Y face of the cube. */
        TEXTURE_CUBE_MAP_POSITIVE_Y = GL.TEXTURE_CUBE_MAP_POSITIVE_Y,
        /** Image for the negative Y face of the cube. */
        TEXTURE_CUBE_MAP_NEGATIVE_Y = GL.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        /** Image for the positive Z face of the cube. */
        TEXTURE_CUBE_MAP_POSITIVE_Z = GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
        /** Image for the negative Z face of the cube. */
        TEXTURE_CUBE_MAP_NEGATIVE_Z = GL.TEXTURE_CUBE_MAP_NEGATIVE_Z
    }
}