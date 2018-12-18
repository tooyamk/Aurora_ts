///<reference path="ARRFile.ts"/>
///<reference path="Other.ts"/>
///<reference path="SimpleWorld.ts"/>
///<reference path="SpriteAtlasTest.ts"/>

document.oncontextmenu = () => { return false; }

window.addEventListener("DOMContentLoaded", () => {
    let q0 = Aurora.Quaternion.createFromAxis(new Aurora.Vector3(1, 2, 3).normalize(), -Math.PI * 0.25);
    let q1 = Aurora.Quaternion.createFromAxis(new Aurora.Vector3(10, 8, 3).normalize(), -Math.PI * 0.75);

    let w0 = 0.25;
    let w1 = 0.75;

    let m0 = q0.toMatrix33();
    let m1 = q1.toMatrix33();

    let matMul = (m: Aurora.Matrix44, mul: number) => {
        m.m00 *= mul;
        m.m01 *= mul;
        m.m02 *= mul;
        m.m03 *= mul;

        m.m10 *= mul;
        m.m11 *= mul;
        m.m12 *= mul;
        m.m13 *= mul;

        m.m20 *= mul;
        m.m21 *= mul;
        m.m22 *= mul;
        m.m23 *= mul;

        m.m30 *= mul;
        m.m31 *= mul;
        m.m32 *= mul;
        m.m33 *= mul;
    }

    let cross = (q0: Aurora.Quaternion, q1: Aurora.Quaternion): Aurora.Quaternion => {
        return new Aurora.Quaternion(q0.y * q1.z - q0.z * q1.y, q0.z * q1.x - q0.x * q1.z, q0.x * q1.y - q0.y * q1.x, 0);
    }

    matMul(m0, w0);
    matMul(m1, w1);

    m0.add44(m1);

    let q = m0.toQuaternion();
    let e0 = q.toEuler().mulNumber(Aurora.MathUtils.RAD_2_DEG);

    let a0 = q0.clone().log();
    let a1 = q1.clone().log();
    let a2 = new Aurora.Quaternion(a0.x * w0 + a1.x * w1, a0.y * w0 + a1.y * w1, a0.z * w0 + a1.z * w1, a0.w * w0 + a1.w * w1);
    let a3 = a2.clone().exp();
    let e1 = a3.toEuler().mulNumber(Aurora.MathUtils.RAD_2_DEG);

    let b0 = Aurora.Quaternion.slerp(q0, q1, w1);
    
    let qq = new Aurora.Quaternion(q0.x + (q1.x - q0.x) * w1, q0.y * w0 + q1.y * w1, q0.z * w0 + q1.z * w1, q0.w * w0 + q1.w * w1);

    let c0 = q0.clone().log().mulNumber(w0).exp();
    let c1 = q1.clone().log().mulNumber(w1).exp();
    c0.append(c1);
    let c2 = q0.clone().pow(1);

    let e2 = q.toEuler().mulNumber(Aurora.MathUtils.RAD_2_DEG);

    let p = new Aurora.Vector3(0, 1, 0).normalize();

    let p0 = q.rotateVector3(p);
    let p1 = a3.rotateVector3(p);
    let p2 = b0.rotateVector3(p);
    let p3 = c0.rotateVector3(p);

    //new FileTest();
    //new Other();
    //new SimpleWorld();
    //new SpriteAtlasTest();
    new SkeletonAnimation();
});