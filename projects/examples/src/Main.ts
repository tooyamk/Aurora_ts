///<reference path="ARRFile.ts"/>
///<reference path="Other.ts"/>
///<reference path="SimpleWorld.ts"/>
///<reference path="SpriteAtlasTest.ts"/>

document.oncontextmenu = () => { return false; }

class AA {
    public _value: number = 0;
    public get value(): number {
        return this._value;
    }
}

window.addEventListener("DOMContentLoaded", () => {
    /*
    try {
        (function MyAsmModule() { "use asm" })();
        console.log("asm.js OK");
        // Now, hit F12 to open the browser console just to find a TypeError that states:
        // "asm.js type error: expecting return statement"
    }
    catch (err) {
        // will never show...
        console.log("asm.js not supported.");
    }
    */
    /*
    let m0 = new Aurora.Matrix44();
    let m1 = new Aurora.Matrix44();

    let t0 = Date.now();

    for (let i = 0; i < 9999999; ++i) {
        Math.sin(a);
    }

    let t1 = Date.now();
    console.log(t1 - t0);

    t0 = Date.now();

    for (let i = 0; i < 9999999; ++i) {
        func(a);
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
    new SpriteAtlasTest();
    //new SkeletonAnimation();
});