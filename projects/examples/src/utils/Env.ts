class Env {
    public platform: Aurora.IPlatform;
    public gl: Aurora.GL;
    public shaderStore: Aurora.ShaderStore;

    public world: Aurora.Node;
    public camera: Aurora.Camera;

    public renderingManager: Aurora.RenderingManager;
    public forwardRenderer: Aurora.ForwardRenderer;
    public spriteRenderer: Aurora.SpriteRenderer;

    constructor() {
        this.platform = new Aurora.StandardHTMLPlatform();

        let options: Aurora.GLOptions = {};
        options.preserveDrawingBuffer = true;
        options.depth = true;
        options.stencil = true;
        options.version = 1;
        this.gl = new Aurora.GL(<HTMLCanvasElement>document.getElementById("renderCanvas"), options);

        console.log(`Engine Ver : (${Aurora.Version}) Request GL Ver : (${this.gl.version}) Created GL Info : (${this.gl.versionFullInfo})`);

        this.shaderStore = new Aurora.ShaderStore();
        this.shaderStore.addBuiltinLibraries();
        this.shaderStore.addBuiltinShaderSources();

        this.world = new Aurora.Node();
        this.camera = this.world.addChild(new Aurora.Node()).addComponent(new Aurora.Camera());

        this.renderingManager = new Aurora.RenderingManager();
        this.forwardRenderer = new Aurora.ForwardRenderer();
        this.spriteRenderer = new Aurora.SpriteRenderer(this.gl);
    }

    public start(canvasSizeChangedhandler: () => void, loopHandler: (delta: number) => void): void {
        let stats = new Aurora.Stats(this.platform);
        this.gl.stats = stats;
        stats.show();

        let stretcher = new Aurora.CanvasAutoStretcher(this.gl.canvas);
        if (canvasSizeChangedhandler) canvasSizeChangedhandler();

        new Aurora.FrameLooper(this.platform, 1000 / 60).start(Aurora.Handler.create(null, (delta: number) => {
            if (stretcher.execute() && canvasSizeChangedhandler) canvasSizeChangedhandler();
            
            if (loopHandler) {
                //const t0 = this.platform.duration();
                loopHandler(delta);
                //console.log(this.platform.duration() - t0);
            }
            
            stats.update();
            stats.reset();
        }));
    }
}