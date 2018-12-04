///<reference path="ARRFile.ts"/>
///<reference path="Other.ts"/>
///<reference path="SimpleWorld.ts"/>
///<reference path="SpriteAtlasTest.ts"/>

document.oncontextmenu = () => { return false; }

window.addEventListener("DOMContentLoaded", () => {
    let a = Aurora.Quaternion.createFromEulerXYZ(10 * Aurora.MathUtils.DEG_2_RAD, 20 * Aurora.MathUtils.DEG_2_RAD, 30 * Aurora.MathUtils.DEG_2_RAD);
    let b = Aurora.Quaternion.createFromEulerXYZ(-10 * Aurora.MathUtils.DEG_2_RAD, -30 * Aurora.MathUtils.DEG_2_RAD, -20 * Aurora.MathUtils.DEG_2_RAD);

    let r0 = new Aurora.Quaternion(0.03634184094195602, 0.9495685905855896, -0.0012979427377120573, 0.3114435385666171).toEuler().mulNumber(Aurora.MathUtils.RAD_2_DEG);
    let r1 = new Aurora.Quaternion(-0.03634184094195602, 0.0012979427377120573, -0.9495685905855896, 0.3114435385666171).toEuler().mulNumber(Aurora.MathUtils.RAD_2_DEG);

    new FileTest();
    //new Other();
    //new SimpleWorld();
    //new SpriteAtlasTest();
});