class _SimpleWorld {
    constructor() {
        window.addEventListener("DOMContentLoaded", () => {
            document.oncontextmenu = () => { return false; }

            let options: Aurora.GLOptions = {};
            options.preserveDrawingBuffer = true;
            options.depth = true;
            options.stencil = true;
            options.version = 1;
            let gl = new Aurora.GL(<HTMLCanvasElement>document.getElementById("renderCanvas"), options);

            let shaderStore = new Aurora.ShaderStore();
            shaderStore.addBuiltinLibraries();
            shaderStore.addBuiltinShaderSources();

            let worldNode = new Aurora.Node();
            let modelNode = new Aurora.Node();
            let cameraNode = new Aurora.Node();
            let lightNode = new Aurora.Node();
            worldNode.addChild(modelNode);
            worldNode.addChild(cameraNode);
            worldNode.addChild(lightNode);

            let light = lightNode.addComponent(new Aurora.PointLight());
            light.setAttenuation(2500);

            let cam = cameraNode.addComponent(new Aurora.Camera());

            modelNode.appendLocalTranslate(0, 0, 500);
            lightNode.appendLocalTranslate(-500, 0, 0);

            let forwardRenderer = new Aurora.ForwardRenderer();

            let mat = new Aurora.Material(shaderStore.createShader(gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            mat.uniforms.setNumber(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);

            let renderable = modelNode.addComponent(new Aurora.RenderableMesh());
            renderable.renderer = forwardRenderer;
            //renderable.assetStore = MITOIA.MeshBuilder.createSphere(100, 100, true, true);
            renderable.assetStore = Aurora.MeshBuilder.createBox(100, 100, 100, 1, 1, 1, true, true);
            renderable.materials.push(mat);

            let renderingManager = new Aurora.RenderingManager();

            let stretcher = new Aurora.CanvasAutoStretcher(gl);

            let resetSize = () => {
                cam.setProjectionMatrix(Aurora.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, gl.canvas.width / gl.canvas.height, 5, 10000));
            }
            resetSize();

            modelNode.appendLocalRotation(Aurora.Quaternion.createFromEulerX(-Math.PI / 6));

            let fps = new Aurora.FPSDetector();
            fps.show();

            new Aurora.FrameLooper(1000 / 60).start((delta: number) => {
                if (stretcher.execute()) resetSize();

                modelNode.appendLocalRotation(Aurora.Quaternion.createFromEulerY(0.001 * delta * Math.PI));

                renderingManager.render(gl, cam, worldNode, [light]);
                fps.record();
            });
        });
    }
}