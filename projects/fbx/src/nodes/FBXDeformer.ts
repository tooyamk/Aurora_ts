///<reference path="FBXNode.ts"/>

namespace Aurora {
    export class FBXDeformer extends FBXNode {
        public parse(): void {
            super.parse();

            this._id = <int>this.properties[0].value;
        }
    }
}