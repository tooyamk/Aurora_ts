///<reference path="ARRFile.ts" />
///<reference path="Other.ts" />
///<reference path="SimpleWorld.ts" />
///<reference path="SpriteAtlasTest.ts" />

document.oncontextmenu = () => { return false; }

window.addEventListener("DOMContentLoaded", () => {
    let p = Aurora.MathUtils.getLinesIntersectionPoint(new Aurora.Vector3(100, 0, 0), new Aurora.Vector3(), new Aurora.Vector3(20, 1, 0), new Aurora.Vector3(20, -200, 0));

    //new FileTest();
    //new Other();
    //new SimpleWorld();
    new SpriteAtlasTest();
});