
///<reference path="Vector.ts" />

namespace Aurora {
    export abstract class MathUtils {
        public static readonly ZERO_TOLERANCE: number = 1E-6;//Number.EPSILON;
        public static readonly PI2: number = Math.PI * 2;
        public static readonly PI_2: number = Math.PI * 0.5;
        public static readonly RAD_2_DEG: number = 180 / Math.PI;
        public static readonly DEG_2_RAD: number = Math.PI / 180;

        public static isEqual(value: number, to: number, tolerance: number = Number.EPSILON): boolean {
            if (tolerance < 0) tolerance = -tolerance;
            return value >= to - tolerance && value <= to + tolerance;
        }

        public static lerp(a: number, b: number, t: number): number {
            return a + (b - a) * t;
        }

        public static clamp(value: number, min: number, max: number): number {
            if (value < min) {
                return min;
            } else if (value > max) {
                return max;
            }
            return value;
        }

        public static clamp01(value: number): number {
            if (value < 0) {
                return 0;
            } else if (value > 1) {
                return 1;
            }
            return value;
        }

        public static powerOfTow(value: uint, toLarger: boolean = true): uint {
            let pot: uint;
            if ((value & (value - 1)) === 0) {
                pot = value;
            } else {
                pot = Math.pow(2, (Math.log(value) / Math.LN2) | 0);
                if (toLarger) pot <<= 1;
            }

            return pot;
        }

        /**
         * @param begin lineBeginPoint.
         * @param end lineEndPoint.
         */
        public static getFootOfPerpendicular(begin: Vector3, end: Vector3, pt: Vector3, rst: Vector3 = null): Vector3 {
            rst = rst || new Vector3();

            const dx = end.x - begin.x;
            const dy = end.y - begin.y;
            const dz = end.z - begin.z;
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

        public static getProjectionPointIntoPlane(p: Vector3, planePoint: Vector3, planeNormal: Vector3, rst: Vector3 = null): Vector3 {
            const a = planePoint;
            const n = planeNormal;

            const xx = n.x * n.x;
            const xy = n.x * n.y;
            const xz = n.x * n.z;
            const yy = n.y * n.y;
            const yz = n.y * n.z;
            const zz = n.z * n.z;
            const lenSq = xx + yy + zz;

            const x = (xy * a.y + yy * p.x - xy * p.y + xz * a.z + zz * p.x - xz * p.z + xx * a.x) / lenSq;
            const y = (yz * a.z + zz * p.y - yz * p.z + xy * a.x + xx * p.y - xy * p.x + yy * a.y) / lenSq;
            const z = (xz * a.x + xx * p.z - xz * p.x + yz * a.y + yy * p.z - yz * p.y + zz * a.z) / lenSq;

            return rst ? rst.setFromNumbers(x, y, z) : new Vector3(x, y, z);
        }

        public static getLinesIntersectionPoint(line1Point1: Vector3, line1Point2: Vector3, line2Point1: Vector3, line2Point2: Vector3, rst: Vector3 = null, tolerance: number = Number.EPSILON): Vector3 {
            const x1 = line1Point2.x - line1Point1.x;
            const x2 = line2Point1.x - line1Point1.x;
            const x3 = line2Point2.x - line1Point1.x;

            const y1 = line1Point2.y - line1Point1.y;
            const y2 = line2Point1.y - line1Point1.y;
            const y3 = line2Point2.y - line1Point1.y;

            const z1 = line1Point2.z - line1Point1.z;
            const z2 = line2Point1.z - line1Point1.z;
            const z3 = line2Point2.z - line1Point1.z;

            const x1y2 = x1 * y2;
            const x1y3 = x1 * y3;
            const x2y1 = x2 * y1;
            const x3y1 = x3 * y1;
            const x3z1 = x3 * z1;

            const isEqual = MathUtils.isEqual;

            if (isEqual(x1y2, x2y1, tolerance) && isEqual(x1y3, x3y1, tolerance) && isEqual(x1y3, x3y1, tolerance) && isEqual(x1 * z3, x3z1, tolerance)) {
                return null;
            } else {
                const x2y3 = x2 * y3;
                const x3y2 = x3 * y2;
                if (!isEqual(x1y2 * z3 + x2y3 * z1 + x3y1 * z2 - x3y2 * z1 - x1y3 * z2 - x2y1 * z3, 0, tolerance)) {
                    return null;
                } else if (isEqual(x3y1 - x2y1, x1y3 - x1y2, tolerance) && isEqual((x3 - x2) * z1, (z3 - z2) * x1, tolerance)) {
                    return null;
                } else {
                    const len = x3y1 + y2 * x1 - y3 * x1 - x2y1;
                    const x = (x1 * x3y2 - x1 * x2y3) / len + line1Point1.x;
                    const y = (x3y1 * y2 - x2y1 * y3) / len + line1Point1.y;
                    const z = (x3z1 * y2 - x2y1 * y3) / len + line1Point1.z;

                    return rst ? rst.setFromNumbers(x, y, z) : new Vector3(x, y, z);
                }
            }
        }
    }
}