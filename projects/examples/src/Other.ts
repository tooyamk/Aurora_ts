//import Aurora from "../../../dist/aurora.core.js";
///<reference path="Tools.ts" />
//<reference path="../../core/src/Includes.ts" />

class Other {
    constructor() {
        let platform = new Aurora.StandardHTMLPlatform();
        
        let canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
        let options: Aurora.GLOptions = {};
        options.preserveDrawingBuffer = true;
        options.depth = true;
        options.stencil = true;
        options.version = 1;
        let gl = new Aurora.GL(canvas, options);
    
        let forwardRenderer = new Aurora.ForwardRenderer();
    
        console.log(Aurora.Version, gl.version, gl.versionFullInfo);
    
        let shaderStore = new Aurora.ShaderStore();
        shaderStore.addBuiltinLibraries();
        shaderStore.addBuiltinShaderSources();
        
        let worldNode = new Aurora.Node3D();
        let skyNode = new Aurora.Node3D();
        let model1Node = new Aurora.Node3D();
        let model2Node = new Aurora.Node3D();
        let cameraNode = new Aurora.Node3D();
        let lightNode = new Aurora.Node3D();
        worldNode.addChild(skyNode);
        worldNode.addChild(model1Node);
        worldNode.addChild(model2Node);
        worldNode.addChild(cameraNode);
        worldNode.addChild(lightNode);
    
        let light = lightNode.addComponent(new Aurora.PointLight());
        //light.spotAngle = 10 * Math.PI / 180;
        light.color.setFromNumbers(1, 1, 1);
        light.setAttenuation(2500);
        light.intensity = 1.0;
    
        let fbo = new Aurora.GLFrameBuffer(gl, 1000, 1000);
    
        let depthRBO = new Aurora.GLRenderBuffer(gl);
        depthRBO.storage(Aurora.GLRenderBufferInternalFormat.DEPTH_COMPONENT16, fbo.width, fbo.height);
    
        let stencilRBO = new Aurora.GLRenderBuffer(gl);
        stencilRBO.storage(Aurora.GLRenderBufferInternalFormat.STENCIL_INDEX8, fbo.width, fbo.height);
    
        let depthAndStencilRBO = new Aurora.GLRenderBuffer(gl);
        depthAndStencilRBO.storage(Aurora.GLRenderBufferInternalFormat.DEPTH_STENCIL, fbo.width, fbo.height);
    
        let colorTex = new Aurora.GLTexture2D(gl);
        colorTex.upload(0, Aurora.GLTexInternalFormat.RGBA, fbo.width, fbo.height, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, <ArrayBufferView>null, 0);
        
        fbo.setAttachmentTexture2D(Aurora.GLTex2DAttachment.COLOR_ATTACHMENT0, Aurora.GLFrameBufferTexTarget.TEXTURE_2D, colorTex);
        //fbo.setAttachmentTexture2D(MITOIA.GLTex2DAttachment.COLOR_ATTACHMENT0, MITOIA.GLFrameBufferTexTarget.TEXTURE_2D, null);
        fbo.setAttachmentRenderBuffer(Aurora.GLRenderBufferAttachment.DEPTH_STENCIL_ATTACHMENT, depthAndStencilRBO);
        //fbo.setAttachmentRenderBuffer(MITOIA.GLFrameBufferRenderBufferAttachment.STENCIL_ATTACHMENT, stencilRBO);
    
        let cam = cameraNode.addComponent(new Aurora.Camera());
        //cam.setProjectionMatrix(MITOIA.Matrix44.createOrthoLHMatrix(engine.canvasWidth, engine.canvasHeight, 10, 10000));
        //cam.setProjectionMatrix(MITOIA.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, engine.canvasWidth / engine.canvasHeight, 1, 10000));
        cam.setProjectionMatrix(Aurora.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, 1257 / 1308, 5, 10000));
        cam.clear.color.setFromNumbers(0.5, 0.5, 0.5, 1);
        //cam.clear.clearColor = false;
        //cam.clear.clearDepth = false;
        cam.node.setLocalPosition(0, 0, -10);
        if (fbo.checkStatus()) {
            cam.frameBuffer = fbo;
        } else {
            let a = 1;
        }
    
        model1Node.localTranslate(0, 0, 500);
        model1Node.setLocalScale(100, 100, 100);
        //skyNode.appendLocalTranslate(0, 0, 500);
        lightNode.localTranslate(0, 0, 0);
        //lightNode.appendLocalRotation(MITOIA.Quaternion.createFromEulerY(Math.PI * 0.25));
    
        let mesh = this.createModel(model1Node, gl, shaderStore, Aurora.BuiltinShader.DefaultMesh.NAME, Aurora.BuiltinShader.DefaultMesh.NAME);
        mesh.renderer = forwardRenderer;
        //model1Node.addComponent(new MITOIA.Collider(new MITOIA.BoundingMesh(mesh.assetStore)));
        model1Node.addComponent(new Aurora.Collider(new Aurora.BoundSphere(null, 100)));
        //model1Node.appendLocalRotation(MITOIA.Quaternion.createFromEulerX(Math.PI / 180));
    
        this.createSkyBox(skyNode, gl, shaderStore, Aurora.BuiltinShader.DefaultSkyBox.NAME, Aurora.BuiltinShader.DefaultSkyBox.NAME).renderer = forwardRenderer;
    
    
        let hit = new Aurora.Ray(new Aurora.Vector3(0, 0, 490)).cast(worldNode, 0x7FFFFFFF, Aurora.GLCullFace.NONE);
    
        //model1Node.appendLocalRotation(MITOIA.Quaternion.createFromEulerY(Math.PI));
    
        let renderingManager = new Aurora.RenderingManager();
    
        let stretcher = new Aurora.CanvasAutoStretcher(gl.canvas);
    
        let pp = new Aurora.PostProcess();
        pp.material = new Aurora.Material();
        //pp.material.depthWrite = false;
        //pp.material.cullFace = MITOIA.GLCullFace.NONE;
        pp.material.uniforms.setTexture(Aurora.ShaderPredefined.u_Sampler0, colorTex);
    
        let fps = new Aurora.FPSDetector(platform);
        fps.show();
    
        let loop = (delta: number) => {
            //console.log(delta);
            if (stretcher.execute()) {
                gl.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                //cam.setProjectionMatrix(MITOIA.Matrix44.createOrthoLHMatrix(engine.canvasWidth, engine.canvasHeight, 10, 10000));
                cam.setProjectionMatrix(Aurora.Matrix44.createPerspectiveFovLHMatrix(Math.PI / 3, gl.canvas.width / gl.canvas.height, 5, 10000));
            }
    
            model1Node.localRotate(Aurora.Quaternion.createFromEulerY(Math.PI / 180));
            //cameraNode.appendLocalRotation(MITOIA.Quaternion.createFromEulerX(Math.PI / 180));
            //gl.context.bindTexture(MITOIA.GL.TEXTURE_2D, null);
            renderingManager.render(gl, cam, worldNode, [light]);
            renderingManager.postProcess(gl, [pp]);
            //gl.context.flush();
            //gl.clear(null);
    
            fps.record();
            //console.log(fps.fps);
        }
    
        //setInterval(loop, 16)
        new Aurora.FrameLooper(platform, 1000 / 60).start(loop);
        //requestAnimationFrame(loop);
    }

    public createModel(node: Aurora.Node3D, gl: Aurora.GL, shaderStore: Aurora.ShaderStore, vert: string, frag: string) {
        let vertexBuffer = new Aurora.GLVertexBuffer(gl);
        vertexBuffer.upload([-150, -100, 0.0, -100.0, 100, 0.0, 100, -100, 0.0], Aurora.GLVertexBufferSize.THREE, Aurora.GLVertexBufferDataType.FLOAT, false, Aurora.GLUsageType.STATIC_DRAW);
        //vertexBuffer.upload([-0.5, -0.5, 0.0, -0.5, 0.5, 0.0, 0.5, -0.5, 0.0], MITOIA.GLVertexBufferSize.THREE, MITOIA.GLVertexBufferDataType.FLOAT, false, MITOIA.GLUsageType.STATIC_DRAW);
    
        let colorBuffer = new Aurora.GLVertexBuffer(gl);
        colorBuffer.upload([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0], Aurora.GLVertexBufferSize.THREE, Aurora.GLVertexBufferDataType.FLOAT, false, Aurora.GLUsageType.STATIC_DRAW);
    
        let uvBuffer = new Aurora.GLVertexBuffer(gl);
        uvBuffer.upload([0, 1, 0, 0, 1, 1], Aurora.GLVertexBufferSize.TWO, Aurora.GLVertexBufferDataType.FLOAT, false, Aurora.GLUsageType.STATIC_DRAW);
    
        let indexBuffer = new Aurora.GLIndexBuffer(gl);
        indexBuffer.upload([0, 1, 2], Aurora.GLUsageType.STATIC_DRAW);
    
        let assetStore = new Aurora.AssetStore();
        assetStore.vertexBuffers.set(Aurora.ShaderPredefined.a_Position0, vertexBuffer);
        assetStore.vertexBuffers.set(Aurora.ShaderPredefined.a_TexCoord0, uvBuffer);
        assetStore.vertexBuffers.set(Aurora.ShaderPredefined.a_Color0, colorBuffer);
        assetStore.drawIndexBuffer = indexBuffer;
    
        assetStore = Aurora.MeshBuilder.createSphere(100, 40, true, true);
        //assetStore = MITOIA.MeshBuilder.createBox(100, 100, 100, 1, 1, 1, true, true);
    
        let mesh = node.addComponent(new Aurora.RenderableMesh());
        //mesh.assetStore = assetStore;
    
        let request = new XMLHttpRequest();
        request.addEventListener("loadend", () => {
            let assetStore = new Aurora.AssetStore();
    
            let offset = 0;
            let dv = new DataView(request.response);
    
            let n = dv.getInt32(offset, true);
            offset += 4;
            let vertices: number[] = [];
            assetStore.addVertexSource(new Aurora.VertexSource(Aurora.ShaderPredefined.a_Position0, vertices));
            for (let i = 0; i < n; ++i) {
                vertices.push(dv.getFloat32(offset, true));
                offset += 4;
                vertices.push(dv.getFloat32(offset, true));
                offset += 4;
                vertices.push(dv.getFloat32(offset, true));
                offset += 4;
            }

            n = dv.getInt32(offset, true);
            offset += 4;
            let normal: number[] = [];
            assetStore.addVertexSource(new Aurora.VertexSource(Aurora.ShaderPredefined.a_Normal0, normal, Aurora.GLVertexBufferSize.THREE));
            for (let i = 0; i < n; ++i) {
                normal.push(dv.getFloat32(offset, true));
                offset += 4;
                normal.push(dv.getFloat32(offset, true));
                offset += 4;
                normal.push(dv.getFloat32(offset, true));
                offset += 4;
            }
            
            n = dv.getInt32(offset, true);
            offset += 4;
            let uv: number[] = [];
            assetStore.addVertexSource(new Aurora.VertexSource(Aurora.ShaderPredefined.a_TexCoord0, uv, Aurora.GLVertexBufferSize.TWO));
            for (let i = 0; i < n; ++i) {
                uv.push(dv.getFloat32(offset, true));
                offset += 4;
                uv.push(dv.getFloat32(offset, true));
                offset += 4;
            }
    
            n = dv.getInt32(offset, true);
            offset += 4;
            let index: Aurora.uint[] = [];
            assetStore.drawIndexSource = new Aurora.DrawIndexSource(index);
            for (let i = 0; i < n; ++i) {
                index.push(dv.getInt32(offset, true));
                offset += 4;
            }
    
            mesh.assetStore = assetStore;
        });
        request.open("GET", getURL("model.bin"), true);
        request.responseType = "arraybuffer";
        request.send();
    
        //console.log(shaderStore.getShaderSource(vert, MITOIA.GLShaderType.VERTEX_SHADER).source);
        //console.log(shaderStore.getShaderSource(vert, MITOIA.GLShaderType.FRAGMENT_SHADER).source);
    
        let mat = new Aurora.Material(shaderStore.createShader(gl, vert, frag));
        /*
        let mat = new MITOIA.Material(new MITOIA.Shader(gl, 
            new MITOIA.ShaderSource(`
                attribute vec3 a_Position;
                attribute vec2 a_TexCoord;
                attribute vec3 a_Color;
                uniform mat4 u_M44_L2P;
                varying vec2 uv;
                varying vec3 color;
                void main(void) {
                    uv = a_TexCoord;
                    color = a_Color;
                    gl_Position = vec4(a_Position, 1.0);
                }
                `),
            new MITOIA.ShaderSource(`
                #ifdef GL_FRAGMENT_PRECISION_HIGH
                precision highp float;
                #else  
                precision mediump float; 
                #endif
                uniform sampler2D u_DiffuseSampler;
                varying vec2 uv;
                varying vec3 color;
                void main(void) {
                    gl_FragColor = texture2D(u_DiffuseSampler, uv);
                    //gl_FragColor = vec4(color, 1.0);
                }
                `)));
                */
        //mat.uniforms.setFloat("u_color", -0.1, 1, 0, 0.2);
        //mat.uniforms.setNumberArray("u_color", new Int32Array([1, 1, 0, 1]));
        let stencil = new Aurora.GLStencil();
        stencil.func = Aurora.GLStencilFunc.NEVER;
        //stencil.ref = 2;
    
        let stencil2 = new Aurora.GLStencil();
        stencil2.func = Aurora.GLStencilFunc.ALWAYS;
        //stencil2.ref = 2;
        
        mat.cullFace = Aurora.GLCullFace.BACK;
        mat.depthTest = Aurora.GLDepthTest.LESS;
        //mat.blend = new MITOIA.GLBlend();
        //mat.blend.func.setSeparate(MITOIA.GLBlendFactorValue.SRC_ALPHA, MITOIA.GLBlendFactorValue.ONE_MINUS_SRC_ALPHA, MITOIA.GLBlendFactorValue.ONE, MITOIA.GLBlendFactorValue.ONE_MINUS_SRC_ALPHA);
        //mat.stencilFront = stencil;
        //mat.stencilBack = stencil2;
        mesh.materials[0] = mat;
        mesh.enabled = false;
        mat.defines.setDefine(Aurora.ShaderPredefined.LIGHTING, true);
        mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_TEX, false);
        mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_COLOR, true);
        mat.uniforms.setNumber(Aurora.ShaderPredefined.u_DiffuseColor, 1, 1, 1, 1.0);
        //mat.defines.setDefine(MITOIA.ShaderPredefined.SPECULAR_COLOR, true);
        //mat.uniforms.setNumber(MITOIA.ShaderPredefined.u_SpecularColor, 0.5, 0, 0);
        mat.defines.setDefine(Aurora.ShaderPredefined.LIGHTING_SPECULAR, Aurora.ShaderPredefined.LIGHTING_SPECULAR_BLINN_PHONE);
        mat.defines.setDefine(Aurora.ShaderPredefined.REFLECTION, false);
        
        //mat.defines.setDefine(MITOIA.ShaderPredefined.ALPHA_TEST, MITOIA.ShaderPredefined.ALPHA_TEST_LESS);
        //mat.uniforms.setNumber(MITOIA.ShaderPredefined.u_AlphaTestCompareValue, 0.51);
        
        mat.drawMode = Aurora.GLDrawMode.TRIANGLES;
    
        let step = 0;
    
        let tex = new Aurora.GLTexture2D(gl);
    
        let img = new Image();
        img.onload = () => {
            var text = document.createElement("canvas");
            text.width = 512, text.height = 256;
            //对其绘制文字
            (function (g) {
                //设置文字属性
                g.textBaseline = "middle", g.textAlign = "center";
                g.font = "128px 楷体";
                //设置文字渐变
                g.fillStyle = g.createLinearGradient(0, 0, text.width, 0);
                g.fillStyle.addColorStop(0, "rgba(255,255,0,0.5)");
                g.fillStyle.addColorStop(0.5, "rgba(0,255,255,0.5)");
                g.fillStyle.addColorStop(1, "rgba(255,0,255,0.5)");
                //绘制文字
                g.fillText("噶唔热好热哇和日历了", 256, 128);
            })(text.getContext("2d"))
    
            tex.upload(0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, img);
            mat.uniforms.setTexture(Aurora.ShaderPredefined.u_DiffuseSampler, tex);
            mesh.enabled = ++step === 2;
        }
        img.src = getURL("tex1.png");
    
        let tex1 = new Aurora.GLTextureCube(gl);
        let count = 0;
    
        let checkFinish = () => {
            if (++count === 6) {
                mat.uniforms.setTexture(Aurora.ShaderPredefined.u_ReflectionSampler, tex1);
                mesh.enabled = ++step === 2;
            }
        }
    
        let loadImg = (name: string, face: Aurora.GLTexCubeFace) => {
            let img = new Image();
            img.src = getURL("skybox/" + name + ".jpg");
            img.onload = () => {
                tex1.upload(face, 0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, img);
                checkFinish();
            }
        }
    
        loadImg("nx", Aurora.GLTexCubeFace.TEXTURE_CUBE_MAP_NEGATIVE_X);
        loadImg("ny", Aurora.GLTexCubeFace.TEXTURE_CUBE_MAP_NEGATIVE_Y);
        loadImg("nz", Aurora.GLTexCubeFace.TEXTURE_CUBE_MAP_NEGATIVE_Z);
        loadImg("px", Aurora.GLTexCubeFace.TEXTURE_CUBE_MAP_POSITIVE_X);
        loadImg("py", Aurora.GLTexCubeFace.TEXTURE_CUBE_MAP_POSITIVE_Y);
        loadImg("pz", Aurora.GLTexCubeFace.TEXTURE_CUBE_MAP_POSITIVE_Z);
    
        return mesh;
    }
    
    public createSkyBox(node: Aurora.Node3D, gl: Aurora.GL, shaderStore: Aurora.ShaderStore, vert: string, frag: string) {
        let mesh = node.addComponent(new Aurora.RenderableMesh());
        mesh.enabled = false;
        mesh.assetStore = Aurora.MeshBuilder.createBox(10000, 10000, 10000, 1, 1, 1, true, true);
    
        let mat = new Aurora.Material(shaderStore.createShader(gl, vert, frag));
        mat.cullFace = Aurora.GLCullFace.FRONT;
        mat.depthWrite = false;
        mat.depthTest = Aurora.GLDepthTest.NONE;
        mat.renderingPriority = -1;
    
        mat.defines.setDefine(Aurora.ShaderPredefined.DIFFUSE_TEX, true);
    
        mesh.materials[0] = mat;
    
        let tex = new Aurora.GLTextureCube(gl);
        let count = 0;
    
        let checkFinish = () => {
            if (++count === 6) {
                mat.uniforms.setTexture(Aurora.ShaderPredefined.u_DiffuseSampler, tex);
                mesh.enabled = true;
            }
        }
    
        let loadImg = (name: string, face: Aurora.GLTexCubeFace) => {
            let img = new Image();
            img.src = getURL("skybox/" + name + ".jpg");
            img.onload = () => {
                tex.upload(face, 0, Aurora.GLTexInternalFormat.RGBA, Aurora.GLTexFormat.RGBA, Aurora.GLTexDataType.UNSIGNED_BYTE, img);
                checkFinish();
            }
        }
    
        loadImg("nx", Aurora.GLTexCubeFace.TEXTURE_CUBE_MAP_NEGATIVE_X);
        loadImg("ny", Aurora.GLTexCubeFace.TEXTURE_CUBE_MAP_NEGATIVE_Y);
        loadImg("nz", Aurora.GLTexCubeFace.TEXTURE_CUBE_MAP_NEGATIVE_Z);
        loadImg("px", Aurora.GLTexCubeFace.TEXTURE_CUBE_MAP_POSITIVE_X);
        loadImg("py", Aurora.GLTexCubeFace.TEXTURE_CUBE_MAP_POSITIVE_Y);
        loadImg("pz", Aurora.GLTexCubeFace.TEXTURE_CUBE_MAP_POSITIVE_Z);
    
        return mesh;
    }
}