class SpriteAtlasTest {
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

        let renderingManager = new Aurora.RenderingManager();

        let stretcher = new Aurora.CanvasAutoStretcher(gl.canvas);

        let resetSize = () => {
            //gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            cam.setProjectionMatrix(Aurora.Matrix44.createOrthoLHMatrix(cam.viewport.width, cam.viewport.height, 5, 10000));
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

        this._createSprites(gl, cam);
    }

    private _createSprites(gl: Aurora.GL, cam: Aurora.Camera): void {
        let atlas = new Aurora.SpriteAtlas();

        let request = new XMLHttpRequest();
        request.addEventListener("loadend", () => {
            let img = new Image();
            img.onload = () => {
                let tex = new Aurora.GLTexture2D(gl);
                tex.upload(0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, img);
                atlas.parse("", JSON.parse(request.responseText), tex);

                let s = new Aurora.Sprite();
                s.frame = atlas.getFrame("discharge");
            };
            img.src = "res/atlas/tex.png";
        });
        request.open("GET", "res/atlas/atlas.json", true);
        //request.responseType = "arraybuffer";
        request.send();
    }
}