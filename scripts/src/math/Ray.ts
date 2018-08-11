namespace MITOIA {
    export class RaycastHit {
        public t: number;
        public node: Node;
        
        constructor() {
            this.clear();
        }

        public clear(): void {
            this.t = -1;
            this.node = null;
        }
    }

    export class Ray {
        public readonly origin: Vector3 = Vector3.Zero;
        public readonly direction: Vector3 = new Vector3(0, 0, 1);

        public cast(root: Node, cullingMask: uint = 0xFFFFFFFF, rst: RaycastHit = null): RaycastHit {
            if (rst) {
                rst.clear();
            } else {
                rst = new RaycastHit();
            }

            return rst;
        }
    }
}