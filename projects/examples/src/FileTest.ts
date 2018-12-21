class FileTest {
    private _env: Env;
    private _modelNode: Aurora.Node;
    private _animator: Aurora.SkeletonAnimator = null;

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
        this._loadFbxFile1();
        //this._loadFbxFile2();
        //this._loadXFile();
        //this._loadXFile2();
        //this._loadXFile3();
    }

    private _loadFbxFile1(): void {
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

                this._animator = new Aurora.SkeletonAnimator();
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
                    //console.log(m.name);
                    let mesh = this._modelNode.addChild(new Aurora.Node()).addComponent(new Aurora.SkinnedMesh());
                    mesh.renderer = this._env.forwardRenderer;
                    mesh.skinningMethod = this._env.skinnedMeshCPUSkinningMethod.value;
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

    private _loadFbxFile2(): void {
        let data: Aurora.FbxFile.Data = null;
        let diffImg: HTMLImageElement = null;
        let nrmImg: HTMLImageElement = null;

        let taskQueue = new Aurora.TaskQueue();
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                data = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("staticMeshes/1/model.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            diffImg = new Image();
            diffImg.onload = () => {
                task.finish();
            }
            diffImg.src = Helper.getURL("staticMeshes/1/tex.png");
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            nrmImg = new Image();
            nrmImg.onload = () => {
                task.finish();
            }
            nrmImg.src = Helper.getURL("staticMeshes/1/normal.jpg");
        }));
        taskQueue.start(Aurora.Handler.create(this, () => {
            let diffTex = new Aurora.GLTexture2D(this._env.gl);
            diffTex.upload(0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, diffImg);

            let nrmTex = new Aurora.GLTexture2D(this._env.gl);
            nrmTex.upload(0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, nrmImg);

            let mat = new Aurora.Material(this._env.shaderStore.createShader(this._env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            mat.cullFace = Aurora.GLCullFace.NONE;
            mat.defines.set(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            mat.defines.set(Aurora.ShaderPredefined.DIFFUSE_TEX, true);
            mat.defines.set(Aurora.ShaderPredefined.NORMAL_TEX, true);
            mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);
            //mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_AmbientColor, 1, 1, 1, 1);
            mat.uniforms.setTexture(Aurora.ShaderPredefined.u_DiffuseSampler, diffTex);
            mat.uniforms.setTexture(Aurora.ShaderPredefined.u_NormalSampler, nrmTex);

            if (data.animationClips && data.animationClips.size > 0) {
                const clip = data.animationClips.at(0);
                clip.wrap = Aurora.AnimationWrap.Loop;

                this._animator = new Aurora.SkeletonAnimator();
                this._animator.setClip(clip);
            }

            if (data.meshes) {
                for (let m of data.meshes) {
                    let mesh = this._modelNode.addChild(new Aurora.Node()).addComponent(new Aurora.SkinnedMesh());
                    mesh.renderer = this._env.forwardRenderer;
                    mesh.skinningMethod = this._env.skinnedMeshCPUSkinningMethod.value;
                    mesh.asset = m;
                    mesh.setMaterials(mat);
                    //mesh.skeleton = data.skeleton;

                    const scale = 1;
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

                this._animator = new Aurora.SkeletonAnimator();
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

                this._animator = new Aurora.SkeletonAnimator();
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

    private _loadXFile3(): void {
        let data: Aurora.XFile.Data = null;
        let diffImg: HTMLImageElement = null;
        let nrmImg: HTMLImageElement = null;

        let taskQueue = new Aurora.TaskQueue();
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                data = Aurora.XFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("staticMeshes/1/model.X"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            diffImg = new Image();
            diffImg.onload = () => {
                task.finish();
            }
            diffImg.src = Helper.getURL("staticMeshes/1/tex.png");
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            nrmImg = new Image();
            nrmImg.onload = () => {
                task.finish();
            }
            nrmImg.src = Helper.getURL("staticMeshes/1/normal.jpg");
        }));
        taskQueue.start(Aurora.Handler.create(this, () => {
            let diffTex = new Aurora.GLTexture2D(this._env.gl);
            diffTex.upload(0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, diffImg);

            let nrmTex = new Aurora.GLTexture2D(this._env.gl);
            nrmTex.upload(0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, nrmImg);

            let mat = new Aurora.Material(this._env.shaderStore.createShader(this._env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            mat.cullFace = Aurora.GLCullFace.NONE;
            mat.defines.set(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            mat.defines.set(Aurora.ShaderPredefined.DIFFUSE_TEX, true);
            mat.defines.set(Aurora.ShaderPredefined.NORMAL_TEX, true);
            mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);
            //mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_AmbientColor, 1, 1, 1, 1);
            mat.uniforms.setTexture(Aurora.ShaderPredefined.u_DiffuseSampler, diffTex);
            mat.uniforms.setTexture(Aurora.ShaderPredefined.u_NormalSampler, nrmTex);

            if (data.animationClips && data.animationClips.size > 0) {
                const clip = data.animationClips.at(0);
                clip.wrap = Aurora.AnimationWrap.Loop;

                this._animator = new Aurora.SkeletonAnimator();
                this._animator.setClip(clip);
            }

            if (data.meshes) {
                for (let m of data.meshes) {
                    let mesh = this._modelNode.addChild(new Aurora.Node()).addComponent(new Aurora.SkinnedMesh());
                    mesh.renderer = this._env.forwardRenderer;
                    mesh.skinningMethod = this._env.skinnedMeshCPUSkinningMethod.value;
                    mesh.asset = m;
                    mesh.setMaterials(mat);
                    //mesh.skeleton = data.skeleton;

                    const scale = 1;
                    mesh.node.setLocalScale(scale, scale, scale);
                }
            }

            //this._modelNode.localRotate(Aurora.Quaternion.createFromEulerY(-0.5 * Math.PI));
        }));
    }
}