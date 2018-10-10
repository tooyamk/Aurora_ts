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

    let i = 0xFFFFFFFF;
    console.log(i);
    let i2 = 0x7FFFFFFF;
    console.log(i2);
    let i3 = 1 << 31;
    console.log(i3);
});