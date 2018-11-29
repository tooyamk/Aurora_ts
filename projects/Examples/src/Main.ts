///<reference path="ARRFile.ts"/>
///<reference path="Other.ts"/>
///<reference path="SimpleWorld.ts"/>
///<reference path="SpriteAtlasTest.ts"/>

document.oncontextmenu = () => { return false; }

window.addEventListener("DOMContentLoaded", () => {
    let q = new Aurora.Quaternion(-0.000000, 0.000000, 0.382683, 0.923880);
    let e = q.toEuler().mulNumber(Aurora.MathUtils.RAD_2_DEG);

    let qq = Aurora.Quaternion.createFromEulerXYZ(0, 0, 45 * Aurora.MathUtils.DEG_2_RAD);

    new FileTest();
    //new Other();
    //new SimpleWorld();
    //new SpriteAtlasTest();
});