namespace MITOIA {
    export abstract class AnimationClip {
        public data: any = null;
        public duration: number = 0.0;
        public wrap: AnimationWrapMode = AnimationWrapMode.CLAMP;
    }
}