class SpriteAtlasTest {
    private _env: Env;

    constructor() {
        let env = new Env();
        this._env = env;
        //env.world.setColor(new Aurora.Color4(0, 1, 0, 0));
        //env.camera.clear.color.setFromNumbers(1, 0, 0, 1);

        env.start(() => {
            let gl = env.gl;
            gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            env.camera.setProjectionMatrix(Aurora.Matrix44.createOrthoLH(gl.canvas.width, gl.canvas.height, 5, 10000));
        },
        (delta: number) => {
            env.renderingManager.render(env.gl, env.camera, env.world, null);
        });

        Aurora.Node.AbstractComponent;

        this._createSprites();
    }

    private _createSprites(): void {
        let atlas = new Aurora.SpriteAtlas();

        let request = new XMLHttpRequest();
        request.addEventListener("loadend", () => {
            let img = new Image();
            img.onload = () => {
                let tex = new Aurora.GLTexture2D(this._env.gl);
                tex.upload(0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, img);
                atlas.parse(JSON.parse(request.responseText), tex);

                let s = new Aurora.Node().addComponent(new Aurora.Sprite());
                s.frame = atlas.getFrame("equipment_bg");
                s.meshMaker = new Aurora.Grid9SpriteMeshMaker(10, 10, 10, 10);
                s.width = 800;
                s.height = 600;
                s.renderer = this._env.spriteRenderer;
                s.node.localTranslate(0, 0, 100);
                this._env.camera.node.addChild(s.node);
            };
            img.src = "res/atlas/tex.png";
        });
        request.open("GET", "res/atlas/atlas.json", true);
        //request.responseType = "arraybuffer";
        request.send();
    }
}