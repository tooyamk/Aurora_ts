///<reference path="FBXNode.ts"/>

namespace Aurora {
    export class FBXSubConnection extends FBXNode {
        private _curID: int;
        private _parentID: int;

        public get currentID(): int {
            return this._curID;
        }

        public get parentID(): int {
            return this._parentID;
        }

        public parse(): void {
            super.parse();

            this._curID = <int>this.properties[1].value;
            this._parentID = <int>this.properties[2].value;
        }
    }
}