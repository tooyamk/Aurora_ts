namespace MITOIA {
    export interface  IBoundingShape {
        intersectRay(ray: Ray, cullFace: GLCullFace, rst: RaycastHit): RaycastHit;
    }
}