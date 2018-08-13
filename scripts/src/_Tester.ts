function getURL(name: string): string {
    return "http://127.0.0.1/Mitoia/res/" + name + "?ts=" + MITOIA.Timer.utc;
}

function createModel(node: MITOIA.Node, gl: MITOIA.GL, shaderStore: MITOIA.ShaderStore, vert: string, frag: string) {
    let vertexBuffer = new MITOIA.GLVertexBuffer(gl);
    vertexBuffer.upload([-100, -100, 0.1, -280.0, 100, 0.1, 100, -50, 0.1], MITOIA.GLVertexBufferSize.THREE, MITOIA.GLVertexBufferDataType.FLOAT, false, MITOIA.GLUsageType.STATIC_DRAW);

    let uvBuffer = new MITOIA.GLVertexBuffer(gl);
    uvBuffer.upload([0, 0, 0, 1, 1, 0], MITOIA.GLVertexBufferSize.TWO, MITOIA.GLVertexBufferDataType.FLOAT, false, MITOIA.GLUsageType.STATIC_DRAW);

    let indexBuffer = new MITOIA.GLIndexBuffer(gl);
    indexBuffer.upload([0, 1, 2], MITOIA.GLUsageType.STATIC_DRAW);

    let assetStore = new MITOIA.AssetStore();
    assetStore.vertexBuffers.set(MITOIA.ShaderPredefined.a_Position, vertexBuffer);
    assetStore.vertexBuffers.set(MITOIA.ShaderPredefined.a_TexCoord, uvBuffer);
    assetStore.drawIndexBuffer = indexBuffer;

    //assetStore = MITOIA.MeshBuilder.createSphere(100, 100, true, true);
    assetStore = MITOIA.MeshBuilder.createBox(100, 100, 100, 1, 1, 1, true, true);

    let mesh = node.addComponent(new MITOIA.RenderableMesh());
    mesh.assetStore = assetStore;

    //console.log(shaderStore.getShaderSource(vert, MITOIA.GLShaderType.VERTEX_SHADER).source);
    //console.log(shaderStore.getShaderSource(vert, MITOIA.GLShaderType.FRAGMENT_SHADER).source);

    let mat = new MITOIA.Material(new MITOIA.Shader(gl, shaderStore.getShaderSource(vert, MITOIA.GLShaderType.VERTEX_SHADER), shaderStore.getShaderSource(frag, MITOIA.GLShaderType.FRAGMENT_SHADER)));
    //mat.uniforms.setFloat("u_color", -0.1, 1, 0, 0.2);
    //mat.uniforms.setNumberArray("u_color", new Int32Array([1, 1, 0, 1]));
    let stencil = new MITOIA.GLStencil();
    stencil.func = MITOIA.GLStencilFunc.NEVER;
    //stencil.ref = 2;

    let stencil2 = new MITOIA.GLStencil();
    stencil2.func = MITOIA.GLStencilFunc.ALWAYS;
    //stencil2.ref = 2;
    
    mat.cullFace = MITOIA.GLCullFace.BACK;
    mat.depthTest = MITOIA.GLDepthTest.LESS;
    //mat.blend = new MITOIA.GLBlend();
    //mat.blend.func.setSeparate(MITOIA.GLBlendFactorValue.SRC_ALPHA, MITOIA.GLBlendFactorValue.ONE_MINUS_SRC_ALPHA, MITOIA.GLBlendFactorValue.ONE, MITOIA.GLBlendFactorValue.ONE_MINUS_SRC_ALPHA);
    //mat.stencilFront = stencil;
    //mat.stencilBack = stencil2;
    mesh.materials[0] = mat;
    mesh.enabled = false;
    mat.defines.setDefine(MITOIA.ShaderPredefined.LIGHTING, true);
    mat.defines.setDefine(MITOIA.ShaderPredefined.DIFFUSE_TEX, true);
    mat.defines.setDefine(MITOIA.ShaderPredefined.DIFFUSE_COLOR, true);
    mat.uniforms.setNumber(MITOIA.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);
    //mat.defines.setDefine(MITOIA.ShaderPredefined.SPECULAR_COLOR, true);
    //mat.uniforms.setNumber(MITOIA.ShaderPredefined.u_SpecularColor, 0.5, 0, 0);
    mat.defines.setDefine(MITOIA.ShaderPredefined.LIGHTING_SPECULAR, MITOIA.ShaderPredefined.LIGHTING_SPECULAR_BLINN_PHONE);
    /*
    mat.defines.setDefine(MITOIA.ShaderPredefined.ALPHA_TEST, true);
    mat.defines.setDefine(MITOIA.ShaderPredefined.ALPHA_TEST_FUNC, true);
    mat.defines.setDefine(MITOIA.ShaderPredefined.ALPHA_TEST_FUNC, MITOIA.ShaderPredefined.ALPHA_TEST_FUNC_GEQUAL);
    mat.uniforms.setNumber(MITOIA.ShaderPredefined.u_AlphaTestCompareValue, 0.8);
    */
    mat.drawMode = MITOIA.GLDrawMode.TRIANGLES;

    let tex = new MITOIA.GLTexture2D(gl);

    let img = new Image();
    img.src = getURL("tex1.png");
    img.onload = () => {
        var text = document.createElement("canvas");
        text.width = 512, text.height = 256;
        //对其绘制文字
        (function (g) {
            //设置文字属性
            g.textBaseline = "middle", g.textAlign = "center";
            g.font = "128px 楷体";
            //设置文字渐变
            g.fillStyle = g.createLinearGradient(0, 0, text.width, 0);
            g.fillStyle.addColorStop(0, "rgba(255,255,0,0.5)");
            g.fillStyle.addColorStop(0.5, "rgba(0,255,255,0.5)");
            g.fillStyle.addColorStop(1, "rgba(255,0,255,0.5)");
            //绘制文字
            g.fillText("噶唔热好热哇和日历了", 256, 128);
        })(text.getContext("2d"))

        //gl.context.pixelStorei(MITOIA.GL.UNPACK_FLIP_Y_WEBGL, true);
        tex.upload(0, MITOIA.GLTexInternalFormat.RGBA, MITOIA.GLTexFormat.RGBA, MITOIA.GLTexDataType.UNSIGNED_BYTE, text);
        //gl.context.pixelStorei(MITOIA.GL.UNPACK_FLIP_Y_WEBGL, false);
        mat.uniforms.setTexture(MITOIA.ShaderPredefined.s_DiffuseSampler, tex);
        mesh.enabled = true;
    }

    return mesh;
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

    let forwardRenderer = new MITOIA.ForwardRenderer();

    console.log(MITOIA.Version, gl.version, gl.versionFullInfo);

    let shaderStore = new MITOIA.ShaderStore();
    shaderStore.addLibrary(MITOIA.BuiltinShader.General.SOURCES);
    shaderStore.addLibrary(MITOIA.BuiltinShader.Lib.ALPHA_TEST_FRAG_SOURCES);
    shaderStore.addLibrary(MITOIA.BuiltinShader.Lib.LIGHTING_SOURCES);

    shaderStore.addSource("mesh", MITOIA.BuiltinShader.DefaultMesh.VERTEX, MITOIA.GLShaderType.VERTEX_SHADER);
    shaderStore.addSource("mesh", MITOIA.BuiltinShader.DefaultMesh.FRAGMENT, MITOIA.GLShaderType.FRAGMENT_SHADER);
    
    let worldNode = new MITOIA.Node();
    let model1Node = new MITOIA.Node();
    let model2Node = new MITOIA.Node();
    let cameraNode = new MITOIA.Node();
    let lightNode = new MITOIA.Node();
    worldNode.addChild(model1Node);
    worldNode.addChild(model2Node);
    worldNode.addChild(cameraNode);
    worldNode.addChild(lightNode);

    

    let t1 = MITOIA.Timer.utc;
    for (let i = 0; i < 999999; ++i) {
        //for (let c of worldNode) {}

        worldNode.foreach(()=>{})

        //let arr: MITOIA.Node[] = [];
        //worldNode.getAllChildren(arr);
        //for (let j = 0, n = arr.length; j < n; ++j) {}

        //let node = worldNode._childHead;
        //while (node) { node = node._next; }
    }
    
    let t2 = MITOIA.Timer.utc - t1;

    let light = lightNode.addComponent(new MITOIA.PointLight());
    //light.spotAngle = 8 * Math.PI / 180;
    light.color.setFromRGB(1, 1, 1);
    light.intensity = 1.0;

    let fbo = new MITOIA.GLFrameBuffer(gl, 1000, 1000);

    let depthRBO = new MITOIA.GLRenderBuffer(gl);
    depthRBO.storage(MITOIA.GLRenderBufferInternalFormat.DEPTH_COMPONENT16, fbo.width, fbo.height);

    let stencilRBO = new MITOIA.GLRenderBuffer(gl);
    stencilRBO.storage(MITOIA.GLRenderBufferInternalFormat.STENCIL_INDEX8, fbo.width, fbo.height);

    let depthAndStencilRBO = new MITOIA.GLRenderBuffer(gl);
    depthAndStencilRBO.storage(MITOIA.GLRenderBufferInternalFormat.DEPTH_STENCIL, fbo.width, fbo.height);

    let colorTex = new MITOIA.GLTexture2D(gl);
    colorTex.upload(0, MITOIA.GLTexInternalFormat.RGBA, fbo.width, fbo.height, MITOIA.GLTexFormat.RGBA, MITOIA.GLTexDataType.UNSIGNED_BYTE, <ArrayBufferView>null, 0);
    
    fbo.setAttachmentTexture2D(MITOIA.GLTex2DAttachment.COLOR_ATTACHMENT0, MITOIA.GLFrameBufferTexTarget.TEXTURE_2D, colorTex);
    //fbo.setAttachmentTexture2D(MITOIA.GLTex2DAttachment.COLOR_ATTACHMENT0, MITOIA.GLFrameBufferTexTarget.TEXTURE_2D, null);
    fbo.setAttachmentRenderBuffer(MITOIA.GLRenderBufferAttachment.DEPTH_STENCIL_ATTACHMENT, depthAndStencilRBO);
    //fbo.setAttachmentRenderBuffer(MITOIA.GLFrameBufferRenderBufferAttachment.STENCIL_ATTACHMENT, stencilRBO);

    let cam = cameraNode.addComponent(new MITOIA.Camera());
    //cam.setProjectionMatrix(MITOIA.Matrix44.createOrthoLHMatrix(engine.canvasWidth, engine.canvasHeight, 10, 10000));
    //cam.setProjectionMatrix(MITOIA.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, engine.canvasWidth / engine.canvasHeight, 1, 10000));
    cam.setProjectionMatrix(MITOIA.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, 1257 / 1308, 5, 10000));
    cam.clear.color.setFromRGBA(0.5, 0.5, 0.5, 1);
    //cam.clear.clearColor = false;
    //cam.clear.clearDepth = false;
    cam.node.setLocalPosition(0, 0, -10);
    if (fbo.checkStatus()) {
        cam.frameBuffer = fbo;
    } else {
        let a = 1;
    }

    let zz = Math.cos(Math.PI * 0.5);

    model1Node.appendLocalTranslate(0, 0, 500);
    lightNode.appendLocalTranslate(-500, 0, 0);
    lightNode.appendLocalRotation(MITOIA.Quaternion.createFromEulerY(Math.PI * 0.25));

    let mesh = createModel(model1Node, gl, shaderStore, "mesh", "mesh");
    mesh.renderer = forwardRenderer;
    //model1Node.addComponent(new MITOIA.Collider(new MITOIA.BoundingMesh(mesh.assetStore)));
    model1Node.addComponent(new MITOIA.Collider(new MITOIA.BoundingSphere(null, 100)));
   // model1Node.appendLocalRotation(MITOIA.Quaternion.createFromEulerX(Math.PI / 180));
    let hit = new MITOIA.Ray(new MITOIA.Vector3(0, 0, 490)).cast(worldNode, 0xFFFFFFFF, MITOIA.GLCullFace.NONE);

    //model1Node.appendLocalRotation(MITOIA.Quaternion.createFromEulerY(Math.PI));

    let renderingManager = new MITOIA.RenderingManager();

    let stretcher = new MITOIA.CanvasAutoStretcher(gl);

    let pp = new MITOIA.PostProcess();
    pp.material = new MITOIA.Material();
    //pp.material.cullFace = MITOIA.GLCullFace.NONE;
    pp.material.uniforms.setTexture(MITOIA.ShaderPredefined.s_Sampler, colorTex);

    let fps = new MITOIA.FPSDetector();
    fps.show();
    
    new MITOIA.Looper(16).run(() => {
        if (stretcher.execute()) {
            //cam.setProjectionMatrix(MITOIA.Matrix44.createOrthoLHMatrix(engine.canvasWidth, engine.canvasHeight, 10, 10000));
            cam.setProjectionMatrix(MITOIA.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, gl.canvas.width / gl.canvas.height, 5, 10000));
        }

        model1Node.appendLocalRotation(MITOIA.Quaternion.createFromEulerY(Math.PI / 180));
//gl.context.bindTexture(MITOIA.GL.TEXTURE_2D, null);
        renderingManager.render(gl, cam, worldNode, [light]);
        renderingManager.postProcess(gl, [pp]);
        //gl.context.flush();
        //gl.clear(null);

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