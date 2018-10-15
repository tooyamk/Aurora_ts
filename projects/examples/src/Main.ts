///<reference path="ARRFile.ts" />
///<reference path="Other.ts" />
///<reference path="SimpleWorld.ts" />
///<reference path="SpriteAtlasTest.ts" />

document.oncontextmenu = () => { return false; }

window.addEventListener("DOMContentLoaded", () => {
    new ARRFileTest();
    //new Other();
    //new SimpleWorld();
    //new SpriteAtlasTest();
});