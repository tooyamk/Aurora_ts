class FileTest {
    private _env: Env;
    private _modelNode: Aurora.Node;

    constructor() {
        let env = new Env();
        this._env = env;

        let modelNode = env.world.addChild(new Aurora.Node());
        let light = env.world.addChild(new Aurora.Node()).addComponent(new Aurora.PointLight());
        light.setAttenuation(12500);

        modelNode.localTranslate(0, 0, 500);
        this._modelNode = modelNode;
        light.node.localTranslate(-500, 0, 0);

        env.start(() => {
            let gl = env.gl;
            gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            env.camera.setProjectionMatrix(Aurora.Matrix44.createPerspectiveFovLH(Math.PI / 3, gl.canvas.width / gl.canvas.height, 5, 10000));
        },
        (delta: number) => {
            modelNode.worldRotate(Aurora.Quaternion.createFromEulerY(0.0005 * delta * Math.PI));
            env.renderingManager.render(env.gl, env.camera, env.world, [light]);
        });

        //this._loadMesh();
        //this._loadSkinnedMesh();
        this._loadFBX();
    }

    private _loadMesh(): void {
        let request = new XMLHttpRequest();
        request.addEventListener("loadend", () => {
            let file = Aurora.ARRFile.parse(new Aurora.ByteArray(request.response));

            let mat = new Aurora.Material(this._env.shaderStore.createShader(this._env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);

            let mesh = this._modelNode.addChild(new Aurora.Node()).addComponent(new Aurora.Mesh());
            mesh.renderer = this._env.forwardRenderer;
            mesh.asset = file.meshes[0];
            mesh.setMaterials(mat);

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

            if (file.skeletons) {
                //Helper.printNodeHierarchy(file.skeletons[0].rootBones);
            }

            let mat = new Aurora.Material(this._env.shaderStore.createShader(this._env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);

            let mesh = this._modelNode.addChild(new Aurora.Node()).addComponent(new Aurora.Mesh());
            mesh.renderer = this._env.forwardRenderer;
            mesh.asset = file.meshes[0];
            mesh.setMaterials(mat);

            mesh.node.setLocalScale(100, 100, 100);
        });
        request.open("GET", Helper.getURL("skinnedMesh.arr"), true);
        request.responseType = "arraybuffer";
        request.send();
    }

    private _loadFBX(): void {
        let data: Aurora.FBX.Data = null;
        let img: HTMLImageElement = null;

        let taskQueue = new Aurora.TaskQueue();
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                data = Aurora.FBX.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            //request.open("GET", Helper.getURL("people/model.FBX"), true);
            request.open("GET", Helper.getURL("all.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            img = new Image();
            img.onload = () => {
                task.finish();
            }
            img.src = Helper.getURL("skinPeople/tex.png");
        }));
        taskQueue.start(Aurora.Handler.create(null, () => {
            let tex = new Aurora.GLTexture2D(this._env.gl);
            tex.upload(0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, img);

            let mat = new Aurora.Material(this._env.shaderStore.createShader(this._env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            mat.cullFace = Aurora.GLCullFace.NONE;
            mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_TEX, true);
            mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);
            mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_AmbientColor, 1, 1, 1, 1);
            mat.uniforms.setTexture(Aurora.ShaderPredefined.u_DiffuseSampler, tex);

            let mesh = this._modelNode.addChild(new Aurora.Node()).addComponent(new Aurora.SkinnedMesh());
            mesh.renderer = this._env.forwardRenderer;
            mesh.asset = data.meshes[0];
            mesh.setMaterials(mat);

            Helper.printNodeHierarchy([data.skeleton.bones[data.skeleton.rootBoneIndices[0]]]);

            mesh.node.setLocalScale(30, 30, 30);
        }));
    }
}