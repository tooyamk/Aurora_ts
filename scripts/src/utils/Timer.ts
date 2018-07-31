namespace MITOIA {
    export abstract class Timer {
        public static get utc(): number {
            return new Date().getTime();
        }
    }
}