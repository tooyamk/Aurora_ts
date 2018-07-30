namespace MITOIA {
    export class ShaderAttributes {
        public names: string[] = [];
        public locations: number[] = [];

        constructor() {
        }

        public get count(): uint {
            return this.names.length;
        }

        public add(name: string): void {
            if (name && name.length > 0) {
                let idx = this.names.indexOf(name);
                if (idx < 0) this.names.push(name);
            }
        }

        public remove(name: string): void {
            if (name && name.length > 0) {
                let idx = this.names.indexOf(name);
                if (idx >= 0) this.names.splice(idx, 1);
            }
        }

        public getLocation(name: string): int {
            let idx = this.names.indexOf(name);
            if (idx < 0) {
                return -1;
            } else {
                idx = this.locations[idx];
                if (idx === null || idx === undefined) {
                    return -1;
                } else {
                    return idx;
                }
            }
        }

        public getLocations(shader: Shader): void {
            if (shader) {
                shader.getAttributeLocations(this.names, this.locations);
            } else {
                this.locations.length = 0;
            }
        }
    }
}