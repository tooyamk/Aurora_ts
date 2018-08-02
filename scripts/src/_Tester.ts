function getURL(name: string): string {
    return "http://127.0.0.1/Mitoia/res/" + name + "?ts=" + MITOIA.Timer.utc;
}

function createModel(node: MITOIA.Node, engine: MITOIA.Engine) {
    let vert = `
        precision highp float;
        attribute vec3 a_Position;
        attribute vec2 a_TexCoord0;
        uniform mat4 u_mL2P;
        varying vec2 v_uv;
        void main(void){
            v_uv = a_TexCoord0;
            //gl_Position = vec4(a_Position.x, a_Position.y, a_Position.z, 1);
            gl_Position = u_mL2P * vec4(a_Position, 1.0);
        }`;

    let frag = `
        precision highp float;
        //uniform vec4 u_color;
        uniform float u_color[40];
        //uniform int arr[4];
        uniform sampler2D tex;
        varying vec2 v_uv;
        void main(void){
            vec4 c = texture2D(tex, v_uv);
            //gl_FragColor = vec4(u_color.x, u_color.y, u_color.z, u_color.w);
            //gl_FragColor = vec4(u_color[0], u_color[1], u_color[2], u_color[3]);
            gl_FragColor = vec4(c);
        }`;

    let vertexBuffer = new MITOIA.GLVertexBuffer(engine.gl);
    vertexBuffer.upload([-100, -100, 0.1, -200, 100, 0.1, 100, -50, 0.1], MITOIA.GLVertexBufferSize.THREE, MITOIA.GLVertexDataType.FLOAT, false, MITOIA.GLUsageType.STATIC_DRAW);

    let uvBuffer = new MITOIA.GLVertexBuffer(engine.gl);
    uvBuffer.upload([0, 0, 0, 1, 1, 0], MITOIA.GLVertexBufferSize.TWO, MITOIA.GLVertexDataType.FLOAT, false, MITOIA.GLUsageType.STATIC_DRAW);

    let indexBuffer = new MITOIA.GLIndexBuffer(engine.gl);
    indexBuffer.upload([0, 1, 2], MITOIA.GLUsageType.STATIC_DRAW);

    let assetStore = new MITOIA.AssetStore();
    assetStore.a_Position = vertexBuffer;
    assetStore.a_TexCoord0 = uvBuffer;
    assetStore.indexBuffer = indexBuffer;

    let renderer = node.addComponent(new MITOIA.MeshRenderer());
    renderer.assetStore = assetStore;

    let mat = new MITOIA.Material(new MITOIA.Shader(engine.gl, vert, frag));
    //mat.uniforms.setFloat("u_color", -0.1, 1, 0, 0.2);
    //mat.uniforms.setNumberArray("u_color", new Int32Array([1, 1, 0, 1]));
    mat.enabledBlend = false;
    mat.blendFunc = new MITOIA.GLBlendFunc();
    mat.blendFunc.set(MITOIA.GLBlendFactorSrcType.SRC_ALPHA, MITOIA.GLBlendFactorDestType.ONE_MINUS_SRC_ALPHA);
    renderer.materials[0] = mat;

    let tex = new MITOIA.GLTexture2D(engine.gl);

    let img = new Image();
    img.src = getURL("tex1.png");
    img.onload = () => {
        tex.upload(0, MITOIA.GLTexInternalFormat.RGBA, MITOIA.GLTexFormat.RGBA, MITOIA.GLTexDataType.UNSIGNED_BYTE, img);
        mat.uniforms.setTexture("tex", tex);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    document.oncontextmenu = () => {
        return false;
    }

    let canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
    let engine = new MITOIA.Engine(canvas);

    console.log(engine.glVersion);
    
    let worldNode = new MITOIA.Node();
    let model1Node = new MITOIA.Node();
    let model2Node = new MITOIA.Node();
    let cameraNode = new MITOIA.Node();
    model1Node.setParent(worldNode);
    model2Node.setParent(worldNode);
    cameraNode.setParent(worldNode);

    let cam = cameraNode.addComponent(new MITOIA.Camera());
    //cam.setProjectionMatrix(MITOIA.Matrix44.createOrthoLHMatrix(100, 100, 10, 100));
    cam.setProjectionMatrix(MITOIA.Matrix44.createPerspectiveFieldOfViewLHMatrix(Math.PI / 3, engine.canvasWidth / engine.canvasHeight, 1, 1000));
    cam.clearData.color.setFromRGBA(0.5, 0.5, 0.5, 1);
    cam.owner.setLocalPosition(0, 0, -10);

    //worldNode.setLocalPosition(100, 200, 300);
    //model1Node.setLocalPosition(10, 20, 30);

    createModel(model1Node, engine);

    let rp = new MITOIA.ForwardRenderPipeline();

    let fps = new MITOIA.FPSDetector();
    fps.show();

    //cameraNode.setLocalPosition(100);
    //model1Node.setLocalPosition(100);
    
    model1Node.appendLocalTranslate(0, 0, 500);
    let m = model1Node.getWorldMatrix();
    new MITOIA.Looper(16).run(() => {
        if (engine.autoStretchCanvas()) {
            cam.setProjectionMatrix(MITOIA.Matrix44.createPerspectiveFieldOfViewLHMatrix(Math.PI / 3, engine.canvasWidth / engine.canvasHeight, 1, 1000));
        }

        model1Node.appendLocalRotation(MITOIA.Quaternion.createFromEulerX(Math.PI / 180));

        rp.render(engine, cam, worldNode);

        fps.record();
        //console.log(fps.fps);
    }, true);

    let request = new XMLHttpRequest();
    request.addEventListener("loadend", () => {
        //request.response;
        request.responseText;
    });
    request.open("GET", getURL("tex1.png"), true);
    request.send();
    //request.responseType = "arraybuffer";
    //request.addEventListener("progress", (evt) => {});

    /**
    

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