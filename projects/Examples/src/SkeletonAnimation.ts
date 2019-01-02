class AnimData {
    public animator: Aurora.SkeletonAnimator = null;
    public walkRunClip: Aurora.SkeletonAnimationClip = null;
    public time = -1;
    public step = 0;
}

class SkeletonAnimation {
    private _env: Env;
    private _modelNode: Aurora.Node;

    private _animIdleClip: Aurora.SkeletonAnimationClip = null;
    private _animWalkClip: Aurora.SkeletonAnimationClip = null;
    private _animRunClip: Aurora.SkeletonAnimationClip = null;
    
    private _animators: AnimData[] = [];

    constructor() {
        let env = new Env();
        this._env = env;

        let modelNode = env.world.value.addChild(new Aurora.Node());
        let light = env.world.value.addChild(new Aurora.Node()).addComponent(new Aurora.DirectionLight());
        //light.setAttenuation(12500);

        modelNode.localTranslate(0, 0, 500);
        this._modelNode = modelNode;
        light.node.localTranslate(-500, 0, 0);

        env.start(() => {
            let gl = env.gl;
            gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            env.camera.value.setProjectionMatrix(Aurora.Matrix44.createPerspectiveFovLH(Math.PI / 6, gl.canvas.width / gl.canvas.height, 5, 10000));
        },
            (delta: number) => {
                //this._animControl0(delta);
                this._animControl1(delta);
                //if (this._animator) this._animator.update(delta);

                //modelNode.worldRotate(Aurora.Quaternion.createFromEulerY(0.5 * delta * Math.PI));
                env.renderingManager.render(env.gl, env.camera.value, env.world.value, [light]);
            });

        this._loadFile();
    }

    private _animControl0(delta: number): void {
        //delta = 0.01666666 * 0.25;
        const timeScale = 1;//0.25;

        for (let i = 0; i < this._animators.length; ++i) {
            let data = this._animators[i];
            if (data.time >= 0) {
                data.time += delta * timeScale;

                if (data.time >= 3) {
                    if (data.step === 0) {
                        data.animator.setClip(this._animWalkClip, 0, 2);
                        ++data.step;
                        console.log("idle -> walk");
                    } else if (data.step === 1) {
                        data.animator.setClip(this._animRunClip, this._animRunClip.duration * data.animator.time / this._animWalkClip.duration, 2);
                        ++data.step;
                        console.log("walk -> run");
                    } else if (data.step === 2) {
                        data.animator.setClip(this._animWalkClip, this._animWalkClip.duration * data.animator.time / this._animRunClip.duration, 2);
                        ++data.step;
                        console.log("run -> walk");
                    } else if (data.step === 3) {
                        data.animator.setClip(this._animIdleClip, 0, 2);
                        data.step = 0;
                        console.log("walk -> idle");
                    }
                    data.time = 0;
                }

                data.animator.update(delta * timeScale);
            }
        }
    }

    private _animControl1(delta: number): void {
        //delta = 0.01666666 * 0.25;
        const timeScale = 1;//0.25;

        for (let i = 0; i < this._animators.length; ++i) {
            let data = this._animators[i];
            if (data.time >= 0) {
                data.time += delta * timeScale;

                /*
                if (data.step === 0) {
                    if (data.time >= 3) {
                        data.animator.setClip(data.walkRunClip, 0, 2);
                        ++data.step;
                        data.time = 0;
                        //console.log("idle -> walk&run");
                    }
                } else if (data.step === 1) {
                    const max = 5;
                    if (data.time >= max) {
                        data.animator.setClip(this._animIdleClip, 0, 2);
                        data.step = 0;
                        data.time = 0;
                        //console.log("walk&run -> idle");
                    } else {
                        const t = data.time / max;
                        data.walkRunClip.setMultiClipWeight("walk", 1 - t);
                        data.walkRunClip.setMultiClipWeight("run", t);
                    }
                }
                */

                //data.animator.update(0);
            }
        }
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
            request.open("GET", Helper.getURL("skinnedMeshes/3/model.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                meshData = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("skinnedMeshes/3/model.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                anim0Data = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("skinnedMeshes/3/model.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                anim1Data = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("skinnedMeshes/3/model.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            let request = new XMLHttpRequest();
            request.addEventListener("loadend", () => {
                anim2Data = Aurora.FbxFile.parse(new Aurora.ByteArray(request.response));
                task.finish();
            });
            request.open("GET", Helper.getURL("skinnedMeshes/3/model.FBX"), true);
            request.responseType = "arraybuffer";
            request.send();
        }));
        taskQueue.createTask(Aurora.Handler.create(null, (task: Aurora.Task) => {
            img = new Image();
            img.onload = () => {
                task.finish();
            }
            img.src = Helper.getURL("skinnedMeshes/3/tex.png");
        }));
        taskQueue.start(Aurora.Handler.create(this, () => {
            let tex = new Aurora.GLTexture2D(this._env.gl);
            tex.upload(0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, img);

            let mat = new Aurora.Material(this._env.shaderStore.createShader(this._env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            //mat.cullFace = Aurora.GLCullFace.NONE;
            //mat.defines.set(Aurora.ShaderPredefined.LIGHTING, false);
            mat.defines.set(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            mat.defines.set(Aurora.ShaderPredefined.DIFFUSE_TEX, true);
            mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);
            //mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_AmbientColor, 1, 1, 1, 1);
            mat.uniforms.setTexture(Aurora.ShaderPredefined.u_DiffuseSampler, tex);

            if (anim0Data.animationClips && anim0Data.animationClips.size > 0) {
                const clip = anim0Data.animationClips.at(0);
                clip.retain();
                clip.cache(true);
                this._animIdleClip = clip;
                clip.wrap = Aurora.AnimationWrap.Loop;
            }

            if (anim1Data.animationClips && anim1Data.animationClips.size > 0) {
                const clip = anim1Data.animationClips.at(0);
                clip.retain();
                clip.cache(true);
                this._animWalkClip = clip;
                clip.wrap = Aurora.AnimationWrap.Loop;
            }

            if (anim2Data.animationClips && anim2Data.animationClips.size > 0) {
                const clip = anim2Data.animationClips.at(0);
                clip.retain();
                clip.cache(true);
                this._animRunClip = clip;
                clip.wrap = Aurora.AnimationWrap.Loop;
            }

            for (let i = 0; i < 4; ++i) {
                let ske = skeData.skeleton.clone();

                //Helper.printNodeHierarchy([ske.bonesMap.find(ske.rootBoneNames[0])]);

                let node = this._modelNode.addChild(new Aurora.Node());
                const scale = 2;
                node.setLocalScale(scale, scale, scale);

                node.setLocalPosition(-60 + 120 * Math.random(), -60 + 120 * Math.random(), -60 + 120 * Math.random());

                let data = new AnimData();
                data.time = Math.random() * 3;
                data.step = 0;

                if (this._animWalkClip && this._animRunClip) {
                    const clip = new Aurora.SkeletonAnimationClip();
                    clip.retain();
                    data.walkRunClip = clip;
                    clip.wrap = Aurora.AnimationWrap.Loop;
                    clip.setMultiClip("walk", this._animWalkClip, 1);
                    clip.setMultiClip("run", this._animRunClip, 0);
                    clip.setTimeRagne(0, this._animRunClip.duration);
                }

                let animator = new Aurora.SkeletonAnimator();
                data.animator = animator;
                this._animators[i] = data;
                animator.skeleton = ske;
                animator.setClip(this._animIdleClip);
                animator.elapsed = data.time;
                animator.update(0);

                if (meshData.meshes) {
                    for (let j = 0, n = meshData.meshes.length; j < n; ++j) {
                        let m = meshData.meshes[j];
                        let mesh = node.addChild(new Aurora.Node()).addComponent(new Aurora.SkinnedMesh());
                        mesh.renderer = this._env.forwardRenderer;
                        mesh.skinningMethod = this._env.skinnedMeshCPUSkinningMethod.value;
                        mesh.asset = m;
                        mesh.setMaterials(mat);
                        mesh.skeleton = ske;
                    }
                }
            }

            skeData.release();
            meshData.release();
            anim0Data.release();
            anim1Data.release();
            anim2Data.release();
        }));
    }
}