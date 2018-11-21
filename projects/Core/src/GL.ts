///<reference path="Types.ts"/>
///<reference path="Ref.ts"/>
///<reference path="math/Color.ts"/>
///<reference path="math/Rect.ts"/>

//WebGL 2.0
interface WebGLRenderingContext {
    /** **WebGL Version:** 2.0 */
    drawBuffers(buffers: number[]): void;

    //bufferSubData(target: GLenum, offset: GLintptr, data: BufferSource): void;

    ///** **WebGL Version:** 2.0 */
    //bufferSubData(target: GLenum, dstByteOffset: GLuint, srcData: ArrayBufferView, srcOffset: GLuint, length: GLuint): void;

    /** **WebGL Version:** 2.0 */
    renderbufferStorageMultisample(target: number, samples: number, internalformat: number, width: number, height: number): void;

    texImage2D(target: GLenum, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, pixels: ArrayBufferView | null): void;
    texImage2D(target: GLenum, level: number, internalformat: number, format: number, type: number, pixels: Aurora.GLImage): void;

    /** **WebGL Version:** 2.0 */
    texImage2D(target: GLenum, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, offset: GLintptr): void;

    /** **WebGL Version:** 2.0 */
    texImage2D(target: GLenum, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, source: Aurora.GLImage): void;

    /** **WebGL Version:** 2.0 */
    texImage2D(target: GLenum, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, srcData: ArrayBufferView | null, srcOffset: number): void;

    texSubImage2D(target: GLenum, level: number, xoffset: number, yoffset: number, width: number, height: number, format: number, type: number, pixels: ArrayBufferView | null): void;
    texSubImage2D(target: GLenum, level: number, xoffset: number, yoffset: number, format: number, type: number, pixels: Aurora.GLImage): void;

    /** **WebGL Version:** 2.0 */
    texSubImage2D(target: GLenum, level: number, xoffset: number, yoffset: number, format: number, type: number, offset: GLintptr): void;

    /** **WebGL Version:** 2.0 */
    texSubImage2D(target: GLenum, level: number, xoffset: number, yoffset: number, width: number, height: number, format: number, type: number, source: Aurora.GLImage): void;

    /** **WebGL Version:** 2.0 */
    texSubImage2D(target: GLenum, level: number, xoffset: number, yoffset: number, width: number, height: number, format: number, type: number, srcData: ArrayBufferView | null, srcOffset: number): void;
}

namespace Aurora {
    export class GLClear {
        public readonly color = Color4.BLACK;
        public depth = 1.0;
        public stencil = 0;

        private _clearColor = true;
        private _clearDepth = true;
        private _clearStencil = true;
        private _clearMask: uint;

        constructor() {
            this._clearMask = GLEnum.COLOR_BUFFER_BIT | GLEnum.DEPTH_BUFFER_BIT | GLEnum.STENCIL_BUFFER_BIT;
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
                    this._clearMask |= GLEnum.COLOR_BUFFER_BIT;
                } else {
                    this._clearMask &= ~GLEnum.COLOR_BUFFER_BIT;
                }
            }
        }

        public set clearDepth(b: boolean) {
            if (this._clearDepth !== b) {
                this._clearDepth = b;

                if (b) {
                    this._clearMask |= GLEnum.DEPTH_BUFFER_BIT;
                } else {
                    this._clearMask &= ~GLEnum.DEPTH_BUFFER_BIT;
                }
            }
        }

        public set clearStencil(b: boolean) {
            if (this._clearStencil !== b) {
                this._clearStencil = b;

                if (b) {
                    this._clearMask |= GLEnum.STENCIL_BUFFER_BIT;
                } else {
                    this._clearMask &= ~GLEnum.STENCIL_BUFFER_BIT;
                }
            }
        }
    }

    export abstract class AbstractGLObject extends Ref {
        protected _gl: GL;

        constructor(gl: GL) {
            super();

            this._gl = gl;
        }

        public get gl(): GL {
            return this._gl;
        }

        public abstract destroy(): void;

        protected _refDestroy() {
            this.destroy();
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

        

        /**
         * @param dstOffset unit is element
         * @param srcOffset unit is element
         * @param length unit is element
         */
        protected _uploadSub(data: GLVertexBufferData | GLIndexBufferData, dataType: GLenum ,dstOffset: uint = 0, srcOffset: uint = 0, length: int = -1): boolean {
            if (this._buffer && dstOffset < this._numElements && length !== 0) {
                const gl = this._gl.context;

                this.bind();

                const byteOffset = dstOffset * this._sizePerElement;

                if (data instanceof Array) {
                    const dataLen = data.length;
                    if (srcOffset >= dataLen) return false;
                    if (length < 0) {
                        length = srcOffset > 0 ? dataLen - srcOffset : dataLen;
                    } else if (srcOffset + length > dataLen) {
                        length = dataLen - srcOffset;
                    }
                    if (dstOffset + length > this._numElements) length = this._numElements - dstOffset;
                    if (srcOffset > 0 || srcOffset + length < dataLen) data = data.slice(srcOffset, srcOffset + length);

                    let src: ArrayBufferView;
                    switch (dataType) {
                        case GLEnum.BYTE:
                            src = new Int8Array(data);
                            break;
                        case GLEnum.UNSIGNED_BYTE:
                            src = new Uint8Array(data);
                            break;
                        case GLEnum.SHORT:
                            src = new Int16Array(data);
                            break;
                        case GLEnum.UNSIGNED_SHORT:
                            src = new Uint16Array(data);
                            break;
                        case GLEnum.INT:
                            src = new Uint32Array(data);
                            break;
                        case GLEnum.UNSIGNED_INT:
                            src = new Uint32Array(data);
                            break;
                        case GLEnum.FLOAT:
                            src = new Float32Array(data);
                            break;
                        default:
                            break;
                    }

                    gl.bufferSubData(this._bufferType, byteOffset, src);
                } else {
                    const dataLen = data.byteLength;
                    srcOffset *= this._sizePerElement;
                    if (srcOffset >= dataLen) return false;
                    if (length < 0) {
                        length = srcOffset > 0 ? dataLen - srcOffset : dataLen;
                    } else {
                        length *= this._sizePerElement;
                        if (srcOffset + length > dataLen) length = dataLen - srcOffset;
                    }
                    if (this._sizePerElement === 2) {
                        if (!(length & 0b1)) --length;
                    } else if (this._sizePerElement === 4) {
                        const r = length & 0b11;
                        if (!r) length -= r;
                    }
                    dstOffset *= this._sizePerElement;
                    if (dstOffset + length > this._memSize) length = this._memSize - dstOffset;

                    if (data instanceof ArrayBuffer) {
                        if (srcOffset > 0 || srcOffset + length < dataLen) {
                            gl.bufferSubData(this._bufferType, byteOffset, new DataView(data, srcOffset, length));
                        } else {
                            gl.bufferSubData(this._bufferType, byteOffset, data);
                        }
                    } else {
                        if (srcOffset > 0 || srcOffset + length < dataLen) {
                            gl.bufferSubData(this._bufferType, byteOffset, new DataView(data.buffer, data.byteOffset + srcOffset, length));
                        } else {
                            gl.bufferSubData(this._bufferType, byteOffset, data);
                        }
                    }
                }

                return true;
            }

            return false;
        }
    }

    export class GLVertexBuffer extends AbstractGLBuffer {
        private static _idGenerator = 0;

        private _id: number;
        private _uploadCount: number = 0;

        private _size = GLVertexBufferSize.FOUR;
        private _dataType = GLVertexBufferDataType.FLOAT;
        private _normalized = false;

        constructor(gl: GL) {
            super(gl, GLBufferType.ARRAY_BUFFER);

            this._id = ++GLVertexBuffer._idGenerator;
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

                this._sizePerElement = GL.calcMemSize(this._dataType);
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

                const gl = this._gl.context;

                this.bind();

                this._sizePerElement = GL.calcMemSize(this._dataType);
                this._memSize = numElements * this._sizePerElement;

                gl.bufferData(this._bufferType, this._memSize, usage);
            }
        }
        
        public upload(data: GLVertexBufferData, offset: uint = 0, length: int = -1, size: GLVertexBufferSize = GLVertexBufferSize.FOUR, type: GLVertexBufferDataType = GLVertexBufferDataType.FLOAT, normalized: boolean = false, usage: GLUsageType = GLUsageType.STATIC_DRAW): void {
            if (this._buffer) {
                ++this._uploadCount;
                this._size = size;
                this._dataType = type;
                this._normalized = normalized;
                this._usage = usage;

                const gl = this._gl.context;

                this.bind();

                if (data instanceof Array) {
                    const dataLen = data.length;
                    if (offset >= dataLen) {
                        if (dataLen > 0) data = [];
                        length = 0;
                    } else {
                        if (length < 0) {
                            length = offset > 0 ? dataLen - offset : dataLen;
                        } else if (offset + length > dataLen) {
                            length = dataLen - offset;
                        }
                        if (offset > 0 || offset + length < dataLen) data = data.slice(offset, offset + length);
                    }

                    let src: ArrayBufferView;
                    switch (type) {
                        case GLVertexBufferDataType.BYTE: {
                            this._sizePerElement = 1;
                            src = new Int8Array(data);

                            break;
                        }
                        case GLVertexBufferDataType.UNSIGNED_BYTE: {
                            this._sizePerElement = 1;
                            src = new Uint8Array(data);

                            break;
                        }
                        case GLVertexBufferDataType.SHORT: {
                            this._sizePerElement = 2;
                            src = new Int16Array(data);

                            break;
                        }
                        case GLVertexBufferDataType.UNSIGNED_SHORT: {
                            this._sizePerElement = 2;
                            src = new Uint16Array(data);

                            break;
                        }
                        case GLVertexBufferDataType.INT: {
                            this._sizePerElement = 4;
                            src = new Int32Array(data);

                            break;
                        }
                        case GLVertexBufferDataType.UNSIGNED_INT: {
                            this._sizePerElement = 4;
                            src = new Uint32Array(data);

                            break;
                        }
                        case GLVertexBufferDataType.FLOAT: {
                            this._sizePerElement = 4;
                            src = new Float32Array(data);

                            break;
                        }
                        default:
                            this._sizePerElement = 0;
                            break;
                    }

                    this._numElements = length;
                    const memSize = this._numElements * this._sizePerElement;

                    if (this._memSize === memSize) {
                        gl.bufferSubData(this._bufferType, 0, src);
                    } else {
                        this._memSize = memSize;
                        gl.bufferData(this._bufferType, src, usage);
                    }
                } else {
                    this._sizePerElement = GL.calcMemSize(this._dataType);

                    const dataLen = data.byteLength;
                    offset *= this._sizePerElement;
                    if (offset >= dataLen) {
                        offset = 0;
                        length = 0;
                    } else {
                        if (length < 0) {
                            length = offset > 0 ? dataLen - offset : dataLen;
                        } else {
                            length *= this._sizePerElement;
                            if (offset + length > dataLen) length = dataLen - offset;
                        }
                        if (this._sizePerElement === 2) {
                            if (!(length & 0b1))--length;
                        } else if (this._sizePerElement === 4) {
                            const r = length & 0b11;
                            if (!r) length -= r;
                        }
                    }

                    this._numElements = (length / this._sizePerElement) | 0;

                    if (length === data.byteLength) {
                        if (this._memSize === length) {
                            gl.bufferSubData(this._bufferType, 0, data);
                        } else {
                            this._memSize = length;
                            gl.bufferData(this._bufferType, data, usage);
                        }
                    } else {
                        let view = data instanceof ArrayBuffer ? new DataView(data, offset, length) : new DataView(data.buffer, data.byteOffset + offset, length);
                        if (this._memSize === length) {
                            gl.bufferSubData(this._bufferType, 0, view);
                        } else {
                            this._memSize = length;
                            gl.bufferData(this._bufferType, view, usage);
                        }
                    }
                }
            }
        }

        /**
         * @param dstOffset unit is element
         * @param srcOffset unit is element
         * @param length unit is element
         */
        public uploadSub(data: GLVertexBufferData, dstOffset: uint = 0, srcOffset: uint = 0, length: int = -1): void {
            if (this._uploadSub(data, this._dataType, dstOffset, srcOffset, length)) ++this._uploadCount;
        }

        public use(location: uint): void {
            this._gl.activeVertexAttrib(this, location, this._size, this._dataType, this._normalized, 0, 0);
        }
    }

    export class GLIndexBuffer extends AbstractGLBuffer {
        private _dataType = GLIndexDataType.UNSIGNED_SHORT;

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

                const gl = this._gl.context;

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

                gl.bufferData(this._bufferType, this._memSize, usage);
            }
        }

        public upload(data: GLIndexBufferData, offset: uint = 0, length: int = -1, type: GLIndexDataType = GLIndexDataType.AUTO, usage: GLUsageType = GLUsageType.STATIC_DRAW): void {
            if (this._buffer) {
                this._usage = usage;

                const gl = this._gl.context;

                this.bind();

                if (data instanceof Array) {
                    const dataLen = data.length;
                    if (offset >= dataLen) {
                        if (dataLen > 0) data = [];
                        length = 0;
                    } else {
                        if (length < 0) {
                            length = offset > 0 ? dataLen - offset : dataLen;
                        } else if (offset + length > dataLen) {
                            length = dataLen - offset;
                        }
                        if (offset > 0 || offset + length < dataLen) data = data.slice(offset, offset + length);
                    }
                    
                    let src: ArrayBufferView;

                    if (type == GLIndexDataType.AUTO) {
                        this._dataType = GLIndexDataType.UNSIGNED_BYTE;
                        let isUint8 = true;
                        for (let i = data.length - 1; i >= 0; --i) {
                            const v = data[i];
                            if (v > 0xFFFF) {
                                this._dataType = GLIndexDataType.UNSIGNED_INT;
                                break;
                            } else if (isUint8 && v > 0xFF) {
                                this._dataType = GLIndexDataType.UNSIGNED_SHORT;
                                isUint8 = false;
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
                            case GLIndexDataType.UNSIGNED_INT: {
                                if (this._gl.supprotUintIndexes) {
                                    src = new Uint32Array(data);
                                } else {
                                    this._dataType = GLIndexDataType.UNSIGNED_SHORT;
                                    src = new Uint16Array(data);
                                }

                                break;
                            }
                            default:
                                throw new Error("GLIndexBuffer upload error: invalid type");
                                break;
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
                            throw new Error("GLIndexBuffer upload error: invalid type");
                            break;
                    }

                    this._numElements = length;
                    const memSize = this._numElements * this._sizePerElement;

                    if (this._memSize === memSize) {
                        gl.bufferSubData(this._bufferType, 0, src);
                    } else {
                        this._memSize = memSize;
                        gl.bufferData(this._bufferType, src, usage);
                    }
                } else {
                    this._dataType = type;

                    const isArrBuf = data instanceof ArrayBuffer;
                    if (isArrBuf) {
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
                                throw new Error("GLIndexBuffer upload error: type cannot set AUTO");
                                break;
                        }
                    } else {
                        if (data instanceof Uint8Array) {
                            this._dataType = GLIndexDataType.UNSIGNED_BYTE;
                            this._sizePerElement = 1;
                        } else if (data instanceof Uint16Array) {
                            this._dataType = GLIndexDataType.UNSIGNED_SHORT;
                            this._sizePerElement = 2;
                        } else if (data instanceof Uint32Array) {
                            if (this._gl.supprotUintIndexes) {
                                this._dataType = GLIndexDataType.UNSIGNED_INT;
                                this._sizePerElement = 4;
                            } else {
                                this._dataType = GLIndexDataType.UNSIGNED_SHORT;
                                this._sizePerElement = 2;
                            }
                        } else {
                            throw new Error("GLIndexBuffer upload error: invalid data");
                        }
                    }

                    const dataLen = data.byteLength;
                    offset *= this._sizePerElement;
                    if (offset >= dataLen) {
                        offset = 0;
                        length = 0;
                    } else {
                        if (length < 0) {
                            length = offset > 0 ? dataLen - offset : dataLen;
                        } else {
                            length *= this._sizePerElement;
                            if (offset + length > dataLen) length = dataLen - offset;
                        }
                        if (this._sizePerElement === 2) {
                            if (!(length & 0b1))--length;
                        } else if (this._sizePerElement === 4) {
                            const r = length & 0b11;
                            if (!r) length -= r;
                        }
                    }

                    this._numElements = (length / this._sizePerElement) | 0;

                    if (length === data.byteLength) {
                        if (this._memSize === length) {
                            gl.bufferSubData(this._bufferType, 0, data);
                        } else {
                            this._memSize = length;
                            gl.bufferData(this._bufferType, data, usage);
                        }
                    } else {
                        let view = isArrBuf ? new DataView(<ArrayBuffer>data, offset, length) : new DataView((<ArrayBufferView>data).buffer, (<ArrayBufferView>data).byteOffset + offset, length);
                        if (this._memSize === length) {
                            gl.bufferSubData(this._bufferType, 0, view);
                        } else {
                            this._memSize = length;
                            gl.bufferData(this._bufferType, view, usage);
                        }
                    }
                }
            }
        }

        /**
         * @param dstOffset unit is element
         * @param srcOffset unit is element
         * @param length unit is element
         */
        public uploadSub(data: GLIndexBufferData, dstOffset: uint = 0, srcOffset: uint = 0, length: int = -1): void {
            this._uploadSub(data, this._dataType, dstOffset, srcOffset, length);
        }

        public draw(mode: GLDrawMode = null, count: uint = null, offset: uint = 0): void {
            this.bind();

            if (mode === null) mode = GLDrawMode.TRIANGLES;
            if (count === null) count = this._numElements;
            const last = this._numElements - offset;
            if (last > 0) {
                if (count > last) count = last;
                this._gl.drawElements(mode, count, this._dataType, offset);

                const stats = this._gl.stats;
                if (stats) {
                    ++stats.drawCalls;
                    if (mode === GLDrawMode.TRIANGLES) stats.drawTris += (count / 3) | 0;
                }

                const err = this._gl.context.getError();
                if (err !== GLEnum.NO_ERROR) this._gl.printConstant("draw error : ", err);
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
            const gl = this._gl.context;

            gl.shaderSource(this._shader, source);
            gl.compileShader(this._shader);

            let err: string = null;
            if (!gl.getShaderParameter(this._shader, gl.COMPILE_STATUS)) {
                err = gl.getShaderInfoLog(this._shader);
                GLShader._compileErrorLog(this._type, source, err);
            }

            return err;
        }

        public static compileShader(gl: GL, type: GLShaderType, source: string): WebGLShader {
            const internalGL = gl.context;

            let shader = internalGL.createShader(type);
            internalGL.shaderSource(shader, source);
            internalGL.compileShader(shader);

            if (!internalGL.getShaderParameter(shader, internalGL.COMPILE_STATUS)) {
                GLShader._compileErrorLog(type, source, internalGL.getShaderInfoLog(shader));
                internalGL.deleteShader(shader);
                shader = null;
            }

            return shader;
        }

        private static _compileErrorLog(type: GLShaderType, source: string, msg: string): void {
            console.error("compile " + (type === GLShaderType.VERTEX_SHADER ? "vertex" : "fragment") + " shader error : \n" + source + "\n" + msg);
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

            const len = this.name.length;
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
            const gl = this._gl.context;

            const vert = GLShader.compileShader(this._gl, GLShaderType.VERTEX_SHADER, vertexSource);
            const frag = GLShader.compileShader(this._gl, GLShaderType.FRAGMENT_SHADER, fragmentSource);

            const err = this.linkByInternalShander(vert, frag);

            gl.deleteShader(vert);
            gl.deleteShader(frag);

            return err;
        }

        public link(vertexShader: GLShader, fragmentShader: GLShader): null | string {
            return this.linkByInternalShander(vertexShader.internalShader, fragmentShader.internalShader);
        }

        public linkByInternalShander(vertexShader: WebGLShader, fragmentShader: WebGLShader): null | string {
            const gl = this._gl.context;

            gl.attachShader(this._program, vertexShader);
            gl.attachShader(this._program, fragmentShader);

            gl.linkProgram(this._program);

            const linked = gl.getProgramParameter(this._program, GLEnum.LINK_STATUS);
            let err: string = null;
            if (linked) {
                let count = gl.getProgramParameter(this._program, GLEnum.ACTIVE_ATTRIBUTES);
                this._attributes = [];
                for (let i = 0; i < count; ++i) {
                    const info = gl.getActiveAttrib(this._program, i);
                    this._attributes[i] = new GLProgramAttribInfo(info, gl.getAttribLocation(this._program, info.name));
                }

                count = gl.getProgramParameter(this._program, GLEnum.ACTIVE_UNIFORMS);
                this._uniforms = [];
                for (let i = 0; i < count; ++i) {
                    const info = gl.getActiveUniform(this._program, i);
                    const pu = new GLProgramUniformInfo(info, gl.getUniformLocation(this._program, info.name));
                    this._uniforms[i] = pu;
                    if (pu.isSampler) ++this._numSamplers;
                }

                this._status = GLProgramStatus.SUCCESSED;
            } else {
                gl.validateProgram(this._program);
                err = gl.getProgramInfoLog(this._program);
                console.error("link program error : " + err);

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
                const gl = this._gl.context;
                gl.texParameteri(this._textureType, GLTexFilterType.TEXTURE_MIN_FILTER, value);
                gl.texParameteri(this._textureType, GLTexFilterType.TEXTURE_MAG_FILTER, value);
            }
        }

        public setFilter(type: GLTexFilterType, value: GLTexFilterValue): void {
            if (this.bind()) this._gl.context.texParameteri(this._textureType, type, value);
        }

        public setWraps(value: GLTexWrapValue): void {
            if (this.bind()) {
                const gl = this._gl.context;
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
                console.error("can not call bind method, tex is destroyed");
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
                console.error("can not call use method, tex is destroyed");
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
                            const buf = <ArrayBufferView>args[4];
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
                        const img = <GLImage>args[2];
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
                        const img = <GLImage>args[4];
                        if (level === 0) {
                            this._width = img.width;
                            this._height = img.height;
                        }
                        this._gl.context.texImage2D(target, level, internalformat, <GLTexFormat>args[2], <GLTexDataType>args[3], img);
                    } else {
                        const img = <GLImage>args[2];
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

                if (this._gl.version >= 2) {
                    switch (args.length) {
                        case 6:
                            this._gl.context.texSubImage2D(target, level, xoffset, yoffset, <uint>args[0], <uint>args[1], <GLTexFormat>args[2], <GLTexDataType>args[3], <ArrayBufferView>args[4], <int>args[1]);
                            break;
                        case 5:
                            this._gl.context.texSubImage2D(target, level, xoffset, yoffset, <uint>args[0], <uint>args[1], <GLTexFormat>args[2], <GLTexDataType>args[3], <GLImage>args[4]);
                            break;
                        case 4: {
                            (<AbstractGLBuffer>args[2]).bind();
                            this._gl.context.texSubImage2D(target, level, xoffset, yoffset, <GLTexFormat>args[0], <GLTexDataType>args[1], <GLintptr>args[3]);

                            break;
                        }
                        case 3: {
                            const img = <GLImage>args[2];
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
                this._gl.context.framebufferRenderbuffer(GLEnum.FRAMEBUFFER, attachment, GLEnum.RENDERBUFFER, renderBuffer ? renderBuffer.internalBuffer : null);
            }
        }

        public setAttachmentTexture2D(attachment: GLTex2DAttachment, texTarget: GLFrameBufferTexTarget, tex: AbstractGLTexture): void {
            if (this._buffer) {
                this.bind();
                this._gl.context.framebufferTexture2D(GLEnum.FRAMEBUFFER, attachment, texTarget, tex ? tex.internalTexture : null, 0);
            }
        }

        public checkStatus(): boolean {
            if (this._buffer) {
                this.bind();

                const err = this._gl.context.checkFramebufferStatus(GLEnum.FRAMEBUFFER);
                if (err === GLEnum.FRAMEBUFFER_COMPLETE) {
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
                this._gl.context.renderbufferStorage(GLEnum.RENDERBUFFER, internalFormat, width, height);
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
                this._gl.context.renderbufferStorageMultisample(GLEnum.RENDERBUFFER, samples, internalFormat, width, height);
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
        public srcRGB = GLBlendFactorValue.ONE;
        public srcAlpha = GLBlendFactorValue.ONE;
        public dstRGB = GLBlendFactorValue.ZERO;
        public dstAlpha = GLBlendFactorValue.ZERO;

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
            const bf = new GLBlendFunc();
            bf.srcRGB = this.srcRGB;
            bf.srcAlpha = this.srcAlpha;
            bf.dstRGB = this.dstRGB;
            bf.dstAlpha = this.dstAlpha;
            return bf;
        }

        public isEqual(target: GLBlendFunc): boolean {
            return this.srcRGB === target.srcRGB && this.srcAlpha === target.srcAlpha && this.dstRGB === target.dstRGB && this.dstAlpha === target.dstAlpha;
        }

        public static isEqual(v0: GLBlendFunc, v1: GLBlendFunc): boolean {
            if (v0 === v1) return true;
            if (v0) {
                return v1 ? v0.srcRGB === v1.srcRGB && v0.srcAlpha === v1.srcAlpha && v0.dstRGB === v1.dstRGB && v0.dstAlpha === v1.dstAlpha : false;
            }
            return !v1;
        }
    }

    export class GLBlendEquation {
        public rgb = GLBlendEquationType.FUNC_ADD;
        public alpha = GLBlendEquationType.FUNC_ADD;

        public clone(): GLBlendEquation {
            const be = new GLBlendEquation();
            be.rgb = this.rgb;
            be.alpha = this.alpha;
            return be;
        }

        public isEqual(target: GLBlendEquation): boolean {
            return this.rgb === target.rgb && this.alpha === target.alpha;
        }

        public static isEqual(v0: GLBlendEquation, v1: GLBlendEquation): boolean {
            if (v0 === v1) return true;
            if (v0) {
                return v1 ? v0.rgb === v1.rgb && v0.alpha === v1.alpha : false;
            }
            return !v1;
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
        public equation: GLBlendEquation;
        public func: GLBlendFunc;
        public constColor: Color4;

        constructor(equation: GLBlendEquation = null, func: GLBlendFunc = null, constColor: Color4 = null) {
            this.equation = equation || new GLBlendEquation();
            this.func = func || new GLBlendFunc();
            this.constColor = constColor || Color4.TRANSPARENT_BLACK;
        }

        public clone() : GLBlend {
            const b = new GLBlend();
            if (this.equation) b.equation = this.equation.clone();
            if (this.func) b.func = this.func.clone();
            if (this.constColor) b.constColor = this.constColor.clone();
            return b;
        }

        public static isEqual(v0: GLBlend, v1: GLBlend): boolean {
            if (v0 === v1) return true;
            if (v0) {
                return v1 ? GLBlendEquation.isEqual(v0.equation, v1.equation) && GLBlendFunc.isEqual(v0.func, v1.func) && 
                Color4.isEqual(v0.constColor, v1.constColor) : false;
            }
            return !v1;
        }
    }

    export class GLColorWrite {
        public r: boolean;
        public g: boolean;
        public b: boolean;
        public a: boolean;

        constructor(r: boolean = true, g: boolean = true, b: boolean = true, a: boolean = true) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }

        public clone() : GLColorWrite {
            return new GLColorWrite(this.r, this.g, this.b, this.a);
        }

        public isEqual(target: GLColorWrite): boolean {
            return this.r === target.r && this.g === target.g && this.b === target.b && this.a === target.a;
        }

        public static isEqual(v0: GLColorWrite, v1: GLColorWrite): boolean {
            if (v0 === v1) return true;
            if (v0) {
                return v1 ? v0.r === v1.r && v0.g === v1.g && v0.b === v1.b && v0.a === v1.a : false;
            }
            return !v1;
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
        public func = GLStencilFunc.ALWAYS;
        /** In the WebGL, Front and Back must be consistent. */
        public ref: uint = 0;
        /** In the WebGL, Front and Back must be consistent. */
        public funcMask: uint = 0xFFFFFFFF;

        //op
        public stenciFail = GLStencilOpType.KEEP;
        public depthlFail = GLStencilOpType.KEEP;
        public pass = GLStencilOpType.KEEP;

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
            const s = new GLStencil();
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

        public static isEqual(v0: GLStencil, v1: GLStencil): boolean {
            if (v0 === v1) return true;
            if (v0) {
                return v1 ? v0.writeMask === v1.writeMask && v0.isFuncEqual(v1) && v0.isOpEqual(v1) : false;
            }
            return !v1;
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
        


        public stats: Stats = null;

        private _canvas: HTMLCanvasElement = null;
        private _gl: WebGLRenderingContext = null;

        private _version: number;
        private _versionFullInfo = "";
        private _vendor = "";
        private _renderer = "";

        private _maxVertexAttributes: uint = 0;
        private _maxVaryingVectors: uint = 0;
        private _maxVertexUniformVectors: uint = 0;
        private _maxFragmentUniformVectors: uint = 0;
        private _maxTextureSize: uint = 0;
        private _maxTexutreImageUnits: uint = 0;
        private _stencilBits: uint = 0;

        private _supportUintIndexes = false;

        private _defaultClear = new GLClear();
        private _clear = new GLClear();

        private _usedProgram: WebGLProgram = null;
        private _boundVertexBuffer: WebGLBuffer = null;
        private _boundIndexBuffer: WebGLBuffer = null;

        private _enabledBlend = false;
        private _defaultBlend = new GLBlend();
        private _blend = new GLBlend();

        private _enabledCullFace: boolean;
        private _cullFace: GLCullFace;

        private _enabledDepthTest: boolean;
        private _depthTest: GLDepthTest;

        private _depthWrite: boolean;

        private _viewport = new Rect();

        private _enabledStencilTest: boolean;
        private _defaultStencil = new GLStencil();
        private _stencilFrontFace = new GLStencil();
        private _stencilBackFace = new GLStencil();

        private _defaultColorWrite = new GLColorWrite();
        private _colorWrite = new GLColorWrite();

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

            this._versionFullInfo = this._gl.getParameter(GLEnum.VERSION);
            this._vendor = this._gl.getParameter(GLEnum.VENDOR);
            this._renderer = this._gl.getParameter(GLEnum.RENDERER);

            this._maxVertexAttributes = this._gl.getParameter(GLEnum.MAX_VERTEX_ATTRIBS);
            this._maxVaryingVectors = this._gl.getParameter(GLEnum.MAX_VARYING_VECTORS);
            this._maxVertexUniformVectors = this._gl.getParameter(GLEnum.MAX_VERTEX_UNIFORM_VECTORS);
            this._maxFragmentUniformVectors = this._gl.getParameter(GLEnum.MAX_FRAGMENT_UNIFORM_VECTORS);
            this._maxTexutreImageUnits = this._gl.getParameter(GLEnum.MAX_TEXTURE_IMAGE_UNITS);
            this._maxTextureSize = this._gl.getParameter(GLEnum.MAX_TEXTURE_SIZE);
            this._stencilBits = this._gl.getParameter(GLEnum.STENCIL_BITS);

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

                if (typeof options.version === "number") ver = options.version >= 2 ? 2 : 1;

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

                gl.frontFace(GLEnum.CW);
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
            const vp = this._gl.getParameter(GLEnum.VIEWPORT);
            this._viewport.set(vp[0], vp[1], vp[2], vp[3]);
        }

        private _initClear(): void {
            const color = this._gl.getParameter(GLEnum.COLOR_CLEAR_VALUE);
            this._clear.color.r = color[0];
            this._clear.color.g = color[1];
            this._clear.color.b = color[2];
            this._clear.color.a = color[3];
            this._clear.depth = this._gl.getParameter(GLEnum.DEPTH_CLEAR_VALUE);
            this._clear.stencil = this._gl.getParameter(GLEnum.STENCIL_CLEAR_VALUE);
        }

        private _initBlend(): void {
            this._enabledBlend = this._gl.isEnabled(GLEnum.BLEND);

            this._blend.equation.rgb = this._gl.getParameter(GLEnum.BLEND_EQUATION_RGB);
            this._blend.equation.alpha = this._gl.getParameter(GLEnum.BLEND_EQUATION_ALPHA);

            this._blend.func.srcRGB = this._gl.getParameter(GLEnum.BLEND_SRC_RGB);
            this._blend.func.srcAlpha = this._gl.getParameter(GLEnum.BLEND_SRC_ALPHA);
            this._blend.func.dstRGB = this._gl.getParameter(GLEnum.BLEND_DST_RGB);
            this._blend.func.dstAlpha = this._gl.getParameter(GLEnum.BLEND_DST_ALPHA);

            const blendColor = this._gl.getParameter(GLEnum.BLEND_COLOR);
            this._blend.constColor.setFromNumbers(blendColor[0], blendColor[1], blendColor[2], blendColor[3]);
        }

        private _initCullFace(): void {
            this._enabledCullFace = this._gl.isEnabled(GLEnum.CULL_FACE);
            this._cullFace = this._gl.getParameter(GLEnum.CULL_FACE_MODE);
        }

        private _initVertexAttribs(): void {
            this._usedVertexAttribs.length = this._maxFragmentUniformVectors;
            for (let i = 0; i < this._maxFragmentUniformVectors; ++i) this._usedVertexAttribs[i] = new UsedVertexAttribInfo();
        }

        private _initDepth(): void {
            this._depthWrite = this._gl.getParameter(GLEnum.DEPTH_WRITEMASK);

            this._enabledDepthTest = this._gl.isEnabled(GLEnum.DEPTH_TEST);
            this._depthTest = this._gl.getParameter(GLEnum.DEPTH_FUNC);
        }

        private _initStencil(): void {
            this._enabledStencilTest = this._gl.isEnabled(GLEnum.STENCIL_TEST);

            this._stencilFrontFace.writeMask = this._gl.getParameter(GLEnum.STENCIL_WRITEMASK);
            this._stencilFrontFace.func = this._gl.getParameter(GLEnum.STENCIL_FUNC);
            this._stencilFrontFace.ref = this._gl.getParameter(GLEnum.STENCIL_REF);
            this._stencilFrontFace.funcMask = this._gl.getParameter(GLEnum.STENCIL_VALUE_MASK);
            this._stencilFrontFace.stenciFail = this._gl.getParameter(GLEnum.STENCIL_FAIL);
            this._stencilFrontFace.depthlFail = this._gl.getParameter(GLEnum.STENCIL_PASS_DEPTH_FAIL);
            this._stencilFrontFace.pass = this._gl.getParameter(GLEnum.STENCIL_PASS_DEPTH_PASS);

            this._stencilBackFace.writeMask = this._gl.getParameter(GLEnum.STENCIL_BACK_WRITEMASK);
            this._stencilBackFace.func = this._gl.getParameter(GLEnum.STENCIL_BACK_FUNC);
            this._stencilBackFace.ref = this._gl.getParameter(GLEnum.STENCIL_BACK_REF);
            this._stencilBackFace.funcMask = this._gl.getParameter(GLEnum.STENCIL_BACK_VALUE_MASK);
            this._stencilBackFace.stenciFail = this._gl.getParameter(GLEnum.STENCIL_BACK_FAIL);
            this._stencilBackFace.depthlFail = this._gl.getParameter(GLEnum.STENCIL_BACK_PASS_DEPTH_FAIL);
            this._stencilBackFace.pass = this._gl.getParameter(GLEnum.STENCIL_BACK_PASS_DEPTH_PASS);
        }

        private _initColorMask(): void {
            const color = this._gl.getParameter(GLEnum.COLOR_WRITEMASK);
            this._colorWrite.r = color[0];
            this._colorWrite.g = color[1];
            this._colorWrite.b = color[2];
            this._colorWrite.a = color[3];
        }

        private _initFrameBuffer(): void {
            this._bindingFrameBuffer = this._gl.getParameter(GLEnum.FRAMEBUFFER_BINDING);

            if (this._version >= 2) {
                this._bindingReadFrameBuffer = this._gl.getParameter(GLEnum.READ_FRAMEBUFFER_BINDING);
                this._bindingDrawFrameBuffer = this._gl.getParameter(GLEnum.DRAW_FRAMEBUFFER_BINDING);
            }
        }

        private _initRenderBUffer(): void {
            this._bindingRenderBuffer = this._gl.getParameter(GLEnum.RENDERBUFFER_BINDING);
        }

        private _initTexture(): void {
            this._bindingTexture2D = this._gl.getParameter(GLEnum.TEXTURE_BINDING_2D);
            this._bindingTextureCube = this._gl.getParameter(GLEnum.TEXTURE_BINDING_CUBE_MAP);
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

                this._gl.bindFramebuffer(GLEnum.FRAMEBUFFER, null);
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

            const mask = data.clearMask;
            if (mask !== 0) this._gl.clear(mask);
        }

        public enableBlend(b: boolean): void {
            if (this._enabledBlend !== b) {
                this._enabledBlend = b;

                if (this._enabledBlend) {
                    this._gl.enable(GLEnum.BLEND);
                } else {
                    this._gl.disable(GLEnum.BLEND);
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
            color = color || this._defaultBlend.constColor;
            if (!this._blend.constColor.isEqualColor4(color)) {
                this._blend.constColor.set(color);

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
                this.setBlendColor(blend.constColor);
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
                    this._gl.disable(GLEnum.CULL_FACE);
                }
            } else {
                if (!this._enabledCullFace) {
                    this._enabledCullFace = true;
                    this._gl.enable(GLEnum.CULL_FACE);
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
                    this._gl.disable(GLEnum.DEPTH_TEST);
                }
            } else {
                if (!this._enabledDepthTest) {
                    this._enabledDepthTest = true;
                    this._gl.enable(GLEnum.DEPTH_TEST);
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

                if (!this._enabledStencilTest) {
                    this._enabledStencilTest = true;

                    this._gl.enable(GLEnum.STENCIL_TEST);
                }

                if (front === back || front.isEqual(back)) {
                    if (this._stencilFrontFace.writeMask !== front.writeMask || this._stencilBackFace.writeMask !== front.writeMask) {
                        this._stencilFrontFace.writeMask = front.writeMask;
                        this._stencilBackFace.writeMask = front.writeMask;

                        this._gl.stencilMaskSeparate(GLEnum.FRONT_AND_BACK, front.writeMask);
                    }

                    if (!this._stencilFrontFace.isFuncEqual(front) || this._stencilBackFace.isFuncEqual(front)) {
                        this._stencilFrontFace.copyFunc(front);
                        this._stencilBackFace.copyFunc(front);

                        this._gl.stencilFuncSeparate(GLEnum.FRONT_AND_BACK, front.func, front.ref, front.funcMask);
                    }

                    if (!this._stencilFrontFace.isOpEqual(front) || !this._stencilBackFace.isOpEqual(front)) {
                        this._stencilFrontFace.copyOp(front);
                        this._stencilBackFace.copyOp(front);

                        this._gl.stencilOpSeparate(GLEnum.FRONT_AND_BACK, front.stenciFail, front.depthlFail, front.pass);
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

                    this._gl.disable(GLEnum.STENCIL_TEST);
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
            const type = buffer.bufferType;
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
            const type = buffer.bufferType;
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
            const type = tex.textureType;
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
            const type = tex.textureType;
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
            const buf = buffer.internalBuffer;

            switch (target) {
                case 0: {
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
                case GLFrameBufferTarget.FRAMEBUFFER: {
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
                case GLFrameBufferTarget.READ_FRAMEBUFFER: {
                    if (this._version >= 2 && this._bindingReadFrameBuffer !== buf) {
                        this._bindingReadFrameBuffer = buf;

                        this._gl.bindFramebuffer(target, buf);
                    }

                    break;
                }
                case GLFrameBufferTarget.DRAW_FRAMEBUFFER: {
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
            const buf = buffer.internalBuffer;

            switch (target) {
                case 0: {
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
                case GLFrameBufferTarget.FRAMEBUFFER: {
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
                case GLFrameBufferTarget.READ_FRAMEBUFFER: {
                    if (this._version >= 2 && this._bindingReadFrameBuffer === buf) {
                        this._bindingReadFrameBuffer = null;

                        this._gl.bindFramebuffer(target, null);
                    }

                    break;
                }
                case GLFrameBufferTarget.DRAW_FRAMEBUFFER: {
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
                const info = this._usedVertexAttribs[index];

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
                const info = this._usedVertexAttribs[index];
                if (info.bufferID !== 0) {
                    info.bufferID = 0;

                    this._gl.disableVertexAttribArray(index);
                }
            }
        }

        public activeTexture(tex: AbstractGLTexture, index: uint): boolean {
            if (index < this._maxTexutreImageUnits) {

                const idx = GLEnum.TEXTURE0 + index;
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
                const idx = GLEnum.TEXTURE0 + index;
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

        public static calcMemSize(type: GLenum): uint {
            switch (type) {
                case GLEnum.BYTE:
                case GLEnum.UNSIGNED_BYTE:
                    return 1;
                case GLEnum.SHORT:
                case GLEnum.UNSIGNED_SHORT:
                    return 2;
                case GLEnum.INT:
                case GLEnum.UNSIGNED_INT:
                case GLEnum.FLOAT:
                    return 4
                default:
                    return 0;
            }
        }
    }
}