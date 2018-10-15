///<reference path="FBXNode.ts"/>

namespace Aurora {
    export class FBXModel extends FBXNode {
        public parse(): void {
            super.parse();

            this._id = <int>this.properties[0].value;
        }
    }
}