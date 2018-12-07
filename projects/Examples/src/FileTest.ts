class FileTest {
    private _env: Env;
    private _modelNode: Aurora.Node;
    private _animator: Aurora.Animator<Aurora.SkeletonAnimationClip> = null;

    constructor() {
        let env = new Env();
        this._env = env;

        let modelNode = env.world.value.addChild(new Aurora.Node());
        let light = env.world.value.addChild(new Aurora.Node()).addComponent(new Aurora.PointLight());
        light.setAttenuation(12500);

        modelNode.localTranslate(0, 0, 500);
        this._modelNode = modelNode;
        light.node.localTranslate(-500, 0, 0);

        env.start(() => {
            let gl = env.gl;
            gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            env.camera.value.setProjectionMatrix(Aurora.Matrix44.createPerspectiveFovLH(Math.PI / 6, gl.canvas.width / gl.canvas.height, 5, 10000));
        },
        (delta: number) => {
            if (this._animator) this._animator.update(delta * 0.25);

            //modelNode.worldRotate(Aurora.Quaternion.createFromEulerY(0.5 * delta * Math.PI));
            env.renderingManager.render(env.gl, env.camera.value, env.world.value, [light]);
        });

        //this._loadMesh();
        //this._loadSkinnedMesh();
        this._loadFbxFile();
        //this._loadXFile();
        //this._loadXFile2();
    }

    /*
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
    */

    private equal1(v1: Aurora.Vector3, v2: Aurora.Vector3): void {
        if (!Aurora.MathUtils.isEqual(v1.x, v2.x, 0.00001)) {
            let a = 1;
        }
        if (!Aurora.MathUtils.isEqual(v1.y, v2.y, 0.00001)) {
            let a = 1;
        }
        if (!Aurora.MathUtils.isEqual(v1.z, v2.z, 0.00001)) {
            let a = 1;
        }
    }

    private equal2(v1: Aurora.Quaternion, v2: Aurora.Quaternion): void {
        if (!Aurora.MathUtils.isEqual(v1.x, v2.x, 0.00001)) {
            let a = 1;
        }
        if (!Aurora.MathUtils.isEqual(v1.y, v2.y, 0.00001)) {
            let a = 1;
        }
        if (!Aurora.MathUtils.isEqual(v1.z, v2.z, 0.00001)) {
            let a = 1;
        }
        if (!Aurora.MathUtils.isEqual(v1.w, v2.w, 0.00001)) {
            let a = 1;
        }
    }

    private _loadFbx1File(): void {
        let data1: Aurora.FbxFile.Data = null;
        let data2: Aurora.FbxFile.Data = null;

        let taskQueue = new Aurora.TaskQueue();
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                data1 = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("skinnedMeshes/0/model_upy.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                data2 = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("skinnedMeshes/0/model_upz.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.start(Aurora.Handler.create(this, () => {
            let pos1 = data1.meshes[0].getVertexSource(Aurora.ShaderPredefined.a_Position0);
            let pos2 = data2.meshes[0].getVertexSource(Aurora.ShaderPredefined.a_Position0);

            for (let i = 0, n = pos1.length; i < n; ++i) {
                if (!Aurora.MathUtils.isEqual(pos1[i], pos2[i], 0.0001)) {
                    let a = 1;
                }
            }

            let frames1 = data1.animationClips[0].frames;
            let frames2 = data2.animationClips[0].frames;
            for (let itr of frames1) {
                let name = itr[0];
                //if (name === "Bip01") continue;
                let arr1 = itr[1];
                let arr2 = frames2.get(name);
                for (let i = 0, n = arr1.length; i < n; ++i) {
                    let f1 = arr1[i];
                    let f2 = arr2[i];
                    this.equal1(f1.translation, f2.translation);
                    this.equal1(f1.scale, f2.scale);
                    this.equal2(f1.rotation, f2.rotation);
                }
            }
        }));
    }

    private _loadFbxFile(): void {
        let data: Aurora.FbxFile.Data = null;
        let img: HTMLImageElement = null;

        let taskQueue = new Aurora.TaskQueue();
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                data = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            //request.open("GET", Helper.getURL("people/model.FBX"), true);
            request.open("GET", Helper.getURL("skinnedMeshes/0/model.FBX"), true);
            //request.open("GET", Helper.getURL("all.FBX"), true);
            //request.open("GET", Helper.getURL("box_anim_upz.FBX"), true);
            //request.open("GET", Helper.getURL("box_anim_upy.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            img = new Image();
            img.onload = () => {
                task.finish();
            }
            img.src = Helper.getURL("skinnedMeshes/0/tex.png");
        }));
        taskQueue.start(Aurora.Handler.create(this, () => {
            let tex = new Aurora.GLTexture2D(this._env.gl);
            tex.upload(0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, img);

            let mat = new Aurora.Material(this._env.shaderStore.createShader(this._env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            mat.cullFace = Aurora.GLCullFace.NONE;
            mat.defines.set(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            //mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_TEX, true);
            mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);
            //mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_AmbientColor, 1, 1, 1, 1);
            mat.uniforms.setTexture(Aurora.ShaderPredefined.u_DiffuseSampler, tex);

            if (data.animationClips && data.animationClips.size > 0) {
                const clip = data.animationClips.at(0);
                clip.wrap = Aurora.AnimationWrap.Loop;
                clip.skeleton = data.skeleton;

                this._animator = new Aurora.Animator();
                this._animator.setClip(clip);
            }

            if (data.meshes) {
                for (let m of data.meshes) {
                    /*
                    if (m.name === "对象01") continue;
                    if (m.name === "对象02") continue;
                    if (m.name === "对象03") continue;
                    if (m.name === "对象04") continue;
                    if (m.name === "对象05") continue;
                    if (m.name === "对象06") continue;
                    if (m.name === "对象07") continue;
                    if (m.name === "对象08") continue;
                    if (m.name === "对象09") continue;
                    if (m.name.indexOf("cp002") >= 0) continue;
                    if (m.name.indexOf("ref") >= 0) continue;
                    if (m.name.indexOf("Eye_r_new") >= 0) continue;
                    //if (m.name.indexOf("Matuge_Main") >= 0) continue;
                    */
                    //if (m.name === "对象001") continue;
                    //if (m.name === "对象003") continue;
                    //if (m.name === "对象014") continue;
                    //if (m.name === "对象079") continue;
                    //if (m.name === "对象080") continue;
                    console.log(m.name);
                    let mesh = this._modelNode.addChild(new Aurora.Node()).addComponent(new Aurora.SkinnedMesh());
                    mesh.renderer = this._env.forwardRenderer;
                    mesh.skinningMethod = this._env.skinnedMeshGPUSkinningMethod.value;
                    mesh.asset = m;
                    //mesh.asset.drawIndexSource.offset = 18;
                    //mesh.asset.drawIndexSource.length = 6;
                    mesh.setMaterials(mat);
                    mesh.skeleton = data.skeleton;

                    //if (data0.skeleton) Helper.printNodeHierarchy([data0.skeleton.bones.get(data0.skeleton.rootBoneNames[0])]);

                    const scale = 10;
                    mesh.node.setLocalScale(scale, scale, scale);
                }
            }

            //this._modelNode.localRotate(Aurora.Quaternion.createFromEulerY(-0.5 * Math.PI));
        }));
    }

    private _loadXFile(): void {
        let data: Aurora.XFile.Data = null;
        let img: HTMLImageElement = null;

        let taskQueue = new Aurora.TaskQueue();
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                data = Aurora.XFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            //request.open("GET", Helper.getURL("box1_bin_mat.X"), true);
            request.open("GET", Helper.getURL("skinnedMeshes/0/model.X"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            img = new Image();
            img.onload = () => {
                task.finish();
            }
            img.src = Helper.getURL("skinnedMeshes/0/tex.png");
        }));
        taskQueue.start(Aurora.Handler.create(this, () => {
            let tex = new Aurora.GLTexture2D(this._env.gl);
            tex.upload(0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, img);

            let mat = new Aurora.Material(this._env.shaderStore.createShader(this._env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            mat.cullFace = Aurora.GLCullFace.NONE;
            mat.defines.set(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            //mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_TEX, true);
            mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);
            //mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_AmbientColor, 1, 1, 1, 1);
            mat.uniforms.setTexture(Aurora.ShaderPredefined.u_DiffuseSampler, tex);

            if (data.animationClips && data.animationClips.size > 0) {
                const clip = data.animationClips.at(0);
                clip.wrap = Aurora.AnimationWrap.Loop;
                clip.skeleton = data.skeleton;

                this._animator = new Aurora.Animator();
                this._animator.setClip(clip);
            }

            let mesh = this._modelNode.addChild(new Aurora.Node()).addComponent(new Aurora.SkinnedMesh());
            mesh.renderer = this._env.forwardRenderer;
            mesh.skinningMethod = this._env.skinnedMeshCPUSkinningMethod.value;
            mesh.asset = data.meshes[0];
            //mesh.asset.drawIndexSource.offset = 18;
            //mesh.asset.drawIndexSource.length = 6;
            mesh.setMaterials(mat);
            mesh.skeleton = data.skeleton;

            //if (data.skeleton) Helper.printNodeHierarchy([data.skeleton.bones.get(data.skeleton.rootBoneNames[0])]);

            const scale = 10;
            mesh.node.setLocalScale(scale, scale, scale);
        }));
    }

    private _loadXFile2(): void {
        let data0: Aurora.XFile.Data = null;
        let data1: Aurora.XFile.Data = null;
        let img: HTMLImageElement = null;

        let taskQueue = new Aurora.TaskQueue();
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                data0 = Aurora.XFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            //request.open("GET", Helper.getURL("box1_bin_mat.X"), true);
            request.open("GET", Helper.getURL("skinnedMeshes/1/skeleton.X"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                data1 = Aurora.XFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            //request.open("GET", Helper.getURL("box1_bin_mat.X"), true);
            request.open("GET", Helper.getURL("skinnedMeshes/1/mesh.X"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        /*
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            img = new Image();
            img.onload = () => {
                task.finish();
            }
            img.src = Helper.getURL("skinnedMeshes/0/tex.png");
        }));
        */
        taskQueue.start(Aurora.Handler.create(this, () => {
            //let tex = new Aurora.GLTexture2D(this._env.gl);
            //tex.upload(0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, img);

            let mat = new Aurora.Material(this._env.shaderStore.createShader(this._env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            mat.cullFace = Aurora.GLCullFace.NONE;
            mat.defines.set(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            //mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_TEX, true);
            mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);
            //mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_AmbientColor, 1, 1, 1, 1);
            //mat.uniforms.setTexture(Aurora.ShaderPredefined.u_DiffuseSampler, tex);

            if (data0.animationClips && data0.animationClips.size > 0) {
                const clip = data0.animationClips.at(0);
                clip.wrap = Aurora.AnimationWrap.Loop;
                clip.skeleton = data0.skeleton;

                this._animator = new Aurora.Animator();
                this._animator.setClip(clip);
                // this._animator.elapsed = 0.9;
            }

            if (data1.meshes) {
                for (let m of data1.meshes) {
                    let mesh = this._modelNode.addChild(new Aurora.Node()).addComponent(new Aurora.SkinnedMesh());
                    mesh.renderer = this._env.forwardRenderer;
                    mesh.skinningMethod = this._env.skinnedMeshCPUSkinningMethod.value;
                    mesh.asset = m;
                    //mesh.asset.drawIndexSource.offset = 18;
                    //mesh.asset.drawIndexSource.length = 6;
                    mesh.setMaterials(mat);
                    mesh.skeleton = data0.skeleton;

                    //if (data0.skeleton) Helper.printNodeHierarchy([data0.skeleton.bones.get(data0.skeleton.rootBoneNames[0])]);

                    const scale = 0.5;
                    mesh.node.setLocalScale(scale, scale, scale);
                }
            }
        }));
    }
}