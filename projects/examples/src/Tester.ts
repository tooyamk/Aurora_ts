///<reference path="Other.ts" />
///<reference path="SimpleWorld.ts" />
///<reference path="SpriteAtlasTest.ts" />

document.oncontextmenu = () => { return false; }

window.addEventListener("DOMContentLoaded", () => {
    console.log(Aurora.Version);

    //new _Other();
    //new SimpleWorld();
    new SpriteAtlasTest();
});