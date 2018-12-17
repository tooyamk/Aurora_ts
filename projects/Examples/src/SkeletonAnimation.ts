class SkeletonAnimation {
    private _env: Env;
    private _modelNode: Aurora.Node;

    private _anim0Clip: Aurora.SkeletonAnimationClip = null;
    private _anim1Clip: Aurora.SkeletonAnimationClip = null;
    private _anim2Clip: Aurora.SkeletonAnimationClip = null;
    
    private _animator: Aurora.Animator<Aurora.SkeletonAnimationClip> = null;

    private _time = -1;
    private _step = 0;

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
                const timeScale = 0.25;

                if (this._time >= 0) {
                    this._time += delta * timeScale;

                    if (this._time >= 3) {
                        if (this._step === 0) {
                            this._animator.setClip(this._anim1Clip, 0, 2);
                            ++this._step;
                            console.log("idle -> walk");
                        } else if (this._step === 1) {
                            this._animator.setClip(this._anim2Clip, 0, 2);
                            ++this._step;
                            console.log("walk -> run");
                        } else if (this._step === 2) {
                            this._animator.setClip(this._anim1Clip, 0, 2);
                            ++this._step;
                            console.log("run -> walk");
                        } else if (this._step === 3) {
                            this._animator.setClip(this._anim0Clip, 0, 2);
                            this._step = 0;
                            console.log("walk -> idle");
                        }
                        this._time = 0;
                    }

                    this._animator.update(delta * timeScale);
                }

                //modelNode.worldRotate(Aurora.Quaternion.createFromEulerY(0.5 * delta * Math.PI));
                env.renderingManager.render(env.gl, env.camera.value, env.world.value, [light]);
            });

        this._loadFile();
    }

    private _loadFile(): void {
        let skeData: Aurora.FbxFile.Data = null;
        let meshData: Aurora.FbxFile.Data = null;
        let anim0Data: Aurora.FbxFile.Data = null;
        let anim1Data: Aurora.FbxFile.Data = null;
        let anim2Data: Aurora.FbxFile.Data = null;
        let img: HTMLImageElement = null;

        let taskQueue = new Aurora.TaskQueue();
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                skeData = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("skinnedMeshes/2/ske.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                meshData = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("skinnedMeshes/2/mesh.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                anim0Data = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("skinnedMeshes/2/idle.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                anim1Data = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("skinnedMeshes/2/walk.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                anim2Data = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("skinnedMeshes/2/run.FBX"), true);
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

            if (anim0Data.animationClips && anim0Data.animationClips.size > 0) {
                const clip = anim0Data.animationClips.at(0);
                clip.retain();
                this._anim0Clip = clip;
                clip.wrap = Aurora.AnimationWrap.Loop;
                clip.skeleton = skeData.skeleton;
            }

            if (anim1Data.animationClips && anim1Data.animationClips.size > 0) {
                const clip = anim1Data.animationClips.at(0);
                clip.retain();
                this._anim1Clip = clip;
                clip.wrap = Aurora.AnimationWrap.Loop;
                clip.skeleton = skeData.skeleton;
            }

            if (anim2Data.animationClips && anim2Data.animationClips.size > 0) {
                const clip = anim2Data.animationClips.at(0);
                clip.retain();
                this._anim2Clip = clip;
                clip.wrap = Aurora.AnimationWrap.Loop;
                clip.skeleton = skeData.skeleton;
            }

            this._animator = new Aurora.Animator();
            this._animator.setClip(this._anim0Clip);

            if (meshData.meshes) {
                for (let m of meshData.meshes) {
                    let mesh = this._modelNode.addChild(new Aurora.Node()).addComponent(new Aurora.SkinnedMesh());
                    mesh.renderer = this._env.forwardRenderer;
                    mesh.skinningMethod = this._env.skinnedMeshGPUSkinningMethod.value;
                    mesh.asset = m;
                    mesh.setMaterials(mat);
                    mesh.skeleton = skeData.skeleton;

                    const scale = 0.8;
                    mesh.node.setLocalScale(scale, scale, scale);
                }
            }

            skeData.release();
            meshData.release();
            anim0Data.release();
            anim1Data.release();
            anim2Data.release();

            this._time = 0;
            this._step = 0;
        }));
    }
}