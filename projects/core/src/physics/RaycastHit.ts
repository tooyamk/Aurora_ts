namespace Aurora {
    export class RaycastHit {
        public distance: number;
        public distanceSquared: number;
        public collider: Collider;
        public readonly normal = Vector3.Zero;

        constructor() {
            this.clear();
        }

        public clear(): void {
            this.distance = -1;
            this.distanceSquared = -1;
            this.collider = null;
            this.normal.setZero();
        }
    }
}