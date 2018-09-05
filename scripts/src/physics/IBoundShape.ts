namespace Aurora {
    export interface  IBoundShape {
        intersectRay(ray: Ray, cullFace: GLCullFace, rst: RaycastHit): RaycastHit;
    }
}