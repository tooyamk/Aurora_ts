///<reference path="FBXNode.ts"/>

namespace Aurora {
    export class FBXConnection extends FBXNode {
        private _curID: int = 0;
        private _parentID: int = 0;

        public get currentID(): int {
            return this._curID;
        }

        public get parentID(): int {
            return this._parentID;
        }

        public finish(): void {
            super.finish();

            if (this.properties) {
                this._curID = <int>this.properties[1].value;
                this._parentID = <int>this.properties[2].value;
            }
        }
    }
}