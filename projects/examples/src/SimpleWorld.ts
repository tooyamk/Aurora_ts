class SimpleWorld {
    constructor() {
        let platform = new Aurora.StandardHTMLPlatform();

        let options: Aurora.GLOptions = {};
        options.preserveDrawingBuffer = true;
        options.depth = true;
        options.stencil = true;
        options.version = 1;
        let gl = new Aurora.GL(<HTMLCanvasElement>document.getElementById("renderCanvas"), options);

        let shaderStore = new Aurora.ShaderStore();
        shaderStore.addBuiltinLibraries();
        shaderStore.addBuiltinShaderSources();

        let worldNode = new Aurora.Node3D();
        let modelNode = new Aurora.Node3D();
        let cameraNode = new Aurora.Node3D();
        let lightNode = new Aurora.Node3D();
        worldNode.addChild(modelNode);
        worldNode.addChild(cameraNode);
        worldNode.addChild(lightNode);

        let light = lightNode.addComponent(new Aurora.PointLight());
        light.setAttenuation(2500);

        let cam = cameraNode.addComponent(new Aurora.Camera());
        cam.clear.color.setFromNumbers(0, 0, 0, 1);

        modelNode.localTranslate(0, 0, 500);
        lightNode.localTranslate(-500, 0, 0);

        let forwardRenderer = new Aurora.ForwardRenderer();

        let mat = new Aurora.Material(shaderStore.createShader(gl, Aurora.BuiltinShader.DefaultMesh.NAME));
        mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
        mat.uniforms.setNumber(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);

        let renderable = modelNode.addComponent(new Aurora.RenderableMesh());
        renderable.renderer = forwardRenderer;
        //renderable.assetStore = MITOIA.MeshBuilder.createSphere(100, 100, true, true);
        renderable.assetStore = Aurora.MeshBuilder.createBox(100, 100, 100, 1, 1, 1, true, true);
        renderable.materials = [mat];

        let renderingManager = new Aurora.RenderingManager();

        let stretcher = new Aurora.CanvasAutoStretcher(gl.canvas);

        let resetSize = () => {
            //cam.viewport.set(0, 0, 300, 300);
            //gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            cam.setProjectionMatrix(Aurora.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, cam.viewport.width / cam.viewport.height, 5, 10000));
        }
        resetSize();

        modelNode.localRotate(Aurora.Quaternion.createFromEulerX(-Math.PI / 6));

        let stats = new Aurora.Stats(platform, gl);
        stats.show();

        new Aurora.FrameLooper(platform, 1000 / 60).start((delta: number) => {
            if (stretcher.execute()) resetSize();

            modelNode.worldRotate(Aurora.Quaternion.createFromEulerY(0.001 * delta * Math.PI));

            renderingManager.render(gl, cam, worldNode, [light]);
            stats.update();
            gl.resetStats();
        });
    }
}