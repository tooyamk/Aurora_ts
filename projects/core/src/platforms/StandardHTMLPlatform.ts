///<reference path="IPlatform.ts"/>

namespace Aurora {
    export class StandardHTMLPlatform implements IPlatform {
        public duration(): number {
            return performance.now();
        }
    }
}