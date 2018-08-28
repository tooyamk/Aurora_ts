/// <reference path="examples/_Other.ts" />
/// <reference path="examples/_SimpleWorld.ts" />

/// <reference path="physics/Ray.ts" />
/// <reference path="math/MathUtils.ts" />
/// <reference path="utils/sort/Merge.ts" />

class AAA {
    public name:string;
    public a:number;
    constructor(n:string, a: number) {
        this.name = n;
        this.a = a;
    }
}

let arr = [new AAA("1", 0), new AAA("2", 0), new AAA("3", 0)];

Aurora.Sort.Merge.sort(arr, (a: AAA, b: AAA) => {
    return a.a <= b.a;
})

new _Other();
//new _SimpleWorld();