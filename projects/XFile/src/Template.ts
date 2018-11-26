namespace Aurora.XFile {
    export class Template {
        public readonly guid: string = null;
        public readonly members: Template.Member[] = null;
        public readonly restriction: Template.Restriction = null;

        constructor(guid: string, members: Template.Member[], restriction: Template.Restriction) {
            this.guid = guid;
            this.members = members;
            this.restriction = restriction;
        }
    }

    export namespace Template {
        export class Member {

        }

        export class Restriction {
            public readonly value: string;

            constructor(value: string) {
                this.value = value;
            }
        }
    }
}