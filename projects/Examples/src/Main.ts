///<reference path="ARRFile.ts"/>
///<reference path="Other.ts"/>
///<reference path="SimpleWorld.ts"/>
///<reference path="SpriteAtlasTest.ts"/>

document.oncontextmenu = () => { return false; }

window.addEventListener("DOMContentLoaded", () => {
    let a = Aurora.MathUtils.powOfTow(34);

    new FileTest();
    //new Other();
    //new SimpleWorld();
    //new SpriteAtlasTest();
});