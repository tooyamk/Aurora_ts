class ARRFileTest {
    private _env: Env;
    private _modelNode: Aurora.Node3D;

    constructor() {
        let env = new Env();
        this._env = env;

        let modelNode = env.world.addChild(new Aurora.Node3D());
        let light = env.world.addChild(new Aurora.Node3D()).addComponent(new Aurora.PointLight());
        light.setAttenuation(2500);

        modelNode.localTranslate(0, 0, 500);
        this._modelNode = modelNode;
        light.node.localTranslate(-500, 0, 0);

        env.start(() => {
            let gl = env.gl;
            gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            env.camera.setProjectionMatrix(Aurora.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, gl.canvas.width / gl.canvas.height, 5, 10000));
        },
        (delta: number) => {
            modelNode.worldRotate(Aurora.Quaternion.createFromEulerY(0.001 * delta * Math.PI));
            env.renderingManager.render(env.gl, env.camera, env.world, [light]);
        });

        Helper.printNodeHierarchy([env.world]);

        //this._loadMesh();
        this._loadSkinnedMesh();
    }

    private _loadMesh(): void {
        let request = new XMLHttpRequest();
        request.addEventListener("loadend", () => {
            let file = Aurora.ARRFile.parse(new Aurora.ByteArray(request.response));

            let mat = new Aurora.Material(this._env.shaderStore.createShader(this._env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            mat.uniforms.setNumber(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);

            let mesh = this._modelNode.addChild(new Aurora.Node3D()).addComponent(new Aurora.Mesh());
            mesh.renderer = this._env.forwardRenderer;
            mesh.assets = file.meshes[0];
            mesh.materials = [mat];

            mesh.node.setLocalScale(100, 100, 100);
        });
        request.open("GET", Helper.getURL("mesh.arr"), true);
        request.responseType = "arraybuffer";
        request.send();
    }

    private _loadSkinnedMesh(): void {
        let request = new XMLHttpRequest();
        request.addEventListener("loadend", () => {
            let file = Aurora.ARRFile.parse(new Aurora.ByteArray(request.response));

            let mat = new Aurora.Material(this._env.shaderStore.createShader(this._env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            mat.uniforms.setNumber(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);

            let mesh = this._modelNode.addChild(new Aurora.Node3D()).addComponent(new Aurora.Mesh());
            mesh.renderer = this._env.forwardRenderer;
            mesh.assets = file.meshes[0];
            mesh.materials = [mat];

            mesh.node.setLocalScale(100, 100, 100);
        });
        request.open("GET", Helper.getURL("skinnedMesh.arr"), true);
        request.responseType = "arraybuffer";
        request.send();
    }
}