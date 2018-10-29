class SimpleWorld {
    constructor() {
        let env = new Env();

        let modelNode = env.world.addChild(new Aurora.Node());
        let light = env.world.addChild(new Aurora.Node()).addComponent(new Aurora.PointLight());
        light.setAttenuation(2500);

        modelNode.localTranslate(0, 0, 500);
        light.node.localTranslate(-500, 0, 0);

        let mat = new Aurora.Material(env.shaderStore.createShader(env.gl, Aurora.BuiltinShader.DefaultMesh.NAME));
        mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
        mat.uniforms.setNumbers(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1);

        let mesh = modelNode.addComponent(new Aurora.Mesh());
        mesh.renderer = env.forwardRenderer;
        //renderable.asset = MITOIA.MeshBuilder.createSphere(100, 100, true, true);
        mesh.asset = Aurora.MeshBuilder.createBox(100, 100, 100, 1, 1, 1, true, true);
        mesh.materials = [mat];

        modelNode.localRotate(Aurora.Quaternion.createFromEulerX(-Math.PI / 6));

        env.start(() => {
            let gl = env.gl;
            gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            env.camera.setProjectionMatrix(Aurora.Matrix44.createPerspectiveFovLH(Math.PI / 3, gl.canvas.width / gl.canvas.height, 5, 10000));
        },
        (delta: number) => {
            modelNode.worldRotate(Aurora.Quaternion.createFromEulerY(0.001 * delta * Math.PI));
            env.renderingManager.render(env.gl, env.camera, env.world, [light]);
        });
    }
}