function getURL(name: string): string {
    return "http://127.0.0.1/Mitoia/res/" + name + "?ts=" + MITOIA.Timer.utc;
}

function createModel(node: MITOIA.Node, gl: MITOIA.GL) {
    let vert = `    #define CCVV )//wegwegwe
        precision highp float;
        attribute vec3 a_Position;
        attribute vec2 a_TexCoord;
        uniform mat4 u_MatL2P;
        varying vec2 v_uv;
        #elif defined (AAAA) || fuck == 2
        abc
        void main(void){
            v_uv = vec2(a_TexCoord);
            //gl_Position = vec4(a_Position.x, a_Position.y, a_Position.z, 1);
            gl_Position = u_MatL2P * vec4(a_Position, 1.0);
        }
        #define NNN`;

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

    let searchDefineNames = (data: string) => {
        let op = new Set<string>();
        let lines = ("\n" + data + "\n").match(/[\r\n][  ]*#(define|undef|ifdef|ifndef|if|elif)[  ]+[^\r\n/]*/g);
        if (lines) {
            let searchRegs: RegExp[] = [];
            let replaceRegs: RegExp[] = [];
            let searchIfOrElifReg = /#(if|elif)[  ]*/;
            let splitReg = /==|>|<|!=|>=|<=|&&|\|\|/;
            let replaceReg = /\s*!*defined\s*\(\s*|\s|\)/g;
            let noNumberReg = /\D/;

            let createReg = (name: string) => {
                searchRegs.push(new RegExp("#" + name + "[  ]+\\S+"));
                replaceRegs.push(new RegExp("#" + name + "|\\s", "g"));
            }

            createReg("define");
            createReg("undef");
            createReg("ifdef");
            createReg("ifndef");

            let regsLen = searchRegs.length;

            for (let i = 0, n = lines.length; i < n; ++i) {
                let line = lines[i];
                let isBreak: boolean = false;
                for (let j = 0; j < regsLen; ++j) {
                    let find = line.match(searchRegs[j]);
                    if (find) {
                        op.add(find[0].replace(replaceRegs[j], ""));
                        isBreak = true;
                        break;
                    }
                }

                if (!isBreak) {
                    let idx = line.search(searchIfOrElifReg);
                    if (idx >= 0) {
                        line = line.replace(searchIfOrElifReg, "");
                        let params = line.split(splitReg);
                        for (let j = 0, n = params.length; j < n; ++j) {
                            let value = params[j].replace(replaceReg, "");
                            if (value.search(noNumberReg) == 0) op.add(value);
                        }
                    }
                }
            }
        }

        for (let value of op) {
            console.log(value);
        }
        let b = 1;
    }
    
    let match_Cmd_Arg = (cmd: string, data: string) => {
        let reg1 = new RegExp("\\s" + cmd + "[  ]+\\S+\\s", "gm");
        let reg2 = new RegExp("\\s|" + cmd, "g");
        let arr = data.match(reg1)
        if (arr) {
            for (let i = 0, n = arr.length; i < n; ++i) {
                arr[i] = arr[i].replace(reg2, "");
            }
        }

        return arr;
    }

    let match_Cmd1_Cmd2_Arg = (cmd1: string, cmd2: string, data: string) => {
        let reg1 = new RegExp("\\s" + cmd1 + "[  ]+" + cmd2 + "[  ]*\\([  ]*\\S+[  ]*\\)\\s", "gm");
        let reg2 = new RegExp(cmd1 + "[  ]+" + cmd2 + "|\\s|\\(|\\)", "g");
        let arr = data.match(reg1)
        if (arr) {
            for (let i = 0, n = arr.length; i < n; ++i) {
                arr[i] = arr[i].replace(reg2, "");
            }
        }

        return arr;
    }

    let match_Cmd1_Cmd2_Equal_Arg = (cmd1: string, cmd2: string, data: string) => {
        let reg1 = new RegExp("\\s" + cmd1 + "[  ]+" + cmd2 + "[  ]*\\([  ]*\\S+[  ]*\\)\\s", "gm");
        let reg2 = new RegExp(cmd1 + "[  ]+" + cmd2 + "|\\s|\\(|\\)", "g");
        let arr = data.match(reg1)
        if (arr) {
            for (let i = 0, n = arr.length; i < n; ++i) {
                arr[i] = arr[i].replace(reg2, "");
            }
        }

        return arr;
    }

    searchDefineNames(vert);

    //let vert1 = " " + vert + " ";
    //let defines1 = match_Cmd_Arg("#define", vert1);
    //let defines2 = match_Cmd1_Cmd2_Arg("#if", "!defined", vert1);

    let vertexBuffer = new MITOIA.GLVertexBuffer(gl);
    vertexBuffer.upload([-100, -100, 0.1, -280.0, 100, 0.1, 100, -50, 0.1], MITOIA.GLVertexBufferSize.THREE, MITOIA.GLVertexDataType.FLOAT, false, MITOIA.GLUsageType.STATIC_DRAW);

    let uvBuffer = new MITOIA.GLVertexBuffer(gl);
    uvBuffer.upload([0, 0, 0, 1, 1, 0], MITOIA.GLVertexBufferSize.TWO, MITOIA.GLVertexDataType.FLOAT, false, MITOIA.GLUsageType.STATIC_DRAW);

    let indexBuffer = new MITOIA.GLIndexBuffer(gl);
    indexBuffer.upload([0, 1, 2], MITOIA.GLUsageType.STATIC_DRAW);

    let assetStore = new MITOIA.AssetStore();
    assetStore.vertexBuffers.set(MITOIA.Shader.a_Position, vertexBuffer);
    assetStore.vertexBuffers.set(MITOIA.Shader.a_TexCoord, uvBuffer);
    assetStore.indexBuffer = indexBuffer;

    let renderer = node.addComponent(new MITOIA.MeshRenderer());
    renderer.assetStore = assetStore;

    let mat = new MITOIA.Material(new MITOIA.Shader(gl, vert, frag));
    //mat.uniforms.setFloat("u_color", -0.1, 1, 0, 0.2);
    //mat.uniforms.setNumberArray("u_color", new Int32Array([1, 1, 0, 1]));
    let stencil = new MITOIA.GLStencil();
    stencil.func = MITOIA.GLStencilFunc.NEVER;
    //stencil.ref = 2;

    let stencil2 = new MITOIA.GLStencil();
    stencil2.func = MITOIA.GLStencilFunc.ALWAYS;
    //stencil2.ref = 2;

    mat.cullFace = MITOIA.GLCullFace.NONE;
    mat.depthTest = MITOIA.GLDepthTest.ALWAYS;
    //mat.stencilFront = stencil;
    //mat.stencilBack = stencil2;
    renderer.materials[0] = mat;

    let tex = new MITOIA.GLTexture2D(gl);
   
    let img = new Image();
    img.src = getURL("tex1.png");
    img.onload = () => {
        gl.context.pixelStorei(MITOIA.GL.UNPACK_FLIP_Y_WEBGL, true);
        //tex.upload(0, MITOIA.GLTexInternalFormat.RGBA, MITOIA.GLTexFormat.RGBA, MITOIA.GLTexDataType.UNSIGNED_BYTE, img);
        gl.context.pixelStorei(MITOIA.GL.UNPACK_FLIP_Y_WEBGL, false);
        mat.uniforms.setTexture("tex", tex);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    document.oncontextmenu = () => {
        return false;
    }

    let canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
    let options: MITOIA.GLOptions = {};
    options.preserveDrawingBuffer = true;
    options.depth = true;
    options.stencil = true;
    options.version = 1;
    let gl = new MITOIA.GL(canvas, options);

    console.log(MITOIA.Version, gl.version, gl.versionFullInfo);
    
    let worldNode = new MITOIA.Node();
    let model1Node = new MITOIA.Node();
    let model2Node = new MITOIA.Node();
    let cameraNode = new MITOIA.Node();
    model1Node.setParent(worldNode);
    model2Node.setParent(worldNode);
    cameraNode.setParent(worldNode);

    let fbo = new MITOIA.GLFrameBuffer(gl, 200, 200);

    let depthRBO = new MITOIA.GLRenderBuffer(gl);
    depthRBO.storage(MITOIA.GLRenderBufferInternalFormat.DEPTH_COMPONENT16, fbo.width, fbo.height);

    let stencilRBO = new MITOIA.GLRenderBuffer(gl);
    stencilRBO.storage(MITOIA.GLRenderBufferInternalFormat.STENCIL_INDEX8, fbo.width, fbo.height);

    let depthAndStencilRBO = new MITOIA.GLRenderBuffer(gl);
    depthAndStencilRBO.storage(MITOIA.GLRenderBufferInternalFormat.DEPTH_STENCIL, fbo.width, fbo.height);

    let colorTex = new MITOIA.GLTexture2D(gl);
    colorTex.upload(0, MITOIA.GLTexInternalFormat.RGBA, fbo.width, fbo.height, MITOIA.GLTexFormat.RGBA, MITOIA.GLTexDataType.UNSIGNED_BYTE, <ArrayBufferView>null, 0);
    
    fbo.setAttachmentRenderBuffer(MITOIA.GLRenderBufferAttachment.DEPTH_STENCIL_ATTACHMENT, depthAndStencilRBO);
    //fbo.setAttachmentRenderBuffer(MITOIA.GLFrameBufferRenderBufferAttachment.STENCIL_ATTACHMENT, stencilRBO);
    fbo.setAttachmentTexture2D(MITOIA.GLTex2DAttachment.COLOR_ATTACHMENT0, MITOIA.GLFrameBufferTexTarget.TEXTURE_2D, colorTex);

    let cam = cameraNode.addComponent(new MITOIA.Camera());
    //cam.setProjectionMatrix(MITOIA.Matrix44.createOrthoLHMatrix(engine.canvasWidth, engine.canvasHeight, 10, 10000));
    //cam.setProjectionMatrix(MITOIA.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, engine.canvasWidth / engine.canvasHeight, 1, 10000));
    cam.setProjectionMatrix(MITOIA.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, 1257 / 1308, 5, 10000));
    cam.clear.color.setFromRGBA(0.5, 0.5, 0.5, 1);
    //cam.clear.clearColor = false;
    //cam.clear.clearDepth = false;
    cam.owner.setLocalPosition(0, 0, -10);
    if (fbo.checkStatus()) {
        cam.frameBuffer = fbo;
    } else {
        let a = 1;
    }

    model1Node.appendLocalTranslate(0, 0, 500);

    createModel(model1Node, gl);

    model1Node.appendLocalRotation(MITOIA.Quaternion.createFromEulerY(Math.PI));

    let rp = new MITOIA.ForwardRenderPipeline();

    let stretcher = new MITOIA.CanvasAutoStretcher(gl);

    let fps = new MITOIA.FPSDetector();
    fps.show();
    
    new MITOIA.Looper(16).run(() => {
        if (stretcher.execute()) {
            //cam.setProjectionMatrix(MITOIA.Matrix44.createOrthoLHMatrix(engine.canvasWidth, engine.canvasHeight, 10, 10000));
            cam.setProjectionMatrix(MITOIA.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, gl.canvas.width / gl.canvas.height, 5, 10000));
        }

        model1Node.appendLocalRotation(MITOIA.Quaternion.createFromEulerY(Math.PI / 180));

        rp.render(gl, cam, worldNode);
        let b = gl.context.getError() === MITOIA.GL.NO_ERROR;

        fps.record();
        //console.log(fps.fps);
    }, true);

    let request = new XMLHttpRequest();
    request.addEventListener("loadend", () => {
        //request.response;
        //request.responseText;
    });
    request.open("GET", getURL("tex1.png"), true);
    request.send();
});