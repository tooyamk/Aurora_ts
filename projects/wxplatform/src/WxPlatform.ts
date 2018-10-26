namespace Aurora {
    export class WxPlatform implements IPlatform {
        private _isDevtools: boolean;

        constructor() {
            const info = wx.getSystemInfoSync();
            this._isDevtools = info.platform === "devtools";
        }

        public duration(): number {
            let t = wx.getPerformance().now();
            if (!this._isDevtools) t /= 1000;
            return t;
        }
    }
}