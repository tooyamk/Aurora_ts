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

    assetStore = MITOIA.Geometries.createSphere(100, 10, true);
    assetStore.addVertexSource(MITOIA.MeshAssetHelper.createLerpNormals(assetStore.drawIndexSource.data, assetStore.vertexSources.get(MITOIA.ShaderPredefined.a_Position).data));

    let mesh = node.addComponent(new MITOIA.RenderableMesh());
    mesh.assetStore = assetStore;

    let mat = new MITOIA.Material(new MITOIA.Shader(gl, shaderStore.getShaderSource(vert, MITOIA.GLShaderType.VERTEX_SHADER), shaderStore.getShaderSource(frag, MITOIA.GLShaderType.FRAGMENT_SHADER)));
    //mat.uniforms.setFloat("u_color", -0.1, 1, 0, 0.2);
    //mat.uniforms.setNumberArray("u_color", new Int32Array([1, 1, 0, 1]));
    let stencil = new MITOIA.GLStencil();
    stencil.func = MITOIA.GLStencilFunc.NEVER;
    //stencil.ref = 2;

    let stencil2 = new MITOIA.GLStencil();
    stencil2.func = MITOIA.GLStencilFunc.ALWAYS;
    //stencil2.ref = 2;
    
    mat.cullFace = MITOIA.GLCullFace.NONE;
    mat.depthTest = MITOIA.GLDepthTest.LESS;
    //mat.blend = new MITOIA.GLBlend();
    //mat.blend.func.setSeparate(MITOIA.GLBlendFactorValue.SRC_ALPHA, MITOIA.GLBlendFactorValue.ONE_MINUS_SRC_ALPHA, MITOIA.GLBlendFactorValue.ONE, MITOIA.GLBlendFactorValue.ONE_MINUS_SRC_ALPHA);
    //mat.stencilFront = stencil;
    //mat.stencilBack = stencil2;
    mesh.materials[0] = mat;
    mesh.enabled = false;
    mat.defines.setDefine(MITOIA.ShaderPredefined.DIFFUSE_TEX, true);
    mat.defines.setDefine(MITOIA.ShaderPredefined.DIFFUSE_COLOR, true);
    //mat.defines.setDefine(MITOIA.ShaderPredefined.ALPHA_TEST, true);
    mat.defines.setDefine(MITOIA.ShaderPredefined.ALPHA_TEST_FUNC, true);
    mat.defines.setDefine(MITOIA.ShaderPredefined.ALPHA_TEST_FUNC, MITOIA.ShaderPredefined.ALPHA_TEST_FUNC_GEQUAL);
    mat.uniforms.setNumber(MITOIA.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);
    mat.uniforms.setNumber(MITOIA.ShaderPredefined.u_AlphaTestCompareValue, 0.8);
    mat.drawMode = MITOIA.GLDrawMode.LINE_LOOP;

    let tex = new MITOIA.GLTexture2D(gl);

    let img = new Image();
    img.src = getURL("tex1.png");
    img.onload = () => {
        gl.context.pixelStorei(MITOIA.GL.UNPACK_FLIP_Y_WEBGL, true);
        tex.upload(0, MITOIA.GLTexInternalFormat.RGBA, MITOIA.GLTexFormat.RGBA, MITOIA.GLTexDataType.UNSIGNED_BYTE, img);
        gl.context.pixelStorei(MITOIA.GL.UNPACK_FLIP_Y_WEBGL, false);
        mat.uniforms.setTexture(MITOIA.ShaderPredefined.s_DiffuseSampler, tex);
        mesh.enabled = true;
    }
}

window.addEventListener("DOMContentLoaded", () => {
    document.oncontextmenu = () => {
        return false;
    }

    let n: number = -1.6;
    n |= 0;


    let quat = new MITOIA.Quaternion();
    quat.append(MITOIA.Quaternion.createFromEulerX(Math.PI * 0.25));
    //quat.append(MITOIA.Quaternion.createFromEulerZ(Math.PI * 0.25));
    let p1 = quat.rotateXYZ(0, 1, 0);

    let canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
    let options: MITOIA.GLOptions = {};
    options.preserveDrawingBuffer = true;
    options.depth = true;
    options.stencil = true;
    options.version = 1;
    let gl = new MITOIA.GL(canvas, options);

    console.log(MITOIA.Version, gl.version, gl.versionFullInfo);

    let shaderStore = new MITOIA.ShaderStore();
    shaderStore.addLibrary(MITOIA.BuiltinShader.Lib.ALPHA_TEST_SOURCES);

    shaderStore.addSource("mesh", MITOIA.BuiltinShader.Mesh.VERTEX, MITOIA.GLShaderType.VERTEX_SHADER);
    shaderStore.addSource("mesh", MITOIA.BuiltinShader.Mesh.FRAGMENT, MITOIA.GLShaderType.FRAGMENT_SHADER);
    
    let worldNode = new MITOIA.Node();
    let model1Node = new MITOIA.Node();
    let model2Node = new MITOIA.Node();
    let cameraNode = new MITOIA.Node();
    model1Node.setParent(worldNode);
    model2Node.setParent(worldNode);
    cameraNode.setParent(worldNode);

    let fbo = new MITOIA.GLFrameBuffer(gl, 500, 500);

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

    model1Node.appendLocalTranslate(0, 0, 500);

    createModel(model1Node, gl, shaderStore, "mesh", "mesh");

    model1Node.appendLocalRotation(MITOIA.Quaternion.createFromEulerY(Math.PI));

    let forwardRenderer = new MITOIA.ForwardRenderer();
    let postProcessRenderer = new MITOIA.PostProcessRenderer();

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
        forwardRenderer.render(gl, cam, worldNode);
        postProcessRenderer.render(gl, [pp]);
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