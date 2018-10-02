///<reference path="Other.ts" />
///<reference path="SimpleWorld.ts" />

document.oncontextmenu = () => { return false; }

window.addEventListener("DOMContentLoaded", () => {
    console.log(Aurora.Version);
    //new _Other();
    new SimpleWorld();
    let a = 1;
    console.log(a);
});