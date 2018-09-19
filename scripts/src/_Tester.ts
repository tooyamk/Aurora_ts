/// <reference path="examples/_Other.ts" />
/// <reference path="examples/_SimpleWorld.ts" />

/// <reference path="math/MathUtils.ts" />
/// <reference path="nodes/Node.ts" />
/// <reference path="physics/Ray.ts" />
/// <reference path="utils/sort/Merge.ts" />
/// <reference path="utils/Timer.ts" />

document.oncontextmenu = () => { return false; }

window.addEventListener("DOMContentLoaded", () => {
    //new _Other();
    new _SimpleWorld();
});