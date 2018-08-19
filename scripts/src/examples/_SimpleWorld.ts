class _SimpleWorld {
    constructor() {
        window.addEventListener("DOMContentLoaded", () => {
            document.oncontextmenu = () => { return false; }

            let options: MITOIA.GLOptions = {};
            options.preserveDrawingBuffer = true;
            options.depth = true;
            options.stencil = true;
            options.version = 1;
            let gl = new MITOIA.GL(<HTMLCanvasElement>document.getElementById("renderCanvas"), options);

            let shaderStore = new MITOIA.ShaderStore();
            shaderStore.addBuiltinLibraries();
            shaderStore.addBuiltinShaderSources();

            let worldNode = new MITOIA.Node();
            let modelNode = new MITOIA.Node();
            let cameraNode = new MITOIA.Node();
            let lightNode = new MITOIA.Node();
            worldNode.addChild(modelNode);
            worldNode.addChild(cameraNode);
            worldNode.addChild(lightNode);

            let light = lightNode.addComponent(new MITOIA.PointLight());
            light.setAttenuation(2500);

            let cam = cameraNode.addComponent(new MITOIA.Camera());

            modelNode.appendLocalTranslate(0, 0, 500);
            lightNode.appendLocalTranslate(-500, 0, 0);

            let forwardRenderer = new MITOIA.ForwardRenderer();

            let mat = new MITOIA.Material(shaderStore.createShader(gl, MITOIA.BuiltinShader.DefaultMesh.NAME));
            mat.defines.setDefine(MITOIA.ShaderPredefined.DIFFUSE_COLOR, true);
            mat.uniforms.setNumber(MITOIA.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);

            let renderable = modelNode.addComponent(new MITOIA.RenderableMesh());
            renderable.renderer = forwardRenderer;
            //renderable.assetStore = MITOIA.MeshBuilder.createSphere(100, 100, true, true);
            renderable.assetStore = MITOIA.MeshBuilder.createBox(100, 100, 100, 1, 1, 1, true, true);
            renderable.materials.push(mat);

            let renderingManager = new MITOIA.RenderingManager();

            let stretcher = new MITOIA.CanvasAutoStretcher(gl);

            let resetSize = () => {
                cam.setProjectionMatrix(MITOIA.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, gl.canvas.width / gl.canvas.height, 5, 10000));
            }
            resetSize();

            modelNode.appendLocalRotation(MITOIA.Quaternion.createFromEulerX(-Math.PI / 6));

            let fps = new MITOIA.FPSDetector();
            fps.show();

            new MITOIA.FrameLooper(1000 / 60).start((delta: number) => {
                if (stretcher.execute()) resetSize();

                modelNode.appendLocalRotation(MITOIA.Quaternion.createFromEulerY(0.001 * delta * Math.PI));

                renderingManager.render(gl, cam, worldNode, [light]);
                fps.record();
            });
        });
    }
}