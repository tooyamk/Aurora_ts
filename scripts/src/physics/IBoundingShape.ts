namespace Aurora {
    export interface  IBoundingShape {
        intersectRay(ray: Ray, cullFace: GLCullFace, rst: RaycastHit): RaycastHit;
    }
}