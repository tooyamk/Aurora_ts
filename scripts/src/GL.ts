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
        /* ClearBufferMask */
        public static readonly DEPTH_BUFFER_BIT = 0x00000100;
        public static readonly STENCIL_BUFFER_BIT = 0x00000400;
        public static readonly COLOR_BUFFER_BIT = 0x00004000;

        /* BeginMode */
        public static readonly POINTS = 0x0000;
        public static readonly LINES = 0x0001;
        public static readonly LINE_LOOP = 0x0002;
        public static readonly LINE_STRIP = 0x0003;
        public static readonly TRIANGLES = 0x0004;
        public static readonly TRIANGLE_STRIP = 0x0005;
        public static readonly TRIANGLE_FAN = 0x0006;

        /* AlphaFunction (not supported in ES20) */
        /*      NEVER */
        /*      LESS */
        /*      EQUAL */
        /*      LEQUAL */
        /*      GREATER */
        /*      NOTEQUAL */
        /*      GEQUAL */
        /*      ALWAYS */

        /* BlendingFactorDest */
        public static readonly ZERO = 0;
        public static readonly ONE = 1;
        public static readonly SRC_COLOR = 0x0300;
        public static readonly ONE_MINUS_SRC_COLOR = 0x0301;
        public static readonly SRC_ALPHA = 0x0302;
        public static readonly ONE_MINUS_SRC_ALPHA = 0x0303;
        public static readonly DST_ALPHA = 0x0304;
        public static readonly ONE_MINUS_DST_ALPHA = 0x0305;

        /* BlendingFactorSrc */
        /*      ZERO */
        /*      ONE */
        public static readonly DST_COLOR = 0x0306;
        public static readonly ONE_MINUS_DST_COLOR = 0x0307;
        public static readonly SRC_ALPHA_SATURATE = 0x0308;
        /*      SRC_ALPHA */
        /*      ONE_MINUS_SRC_ALPHA */
        /*      DST_ALPHA */
        /*      ONE_MINUS_DST_ALPHA */

        /* BlendEquationSeparate */
        public static readonly FUNC_ADD = 0x8006;
        public static readonly BLEND_EQUATION = 0x8009;
        public static readonly BLEND_EQUATION_RGB = 0x8009;   /* same as BLEND_EQUATION */
        public static readonly BLEND_EQUATION_ALPHA = 0x883D;

        /* BlendSubtract */
        public static readonly FUNC_SUBTRACT = 0x800A;
        public static readonly FUNC_REVERSE_SUBTRACT = 0x800B;

        /* Separate Blend Functions */
        public static readonly BLEND_DST_RGB = 0x80C8;
        public static readonly BLEND_SRC_RGB = 0x80C9;
        public static readonly BLEND_DST_ALPHA = 0x80CA;
        public static readonly BLEND_SRC_ALPHA = 0x80CB;
        public static readonly CONSTANT_COLOR = 0x8001;
        public static readonly ONE_MINUS_CONSTANT_COLOR = 0x8002;
        public static readonly CONSTANT_ALPHA = 0x8003;
        public static readonly ONE_MINUS_CONSTANT_ALPHA = 0x8004;
        public static readonly BLEND_COLOR = 0x8005;

        /* Buffer Objects */
        public static readonly ARRAY_BUFFER = 0x8892;
        public static readonly ELEMENT_ARRAY_BUFFER = 0x8893;
        public static readonly ARRAY_BUFFER_BINDING = 0x8894;
        public static readonly ELEMENT_ARRAY_BUFFER_BINDING = 0x8895;
        public static readonly STREAM_DRAW = 0x88E0;
        public static readonly STATIC_DRAW = 0x88E4;
        public static readonly DYNAMIC_DRAW = 0x88E8;
        public static readonly BUFFER_SIZE = 0x8764;
        public static readonly BUFFER_USAGE = 0x8765;
        public static readonly CURRENT_VERTEX_ATTRIB = 0x8626;

        /* CullFaceMode */
        public static readonly FRONT = 0x0404;
        public static readonly BACK = 0x0405;
        public static readonly FRONT_AND_BACK = 0x0408;

        /* DepthFunction */
        /*      NEVER */
        /*      LESS */
        /*      EQUAL */
        /*      LEQUAL */
        /*      GREATER */
        /*      NOTEQUAL */
        /*      GEQUAL */
        /*      ALWAYS */

        /* EnableCap */
        /* TEXTURE_2D */
        public static readonly CULL_FACE = 0x0B44;
        public static readonly BLEND = 0x0BE2;
        public static readonly DITHER = 0x0BD0;
        public static readonly STENCIL_TEST = 0x0B90;
        public static readonly DEPTH_TEST = 0x0B71;
        public static readonly SCISSOR_TEST = 0x0C11;
        public static readonly POLYGON_OFFSET_FILL = 0x8037;
        public static readonly SAMPLE_ALPHA_TO_COVERAGE = 0x809E;
        public static readonly SAMPLE_COVERAGE = 0x80A0;

        /* ErrorCode */
        public static readonly NO_ERROR = 0;
        public static readonly INVALID_ENUM = 0x0500;
        public static readonly INVALID_VALUE = 0x0501;
        public static readonly INVALID_OPERATION = 0x0502;
        public static readonly OUT_OF_MEMORY = 0x0505;

        /* FrontFaceDirection */
        public static readonly CW = 0x0900;
        public static readonly CCW = 0x0901;

        /* GetPName */
        public static readonly LINE_WIDTH = 0x0B21;
        public static readonly ALIASED_POINT_SIZE_RANGE = 0x846D;
        public static readonly ALIASED_LINE_WIDTH_RANGE = 0x846E;
        public static readonly CULL_FACE_MODE = 0x0B45;
        public static readonly FRONT_FACE = 0x0B46;
        public static readonly DEPTH_RANGE = 0x0B70;
        public static readonly DEPTH_WRITEMASK = 0x0B72;
        public static readonly DEPTH_CLEAR_VALUE = 0x0B73;
        public static readonly DEPTH_FUNC = 0x0B74;
        public static readonly STENCIL_CLEAR_VALUE = 0x0B91;
        public static readonly STENCIL_FUNC = 0x0B92;
        public static readonly STENCIL_FAIL = 0x0B94;
        public static readonly STENCIL_PASS_DEPTH_FAIL = 0x0B95;
        public static readonly STENCIL_PASS_DEPTH_PASS = 0x0B96;
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
        public static readonly VIEWPORT = 0x0BA2;
        public static readonly SCISSOR_BOX = 0x0C10;
        /*      SCISSOR_TEST */
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
        /*      POLYGON_OFFSET_FILL */
        public static readonly POLYGON_OFFSET_FACTOR = 0x8038;
        public static readonly TEXTURE_BINDING_2D = 0x8069;
        public static readonly SAMPLE_BUFFERS = 0x80A8;
        public static readonly SAMPLES = 0x80A9;
        public static readonly SAMPLE_COVERAGE_VALUE = 0x80AA;
        public static readonly SAMPLE_COVERAGE_INVERT = 0x80AB;

        /* GetTextureParameter */
        /*      TEXTURE_MAG_FILTER */
        /*      TEXTURE_MIN_FILTER */
        /*      TEXTURE_WRAP_S */
        /*      TEXTURE_WRAP_T */
        public static readonly COMPRESSED_TEXTURE_FORMATST = 0x86A3;

        /* HintMode */
        public static readonly DONT_CARET = 0x1100;
        public static readonly FASTESTT = 0x1101;
        public static readonly NICESTT = 0x1102;

        /* HintTarget */
        public static readonly GENERATE_MIPMAP_HINT = 0x8192;

        /* DataType */
        public static readonly BYTE = 0x1400;
        public static readonly UNSIGNED_BYTE = 0x1401;
        public static readonly SHORT = 0x1402;
        public static readonly UNSIGNED_SHORT = 0x1403;
        public static readonly INT = 0x1404;
        public static readonly UNSIGNED_INT = 0x1405;
        public static readonly FLOAT = 0x1406;

        /* PixelFormat */
        public static readonly DEPTH_COMPONENT = 0x1902;
        public static readonly ALPHA = 0x1906;
        public static readonly RGB = 0x1907;
        public static readonly RGBA = 0x1908;
        public static readonly LUMINANCE = 0x1909;
        public static readonly LUMINANCE_ALPHA = 0x190A;

        /* PixelType */
        /*      UNSIGNED_BYTE */
        public static readonly UNSIGNED_SHORT_4_4_4_4 = 0x8033;
        public static readonly UNSIGNED_SHORT_5_5_5_1 = 0x8034;
        public static readonly UNSIGNED_SHORT_5_6_5 = 0x8363;

        /* Shaders */
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

        /* StencilFunction */
        public static readonly NEVER = 0x0200;
        public static readonly LESS = 0x0201;
        public static readonly EQUAL = 0x0202;
        public static readonly LEQUAL = 0x0203;
        public static readonly GREATER = 0x0204;
        public static readonly NOTEQUAL = 0x0205;
        public static readonly GEQUAL = 0x0206;
        public static readonly ALWAYS = 0x0207;

        /* StencilOp */
        /*      ZERO */
        public static readonly KEEP = 0x1E00;
        public static readonly REPLACE = 0x1E01;
        public static readonly INCR = 0x1E02;
        public static readonly DECR = 0x1E03;
        public static readonly INVERT = 0x150A;
        public static readonly INCR_WRAP = 0x8507;
        public static readonly DECR_WRAP = 0x8508;

        /* StringName */
        public static readonly VENDOR = 0x1F00;
        public static readonly RENDERER = 0x1F01;
        public static readonly VERSION = 0x1F02;

        /* TextureMagFilter */
        public static readonly NEAREST = 0x2600;
        public static readonly LINEAR = 0x2601;

        /* TextureMinFilter */
        /*      NEAREST */
        /*      LINEAR */
        public static readonly NEAREST_MIPMAP_NEAREST = 0x2700;
        public static readonly LINEAR_MIPMAP_NEAREST = 0x2701;
        public static readonly NEAREST_MIPMAP_LINEAR = 0x2702;
        public static readonly LINEAR_MIPMAP_LINEAR = 0x2703;

        /* TextureParameterName */
        public static readonly TEXTURE_MAG_FILTER = 0x2800;
        public static readonly TEXTURE_MIN_FILTER = 0x2801;
        public static readonly TEXTURE_WRAP_S = 0x2802;
        public static readonly TEXTURE_WRAP_T = 0x2803;

        /* TextureTarget */
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

        /* TextureUnit */
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
        public static readonly ACTIVE_TEXTURE = 0x84E0;

        /* TextureWrapMode */
        public static readonly REPEAT = 0x2901;
        public static readonly CLAMP_TO_EDGE = 0x812F;
        public static readonly MIRRORED_REPEAT = 0x8370;

        /* Uniform Types */
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

        /* Vertex Arrays */
        public static readonly VERTEX_ATTRIB_ARRAY_ENABLED = 0x8622;
        public static readonly VERTEX_ATTRIB_ARRAY_SIZE = 0x8623;
        public static readonly VERTEX_ATTRIB_ARRAY_STRIDE = 0x8624;
        public static readonly VERTEX_ATTRIB_ARRAY_TYPE = 0x8625;
        public static readonly VERTEX_ATTRIB_ARRAY_NORMALIZED = 0x886A;
        public static readonly VERTEX_ATTRIB_ARRAY_POINTER = 0x8645;
        public static readonly VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 0x889F;

        /* Read Format */
        public static readonly IMPLEMENTATION_COLOR_READ_TYPE = 0x8B9A;
        public static readonly IMPLEMENTATION_COLOR_READ_FORMAT = 0x8B9B;

        /* Shader Source */
        public static readonly COMPILE_STATUS = 0x8B81;

        /* Shader Precision-Specified Types */
        public static readonly LOW_FLOAT = 0x8DF0;
        public static readonly MEDIUM_FLOAT = 0x8DF1;
        public static readonly HIGH_FLOAT = 0x8DF2;
        public static readonly LOW_INT = 0x8DF3;
        public static readonly MEDIUM_INT = 0x8DF4;
        public static readonly HIGH_INT = 0x8DF5;

        /* Framebuffer Object. */
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
        public static readonly NONE: 0;
        public static readonly FRAMEBUFFER_COMPLETE = 0x8CD5;
        public static readonly FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 0x8CD6;
        public static readonly FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 0x8CD7;
        public static readonly FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 0x8CD9;
        public static readonly FRAMEBUFFER_UNSUPPORTED = 0x8CDD;
        public static readonly FRAMEBUFFER_BINDING = 0x8CA6;
        public static readonly RENDERBUFFER_BINDING = 0x8CA7;
        public static readonly MAX_RENDERBUFFER_SIZE = 0x84E8;
        public static readonly INVALID_FRAMEBUFFER_OPERATION = 0x0506;

        /* WebGL-specific enums */
        public static readonly UNPACK_FLIP_Y_WEBGL = 0x9240;
        public static readonly UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;
        public static readonly CONTEXT_LOST_WEBGL = 0x9242;
        public static readonly UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;
        public static readonly BROWSER_DEFAULT_WEBGL = 0x9244;

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

        public enableAlphaBlend(): void {
            this._gl.enable(this._gl.BLEND);
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