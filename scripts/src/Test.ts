window.addEventListener("DOMContentLoaded", () => {
    document.oncontextmenu = () => {
        return false;
    }

    console.log("fuckkkk");

    let engine = new MITOIA.Engine(<HTMLCanvasElement>document.getElementById("renderCanvas"));
    
    let n0 = new MITOIA.Node();
    let n1 = new MITOIA.Node();
    n1.setParent(n0);

    let cam = n1.addBehavior(new MITOIA.Camera(1));
    cam.clearData.color.r = 1;
    cam.setProjectionMatrix(MITOIA.Matrix44.createOrthoLHMatrix(100, 100, 10, 100));

    n0.setLocalPosition(100, 200, 300);
    n1.setLocalPosition(10, 20, 30);
    let p = n1.getWorldPosition();

    let rp = new MITOIA.ForwardRenderPipeline();

    let b = cam instanceof MITOIA.ForwardRenderPipeline;

    let be = n1.getBehaviorByType(MITOIA.TestBehavior);

    let zzz = MITOIA.ForwardRenderPipeline;
    let mmm = typeof zzz;

    setTimeout(() => {
        rp.render(engine, cam, n0);
    }, 100);

    let str: string = null;

    let a = 1;
});