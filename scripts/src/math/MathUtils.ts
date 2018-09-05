
/// <reference path="Vector.ts" />

namespace Aurora {
    export abstract class MathUtils {
        public static readonly ZERO_TOLERANCE: number = 1E-6;//Number.EPSILON;
        public static readonly RAD_2_DEG: number = 180 / Math.PI;
        public static readonly DEG_2_RAD: number = Math.PI / 180;

        public static lerp(a: number, b: number, t: number): number {
            return a + (b - a) * t;
        }

        public static clamp(value: number, min: number, max: number): number {
            if (value < min) {
                value = min;
            } else if (value > max) {
                value = max;
            }
            return value;
        }

        /**
         * @param begin lineBeginPoint.
         * @param end lineEndPoint.
         */
        public static getFootOfPerpendicular(begin: Vector3, end: Vector3, pt: Vector3, rst: Vector3 = null): Vector3 {
            rst = rst || new Vector3();

            let dx = end.x - begin.x;
            let dy = end.y - begin.y;
            let dz = end.z - begin.z;
            if (Math.abs(dx) < MathUtils.ZERO_TOLERANCE && Math.abs(dy) < MathUtils.ZERO_TOLERANCE && Math.abs(dz) < MathUtils.ZERO_TOLERANCE) {
                rst.setFromNumbers(NaN, NaN, NaN);
                return rst;
            }

            let u = (begin.x - pt.x) * dx + (begin.y - pt.y) * dy + (begin.z - pt.z) * dz;
            u = u / (dx * dx + dy * dy + dz * dz);

            rst.x = begin.x - u * dx;
            rst.y = begin.y - u * dy;
            rst.z = begin.z - u * dz;

            return rst;
        }
    }
}