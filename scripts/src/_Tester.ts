/// <reference path="examples/_Other.ts" />
/// <reference path="examples/_SimpleWorld.ts" />

/// <reference path="physics/Ray.ts" />
/// <reference path="math/MathUtils.ts" />

let ray = new MITOIA.Ray();
let hit = ray.castPlane(new MITOIA.Vector3(1, 1, 10), new MITOIA.Vector3(0, 0, 1));
let v = MITOIA.MathUtils.getFootOfPerpendicular(MITOIA.Vector3.Zero, new MITOIA.Vector3(1, 0, 0), new MITOIA.Vector3(-20, 100, 7));

//new _Other();
new _SimpleWorld();