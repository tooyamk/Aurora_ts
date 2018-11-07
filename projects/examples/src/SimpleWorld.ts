class SimpleWorld {
    constructor() {
        let env = new Env();

        let modelNode = env.world.addChild(new Aurora.Node());
        let light = env.world.addChild(new Aurora.Node()).addComponent(new Aurora.PointLight());
        light.setAttenuation(2500);

        modelNode.localTranslate(0, 0, 500);
        light.node.localTranslate(-500, 0, 0);

        modelNode.addComponent(this._createModel2(env));
        modelNode.localRotate(Aurora.Quaternion.createFromEulerX(-Math.PI / 6));

        env.start(() => {
            let gl = env.gl;
            gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            env.camera.setProjectionMatrix(Aurora.Matrix44.createPerspectiveFovLH(Math.PI / 3, gl.canvas.width / gl.canvas.height, 5, 10000));
        },
        (delta: number) => {
            //modelNode.worldRotate(Aurora.Quaternion.createFromEulerY(0.001 * delta * Math.PI));
            env.renderingManager.render(env.gl, env.camera, env.world, [light]);
        });
    }

    private _createModel(env: Env): Aurora.Mesh {
        let mat = new Aurora.Material(env.shaderStore.createShader(env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
        mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
        mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);

        let mesh = new Aurora.Mesh();
        mesh.renderer = env.forwardRenderer;
        //renderable.asset = MITOIA.MeshBuilder.createSphere(100, 100, true, true);
        mesh.asset = Aurora.MeshBuilder.createBox(100, 100, 100, 1, 1, 1, true, true);
        mesh.materials = [mat];

        return mesh;
    }

    private _createModel2(env: Env): Aurora.Mesh {
        //let ss = env.shaderStore.getShaderSource(Aurora.BuiltinShader.DefaultMesh.NAME, Aurora.GLShaderType.VERTEX_SHADER);
        //console.log(ss.source);

        let mat = new Aurora.Material(env.shaderStore.createShader(env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
        mat.defines.setDefine(Aurora.ShaderPredefined.LIGHTING, false);
        mat.defines.setDefine(Aurora.ShaderPredefined.VERTEX_COLOR, true);

        let mesh = new Aurora.Mesh();
        mesh.renderer = env.forwardRenderer;

        let asset = new Aurora.MeshAsset();
        asset.vertexBuffers = new Map();

        let w = 100, h = 200;

        let vertices = new Aurora.GLVertexBuffer(env.gl);
        vertices.allocate(12, Aurora.GLVertexBufferSize.THREE, Aurora.GLVertexBufferDataType.FLOAT, false, Aurora.GLUsageType.STATIC_DRAW);
        vertices.uploadSub([-w, h, 0, w, h, 0, w, -h, 0, -w, -h, 0]);
        asset.vertexBuffers.set(Aurora.ShaderPredefined.a_Position0, vertices);

        let colors = new Aurora.GLVertexBuffer(env.gl);
        colors.allocate(10, Aurora.GLVertexBufferSize.FOUR, Aurora.GLVertexBufferDataType.FLOAT, false, Aurora.GLUsageType.STATIC_DRAW);
        colors.allocate(16, Aurora.GLVertexBufferSize.FOUR, Aurora.GLVertexBufferDataType.FLOAT, false, Aurora.GLUsageType.STATIC_DRAW);
        colors.uploadSub([
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1]);
        colors.uploadSub([
            0], 20);
        asset.vertexBuffers.set(Aurora.ShaderPredefined.a_Color0, colors);

        let indices = new Aurora.GLIndexBuffer(env.gl);
        indices.allocate(6, Aurora.GLIndexDataType.UNSIGNED_BYTE, Aurora.GLUsageType.STATIC_DRAW);
        indices.uploadSub([0, 1, 2, 0, 2, 3]);
        asset.drawIndexBuffer = indices;

        mesh.asset = asset;
        mesh.materials = [mat];

        return mesh;
    }
}