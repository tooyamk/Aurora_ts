namespace Aurora {
    export type byte = number;
    export type ubyte = number;
    export type short = number;
    export type ushort = number;
    export type int = number;
    export type uint = number;
    export type long = number;
    export type ulong = number;
    export type float = number;
    export type double = number;

    export type GLImage = HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageBitmap | ImageData;
    export type GLVertexBufferData = number[] | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer | ArrayBufferView;

    export type AnimatorWrapType = (elapsed:number, duration:number) => number;
    export type AppendRenderingObjectFn = (renderable: AbstractRenderable, material: Material, alternativeUniforms: ShaderUniforms) => void;

    export type ShaderDefinesStack = ShaderDataStack<ShaderDefines, ShaderDefines.Value>;
    export type ShaderUniformsStack = ShaderDataStack<ShaderUniforms, ShaderUniforms.Value>;
}