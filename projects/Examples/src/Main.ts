///<reference path="ARRFile.ts"/>
///<reference path="Other.ts"/>
///<reference path="SimpleWorld.ts"/>
///<reference path="SpriteAtlasTest.ts"/>

document.oncontextmenu = () => { return false; }

window.addEventListener("DOMContentLoaded", () => {
    let r = 45 * Aurora.MathUtils.DEG_2_RAD;
    let q = Aurora.Quaternion.createFromEulerZ(r);

    let m1 = q.toMatrix44();

    let m2 = Aurora.Matrix44.createRotationZ(r);

    let n0 = new Aurora.Node();
    let n1 = n0.addChild(new Aurora.Node());
    n1.setLocalRotation(Aurora.Quaternion.createFromEulerX(Math.PI * 0.5));
    n1.parentRotate(Aurora.Quaternion.createFromEulerZ(Math.PI * 0.5));

    let p = n1.readonlyWorldMatrix.transform34XYZ(0, 1, 0);

    new FileTest();
    //new Other();
    //new SimpleWorld();
    //new SpriteAtlasTest();
});