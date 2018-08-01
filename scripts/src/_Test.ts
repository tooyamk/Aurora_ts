class ZXC {
    constructor() {
    }
}

class AAA {
    private _arr: number[] = [];
    constructor() {
        for (let i = 0; i < 99; ++i) {
            this._arr[i] = 99 - i;
        }
    }

    public test1(): void {
        let tmp = this._arr;
        for (let i = 0, n = tmp.length; i < n; ++i) {
            let v = tmp[i];
        }
    }

    public test2(): void {
        for (let i of this._arr) {
            let v = i;
        }
    }

    public sort1(): void {
        this._arr.sort((a: number, b: number) => {
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    public sort2(): void {
        MITOIA.Sort.Merge.sort(this._arr, (a: number, b: number) => {
            return a < b;
        });

        console.log(this._arr[0], this._arr[this._arr.length - 1]);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    document.oncontextmenu = () => {
        return false;
    }

    let canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
    let engine = new MITOIA.Engine(canvas);

    console.log(engine.glVersion);
    
    let n0 = new MITOIA.Node();
    let n1 = new MITOIA.Node();
    n1.setParent(n0);

    let cam = n1.addComponent(new MITOIA.Camera());
    cam.setProjectionMatrix(MITOIA.Matrix44.createOrthoLHMatrix(100, 100, 10, 100));

    n0.setLocalPosition(100, 200, 300);
    n1.setLocalPosition(10, 20, 30);
    let p = n1.getWorldPosition();

    let rp = new MITOIA.ForwardRenderPipeline();

    let b = cam instanceof MITOIA.ForwardRenderPipeline;
    
    let vert = `
        attribute vec3 a_position;
        attribute vec2 uv;
        uniform float color1;
        //varying vec3 tmp;
        void main(void){
            //tmp = a_position;
            gl_Position = vec4(a_position.x, a_position.y, a_position.z, 1);
        }`;

    let frag = `
        precision highp float;
        uniform vec4 u_color;
        uniform float arr[20];
        uniform sampler2D tex;
        //varying vec3 tmp;
        void main(void){
            //vec4 c = texture2D(tex, vec2(arr[0], 0.0));
            gl_FragColor = vec4(u_color.x, u_color.y, u_color.z, u_color.w);
        }`;

    let vertexBuffer = new MITOIA.GLVertexBuffer(engine.gl);
    vertexBuffer.upload([-0.5, -0.5, 0.1, -0.5, 0.5, 0.1, 0.5, -0.5, 0.1], MITOIA.GLVertexBufferSize.THREE, MITOIA.GLVertexDataType.FLOAT, false, MITOIA.GLUsageType.STATIC_DRAW);

    let indexBuffer = new MITOIA.GLIndexBuffer(engine.gl);
    indexBuffer.upload([0, 1, 2], MITOIA.GLUsageType.STATIC_DRAW);

    let assetStore = new MITOIA.AssetStore();
    assetStore.a_position = vertexBuffer;
    assetStore.indexBuffer = indexBuffer;

    let renderer = n1.addComponent(new MITOIA.MeshRenderer());
    renderer.assetStore = assetStore;

    let mat = new MITOIA.Material(new MITOIA.Shader(engine.gl, vert, frag));
    mat.uniforms.setFloat4("u_color", 1, 1, 0, 0.2);
    mat.enabledBlend = true;
    mat.blendFunc = new MITOIA.GLBlendFunc();
    mat.blendFunc.set(MITOIA.GLBlendFactorSrcType.SRC_ALPHA, MITOIA.GLBlendFactorDestType.ONE_MINUS_SRC_ALPHA);
    renderer.materials[0] = mat;
    //renderer.vertexBuffers["position"] = vertexBuffer;

    let fps = new MITOIA.FPSDetector();

    new MITOIA.Looper(16).run(() => {
        engine.autoStretchCanvas();
        rp.render(engine, cam, n0);

        fps.record();
        //console.log(fps.fps);
    }, true);

    let a = 1;

    /*
    

    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vert);
    gl.compileShader(vertShader);

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, frag);
    gl.compileShader(fragShader);

    var program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);

    gl.linkProgram(program);
    gl.useProgram(program);

    var vertexPosAttr = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(vertexPosAttr);

    //var colorPosAttr = gl.getAttribLocation(program, 'aVertexColor');
    //gl.enableVertexAttribArray(colorPosAttr);

    var vertices = [
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0
    ];

    var vertices1 = [
        -0.5, -0.5, 0.1,
        -0.5, 0.5, 0.1,
        0.5, -0.5, 0.1
    ];
    

    var squareVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices1), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPosAttr, 3, gl.FLOAT, false, 0, 0);

    //var squareVerticesColorBuffer = gl.createBuffer();
    //gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    //gl.vertexAttribPointer(colorPosAttr, 4, gl.FLOAT, false, 0, 0);

    //var matrix = new MatrixHelper();
    //matrix.trans([0.0, 0.0, -5.0]);
    //matrix.make(40, 640 / 480, 0.1, 100.0);
    //matrix.set(gl, program);

    var indexesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([0, 1, 2]), gl.STATIC_DRAW);

    gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_BYTE, 0);
    let err = gl.getError();

    let done = true;
    */
});