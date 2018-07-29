window.addEventListener("DOMContentLoaded", () => {
    document.oncontextmenu = () => {
        return false;
    }

    let engine = new MITOIA.Engine(<HTMLCanvasElement>document.getElementById("renderCanvas"));
    
    let n0 = new MITOIA.Node();
    let n1 = new MITOIA.Node();
    n1.setParent(n0);

    let cam = n1.addComponent(new MITOIA.Camera(1));
    cam.clearData.color.r = 1;
    cam.setProjectionMatrix(MITOIA.Matrix44.createOrthoLHMatrix(100, 100, 10, 100));

    n0.setLocalPosition(100, 200, 300);
    n1.setLocalPosition(10, 20, 30);
    let p = n1.getWorldPosition();

    let rp = new MITOIA.ForwardRenderPipeline();

    let b = cam instanceof MITOIA.ForwardRenderPipeline;

    let be = n1.getComponentByType(MITOIA.TestBehavior);
    
    let vert = "attribute vec3 position;\n" +
    "void main(void){\n" +
    "gl_Position = vec4(position.x, position.y, position.z, 1);\n" +
    "}";

    let frag = "void main(void){\n" +
    "gl_FragColor = vec4(1, 1, 1, 1);\n" +
    "}";

    let meshAsset = new MITOIA.MeshAsset();
    meshAsset.vertexAsset = [-1, -1, 0, -1, 1, 0, 1, -1, 0];
    meshAsset.indexAsset = [0, 1, 2];
    meshAsset.createGLData(engine.gl);

    let mesh = n1.addComponent(new MITOIA.Mesh());
    mesh.asset = meshAsset;

    let renderer = n1.addComponent(new MITOIA.MeshRenderer());
    renderer.material = new MITOIA.Material(new MITOIA.Shader(engine, vert, frag));

    let aaazz = MITOIA.Vector3['prototype'];

    let list = new MITOIA.List<number>();
    list.pushBack(1);
    list.pushBack(2);
    list.pushBack(3);

    list.erase(list.lastFind(2));

    list.clear();

    console.log(list.size);
    console.log(list.capacity);


    //for (let itr = list.end; !itr.done; itr.prev()) {
    //    console.log(itr.value);
    //}

    for (let itr of list.begin) {
        console.log("aaa : " + itr);
    }

    let map: Map<string, number> = new Map();
    map.set("a", 3);
    map.set("h", 1);
    map.set("g", 1);
    map.set("f", 1);
    map.set("e", 1);
    map.set("d", 1);
    map.set("c", 1);
    map.set("b", 2);
    

    for (let itr of map) {
        console.log(itr);
    }

    let def: {[key:string]:number} = {};
    let aaaaa = def["a"] === null;

    setTimeout(() => {
        rp.render(engine, cam, n0);
    }, 100);

    let str: string = null;

    let a = 1;
});