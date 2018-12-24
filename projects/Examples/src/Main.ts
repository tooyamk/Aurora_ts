///<reference path="ARRFile.ts"/>
///<reference path="Other.ts"/>
///<reference path="SimpleWorld.ts"/>
///<reference path="SpriteAtlasTest.ts"/>

document.oncontextmenu = () => { return false; }

window.addEventListener("DOMContentLoaded", () => {
    /*
    let m0 = new Aurora.Matrix44();
    let m1 = new Aurora.Matrix44();

    let a = 1;
    let b = true;

    let t0 = Date.now();

    for (let i = 0; i < 9999999; ++i) {
        if (b) ++a;
    }

    let t1 = Date.now();
    console.log(t1 - t0);

    t0 = Date.now();

    for (let i = 0; i < 9999999; ++i) {
        b && ++a;
    }

    t1 = Date.now();
    console.log(t1 - t0);
    */
   
    /*
    let m0 = new Aurora.Matrix44();
    let m1 = new Aurora.Matrix44();

    let t0 = Date.now();

    for (let i = 0; i < 9999999; ++i) {
        m0.append34a(m1);
    }

    let t1 = Date.now();
    console.log(t1 - t0);

    t0 = Date.now();

    for (let i = 0; i < 9999999; ++i) {
        m0.append34b(m1);
    }

    t1 = Date.now();
    console.log(t1 - t0);
    */

    //new FileTest();
    //new Other();
    //new SimpleWorld();
    //new SpriteAtlasTest();
    new SkeletonAnimation();
});