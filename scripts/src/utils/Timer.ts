namespace MITOIA {
    export abstract class Timer {
        public static get time(): number {
            return new Date().getTime();
        }
    }
}