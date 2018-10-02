namespace Aurora {
    export class RaycastHit {
        public distance: number;
        public distanceSquared: number;
        public node: Node3D;
        public readonly normal: Vector3 = Vector3.Zero;

        constructor() {
            this.clear();
        }

        public clear(): void {
            this.distance = -1;
            this.distanceSquared = -1;
            this.node = null;
            this.normal.setZero();
        }
    }
}