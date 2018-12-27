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
    let q0 = Aurora.Quaternion.createFromEulerX(30 * Aurora.MathUtils.DEG_2_RAD);
    let q1 = Aurora.Quaternion.createFromEulerY(60 * Aurora.MathUtils.DEG_2_RAD);

    let e0 = q0.append(q1, new Aurora.Quaternion()).toEuler().mulNumber(Aurora.MathUtils.RAD_2_DEG);

    let e1 = q0.toMatrix33().append34(q1.toMatrix33()).toQuaternion().toEuler().mulNumber(Aurora.MathUtils.RAD_2_DEG);
    let a = 1;
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