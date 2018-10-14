class FBXNode {

}

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
            mat.uniforms.setNumber(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);

            let mesh = this._modelNode.addChild(new Aurora.Node3D()).addComponent(new Aurora.Mesh());
            mesh.renderer = this._env.forwardRenderer;
            mesh.asset = file.meshes[0];
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

            if (file.skeletons) {
                Helper.printNodeHierarchy(file.skeletons[0].rootBones);
            }


            let mat = new Aurora.Material(this._env.shaderStore.createShader(this._env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
            mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
            mat.uniforms.setNumber(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);

            let mesh = this._modelNode.addChild(new Aurora.Node3D()).addComponent(new Aurora.Mesh());
            mesh.renderer = this._env.forwardRenderer;
            mesh.asset = file.meshes[0];
            mesh.materials = [mat];

            mesh.node.setLocalScale(100, 100, 100);
        });
        request.open("GET", Helper.getURL("skinnedMesh.arr"), true);
        request.responseType = "arraybuffer";
        request.send();
    }

    private _loadFBX(): void {
        let request = new XMLHttpRequest();
        request.addEventListener("loadend", () => {
            let bytes = new Aurora.ByteArray(request.response);
            bytes.position += 23;
            let ver = bytes.readUint32();

            let root = new FBXNode();

            while (bytes.bytesAvailable > 4) {
                if (bytes.readUint32() < bytes.length) {
                    bytes.position -= 4;

                    this._parseFBXNode(bytes, root, ver);
                } else {
                    break;
                }
            }
        });
        request.open("GET", Helper.getURL("all.FBX"), true);
        request.responseType = "arraybuffer";
        request.send();
    }

    private _parseFBXNode(bytes: Aurora.ByteArray, parentNode: FBXNode, ver: number): void {
        let endOffset = ver < 7500 ? bytes.readUint32() : bytes.readUint32();
        let numProperties = bytes.readUint32();
        let propertyListLen = bytes.readUint32();
        let nameLen = bytes.readUint8();
        let name = bytes.readString(Aurora.ByteArrayStringMode.END_MARK, nameLen);
        console.log(name);

        let startPos = bytes.position;

        let node = new FBXNode();
        //

        bytes.position = startPos + propertyListLen;

        while (true) {
            if (bytes.position < endOffset) {
                this._parseFBXNode(bytes, node, ver);
            } else {
                break;
            }
        }

        let a = 1;
    }
}