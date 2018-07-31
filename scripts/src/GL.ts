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

    export class GLVertexBuffer {
        private static _idGenerator = 0;

        private _gl: GL;
        private _buffer: WebGLBuffer;
        private _id: number;
        private _uploadCount: number = 0;

        private _size: GLVertexBufferSize = GLVertexBufferSize.FOUR;
        private _type: GLVertexDataType = GLVertexDataType.FLOAT;
        private _normalized: boolean = false;
        private _usage: GLUsageType = GLUsageType.STATIC_DRAW;

        private _location: number = -1;

        constructor(gl: GL) {
            this._gl = gl;
            this._id = ++GLVertexBuffer._idGenerator;
            this._buffer = this._gl.internalGL.createBuffer();
        }

        public get id(): number {
            return this._id;
        }

        public get internalBuffer(): WebGLBuffer {
            return this._buffer;
        }

        public dispose(): void {
            if (this._buffer) {
                this._gl.unbindVertexBuffer(this);
                this._gl.internalGL.deleteBuffer(this._buffer);
                this._buffer = null;

                this._gl = null;
            }
        }

        public get size(): GLVertexBufferSize {
            return this._size;
        }

        public set size(size: GLVertexBufferSize) {
            this._size = size;
        }

        public get type(): GLVertexDataType {
            return this._type;
        }

        public set type(type: GLVertexDataType) {
            this._type = type;
        }

        public get normalized(): boolean {
            return this._normalized;
        }

        public set normalized(b: boolean) {
            this._normalized = b;
        }

        public get usage(): GLUsageType {
            return this._usage;
        }

        public get uploadCount(): number {
            return this._uploadCount;
        }

        public upload(data: number[] | ArrayBuffer | ArrayBufferView, size: GLVertexBufferSize = GLVertexBufferSize.FOUR, type: GLVertexDataType = GLVertexDataType.FLOAT, normalized: boolean = false, usage: GLUsageType = GLUsageType.STATIC_DRAW): void {
            if (this._buffer) {
                ++this._uploadCount;
                this._size = size;
                this._type = type;
                this._normalized = normalized;
                this._usage = usage;

                let gl = this._gl.internalGL;

                this.bind();

                gl.bindBuffer(GL.ARRAY_BUFFER, this._buffer);

                if (data instanceof Array) {
                    gl.bufferData(GL.ARRAY_BUFFER, new Float32Array(data), usage);
                } else {
                    gl.bufferData(GL.ARRAY_BUFFER, <ArrayBuffer>data, usage);
                }
            }
        }

        public bind(): boolean {
            return this._gl.bindVertexBuffer(this);
        }

        public use(location: uint): void {
            this._gl.vertexAttribPointerEx(this, location, this._size, this._type, this._normalized, 0, 0);
        }
    }

    export class GLIndexBuffer {
        private _gl: GL;
        private _buffer: WebGLBuffer;

        private _type: GLIndexDataType = GLIndexDataType.UNSIGNED_SHORT;
        private _usage: GLUsageType = GLUsageType.STATIC_DRAW;

        private _dataLength: uint = 0;

        constructor(gl: GL) {
            this._gl = gl;

            this._buffer = this._gl.internalGL.createBuffer();
        }

        public get internalBuffer(): WebGLBuffer {
            return this._buffer;
        }

        public dispose(): void {
            if (this._buffer) {
                this._gl.unbindIndexBuffer(this);
                this._gl.internalGL.deleteBuffer(this._buffer);
                this._buffer = null;

                this._gl = null;
            }
        }

        public get type(): GLIndexDataType {
            return this._type;
        }

        public set type(type: GLIndexDataType) {
            this._type = type;
        }

        public get usage(): GLUsageType {
            return this._usage;
        }

        public upload(data: number[] | Uint32Array | Uint16Array | Uint8Array, usage: GLUsageType = GLUsageType.STATIC_DRAW): void {
            if (this._buffer) {
                this._usage = usage;

                let gl = this._gl.internalGL;

                this.bind();

                let arrayBuffer;

                if (data instanceof Uint8Array) {
                    arrayBuffer = data;
                    this._type = GLIndexDataType.UNSIGNED_BYTE;
                } else if (data instanceof Uint16Array) {
                    arrayBuffer = data;
                    this._type = GLIndexDataType.UNSIGNED_SHORT;
                } else if (data instanceof Uint32Array) {
                    if (this._gl.supprotUintIndexes) {
                        arrayBuffer = data;
                        this._type = GLIndexDataType.UNSIGNED_INT;
                    } else {
                        arrayBuffer = new Uint16Array(data);
                        this._type = GLIndexDataType.UNSIGNED_SHORT;
                    }
                } else {
                    this._type = GLIndexDataType.UNSIGNED_BYTE;
                    for (let i = data.length - 1; i >= 0; --i) {
                        let v = data[i];
                        if (v > 0xFFFF) {
                            this._type = GLIndexDataType.UNSIGNED_INT;
                            break;
                        } else if (this._type == GLIndexDataType.UNSIGNED_BYTE && v > 0xFF) {
                            this._type = GLIndexDataType.UNSIGNED_SHORT;
                        }
                    }

                    if (this._type == GLIndexDataType.UNSIGNED_INT) {
                        if (this._gl.supprotUintIndexes) {
                            arrayBuffer = new Uint32Array(data);
                        } else {
                            arrayBuffer = new Uint16Array(data);
                            this._type = GLIndexDataType.UNSIGNED_SHORT;
                        }
                    } else if (this._type == GLIndexDataType.UNSIGNED_SHORT) {
                        arrayBuffer = new Uint16Array(data);
                    } else {
                        arrayBuffer = new Uint8Array(data);
                    }
                }

                this._dataLength = arrayBuffer.length;
                gl.bufferData(GL.ELEMENT_ARRAY_BUFFER, arrayBuffer, usage);
            }
        }

        public bind(): boolean {
            return this._gl.bindIndexBuffer(this);
        }

        public draw(mode: GLDrawMode = null, count: uint = null, offset: uint = 0): void {
            this.bind();

            if (mode === null) mode = GL.TRIANGLES;
            if (count === null) count = this._dataLength;
            this._gl.internalGL.drawElements(mode, count, this._type, offset);
        }
    }

    export class GLShader {
        private _gl: GL;
        private _shader: WebGLShader;
        private _type: GLShaderType;

        constructor(gl: GL, type: GLShaderType) {
            this._gl = gl;
            this._type = type;

            let internalGL = this._gl.internalGL;

            this._shader = internalGL.createShader(type);
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
                GLShader.compileErrorLog(this._type, source, err);
            }

            return err;
        }

        public static compileShader(gl:GL, type: GLShaderType, source: string): WebGLShader {
            let internalGL = gl.internalGL;

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

    export class GLProgramAttributeInfo {
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
        public readonly size: number;
        public readonly type: GLUniformType;
        public readonly location: WebGLUniformLocation;

        constructor(info: WebGLActiveInfo, location: WebGLUniformLocation) {
            this.name = info.name;
            this.size = info.size;
            this.type = info.type;
            this.location = location;
        }
    }

    export class GLProgram {
        private _gl: GL;
        private _program: WebGLProgram;
        private _attributes: GLProgramAttributeInfo[] = null;
        private _uniforms: GLProgramUniformInfo[] = null;

        constructor(gl: GL) {
            this._gl = gl;

            this._program = this._gl.internalGL.createProgram();
        }

        public get attributes(): GLProgramAttributeInfo[] {
            return this._attributes;
        }

        public get uniforms(): GLProgramUniformInfo[] {
            return this._uniforms;
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
            let gl = this._gl.internalGL;

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
                    this._attributes[i] = new GLProgramAttributeInfo(info, gl.getAttribLocation(this._program, info.name));
                }

                count = gl.getProgramParameter(this._program, GL.ACTIVE_UNIFORMS);
                this._uniforms = [];
                for (let i = 0; i < count; ++i) {
                    let info = gl.getActiveUniform(this._program, i);
                    this._uniforms[i] = new GLProgramUniformInfo(info, gl.getUniformLocation(this._program, info.name));
                }
            } else {
                gl.validateProgram(this._program);
                err = gl.getProgramInfoLog(this._program);
                console.log("link program error : " + err);
            }

            return err;
        }

        public use(): void {
            this._gl.useProgram(this);
        }
    }

    class UsedVertexAttrib {
        public bufferID: number = null;
        public uploadCount: number = null;
        public size: number = null;
        public type: number = null;
        public normalized: boolean = null;
        public stride: number = null;
        public offset: number = null;
    }

    export class GL {
        //ClearBufferMask
        public static readonly DEPTH_BUFFER_BIT = 0x00000100;
        public static readonly STENCIL_BUFFER_BIT = 0x00000400;
        public static readonly COLOR_BUFFER_BIT = 0x00004000;

        //DrawMode
        public static readonly POINTS = 0x0000;
        public static readonly LINES = 0x0001;
        public static readonly LINE_LOOP = 0x0002;
        public static readonly LINE_STRIP = 0x0003;
        public static readonly TRIANGLES = 0x0004;
        public static readonly TRIANGLE_STRIP = 0x0005;
        public static readonly TRIANGLE_FAN = 0x0006;

        //DataType
        public static readonly BYTE = 0x1400;
        public static readonly UNSIGNED_BYTE = 0x1401;
        public static readonly SHORT = 0x1402;
        public static readonly UNSIGNED_SHORT = 0x1403;
        public static readonly INT = 0x1404;
        public static readonly UNSIGNED_INT = 0x1405;
        public static readonly FLOAT = 0x1406;

        //BufferType
        public static readonly ARRAY_BUFFER = 0x8892;
        public static readonly ELEMENT_ARRAY_BUFFER = 0x8893;

        //UsageType
        public static readonly STREAM_DRAW = 0x88E0;
        public static readonly STATIC_DRAW = 0x88E4;
        public static readonly DYNAMIC_DRAW = 0x88E8;

        //Shaders
        public static readonly FRAGMENT_SHADER = 0x8B30;
        public static readonly VERTEX_SHADER = 0x8B31;
        public static readonly MAX_VERTEX_ATTRIBS = 0x8869;
        public static readonly MAX_VERTEX_UNIFORM_VECTORS = 0x8DFB;
        public static readonly MAX_VARYING_VECTORS = 0x8DFC;
        public static readonly MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8B4D;
        public static readonly MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8B4C;
        public static readonly MAX_TEXTURE_IMAGE_UNITS = 0x8872;
        public static readonly MAX_FRAGMENT_UNIFORM_VECTORS = 0x8DFD;
        public static readonly SHADER_TYPE = 0x8B4F;
        public static readonly DELETE_STATUS = 0x8B80;
        public static readonly LINK_STATUS = 0x8B82;
        public static readonly VALIDATE_STATUS = 0x8B83;
        public static readonly ATTACHED_SHADERS = 0x8B85;
        public static readonly ACTIVE_UNIFORMS = 0x8B86;
        public static readonly ACTIVE_ATTRIBUTES = 0x8B89;
        public static readonly SHADING_LANGUAGE_VERSION = 0x8B8C;
        public static readonly CURRENT_PROGRAM = 0x8B8D;

        //StringName
        public static readonly VENDOR = 0x1F00;
        public static readonly RENDERER = 0x1F01;
        public static readonly VERSION = 0x1F02;

        //TextureMagFilter
        public static readonly NEAREST = 0x2600;
        public static readonly LINEAR = 0x2601;

        //TextureMinFilter
        public static readonly NEAREST_MIPMAP_NEAREST = 0x2700;
        public static readonly LINEAR_MIPMAP_NEAREST = 0x2701;
        public static readonly NEAREST_MIPMAP_LINEAR = 0x2702;
        public static readonly LINEAR_MIPMAP_LINEAR = 0x2703;

        //TextureParameterName
        public static readonly TEXTURE_MAG_FILTER = 0x2800;
        public static readonly TEXTURE_MIN_FILTER = 0x2801;
        public static readonly TEXTURE_WRAP_S = 0x2802;
        public static readonly TEXTURE_WRAP_T = 0x2803;

        //Attribute & Uniform Types
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

        private _usedVertexAttribs: { [key: number]: UsedVertexAttrib } = {};

        constructor(gl: WebGLRenderingContext) {
            this._gl = gl;
            
            this._gl.clearColor(this._clearColor.r, this._clearColor.g, this._clearColor.b, this._clearColor.a);
            this._gl.clearDepth(this._depthValue);
            this._gl.clearStencil(this._stencilValue);

            this._version = this._gl.getParameter(GL.VERSION);

            this._maxVertexAttributes = this._gl.getParameter(GL.MAX_VERTEX_ATTRIBS);
            this._maxVaryingVectors = this._gl.getParameter(GL.MAX_VARYING_VECTORS);
            this._maxVertexUniformVectors = this._gl.getParameter(GL.MAX_VERTEX_UNIFORM_VECTORS); 
            this._maxFragmentUniformVectors = this._gl.getParameter(GL.MAX_FRAGMENT_UNIFORM_VECTORS);

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
            if (clearColor) mask |= GL.COLOR_BUFFER_BIT;
            if (clearDepth) mask |= GL.DEPTH_BUFFER_BIT;
            if (clearStencil) mask |= GL.STENCIL_BUFFER_BIT;

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

        public bindVertexBuffer(buffer: GLVertexBuffer): boolean {
            if (this._boundVertexBuffer !== buffer.internalBuffer) {
                this._boundVertexBuffer = buffer.internalBuffer;
                this._gl.bindBuffer(GL.ARRAY_BUFFER, this._boundVertexBuffer);
                return true;
            }
            return false;
        }

        public unbindVertexBuffer(buffer: GLVertexBuffer): void {
            if (this._boundVertexBuffer === buffer.internalBuffer) {
                this._boundVertexBuffer = null;
                this._gl.bindBuffer(GL.ARRAY_BUFFER, null);
            }
        }

        public bindIndexBuffer(buffer: GLIndexBuffer): boolean {
            if (this._boundIndexBuffer !== buffer.internalBuffer) {
                this._boundIndexBuffer = buffer.internalBuffer;
                this._gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this._boundIndexBuffer);
                return true;
            }
            return false;
        }

        public unbindIndexBuffer(buffer: GLIndexBuffer): void {
            if (this._boundIndexBuffer === buffer.internalBuffer) {
                this._boundIndexBuffer = null;
                this._gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, null);
            }
        }

        public getAttribLocations(program: GLProgram, names: string[], rst: number[] = null): number[] {
            rst = rst || [];

            if (program) {
                let n = names.length;
                let p = program.internalProgram;
                for (let i = 0; i < n; ++i) {
                    rst[i] = this._gl.getAttribLocation(p, names[i]);
                }
                rst.length = n;
            } else {
                rst.length = 0;
            }

            return rst;
        }

        public getUniformLocations(program: GLProgram, names: string[], rst: WebGLUniformLocation[] = null): WebGLUniformLocation[] {
            rst = rst || [];

            if (program) {
                let n = names.length;
                let p = program.internalProgram;
                for (let i = 0; i < n; ++i) {
                    rst[i] = this._gl.getUniformLocation(p, names[i]);
                }
                rst.length = n;
            } else {
                rst.length = 0;
            }

            return rst;
        }

        public vertexAttribPointerEx(buffer: GLVertexBuffer, indx: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void {
            let info = this._usedVertexAttribs[indx];
            if (!info) {
                info = new UsedVertexAttrib();
                this._usedVertexAttribs[indx] = info;
            }

            if (info.bufferID !== buffer.id || info.uploadCount !== buffer.uploadCount || info.size !== size || info.type !== type || info.normalized !== normalized || info.stride !== stride || info.offset !== offset) {
                info.bufferID = buffer.id;
                info.uploadCount = buffer.uploadCount;
                info.size = size;
                info.type = type;
                info.normalized = normalized;
                info.stride = stride;
                info.offset = offset;

                this._gl.enableVertexAttribArray(indx);
                buffer.bind();
                this._gl.vertexAttribPointer(indx, size, type, normalized, stride, offset);
            }
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

    export enum GLVertexDataType {
        BYTE = GL.BYTE,
        UNSIGNED_BYTE = GL.UNSIGNED_BYTE,
        SHORT = GL.SHORT,
        UNSIGNED_SHORT = GL.UNSIGNED_SHORT,
        INT = GL.INT,
        UNSIGNED_INT = GL.UNSIGNED_INT,
        FLOAT = GL.FLOAT
    }

    export enum GLIndexDataType {
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
}