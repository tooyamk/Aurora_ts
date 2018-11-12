namespace Aurora {
    export class SpriteFrame extends Ref {
        public x: number = 0;
        public y: number = 0;
        public width: number = 0;
        public height: number = 0;

        public offsetX: number = 0;
        public offsetY: number = 0;

        public sourceWidth: number = 0;
        public sourceHeight: number = 0;

        /**
         * -1 = ccw, 0 = none, 1 = cw.
         */
        public rotated: int = 0;

        public texWidth: number = -1;
        public texHeight: number = -1;

        protected _tex: GLTexture2D = null;

        public get texture(): GLTexture2D {
            return this._tex;
        }

        public set texture(tex: GLTexture2D) {
            if (this._tex !== tex) {
                if (tex) tex.retain();
                if (this._tex) this._tex.release();
                this._tex = tex;
            }
        }

        public destroy(): void {
            if (this._tex) {
                this._tex.release();
                this._tex = null;
            }
        }

        protected _refDestroy(): void {
            this.destroy();
        }
    }

    export class SpriteAtlas extends Ref {
        protected _frames: RefMap<string, SpriteFrame>;

        constructor() {
            super();

            this._frames = new RefMap<string, SpriteFrame>();
            this._frames.retain();
        }

        /**
         * @param json TexturePacker Json(Hash) Format.
         */
        public parse(json: any, tex: GLTexture2D, ns: string = "", outputNames: string[] = null): void {
            if (ns === null || ns === undefined) ns = "";
            
            const frames = json.frames;
            const meta = json.meta;
            
            let scale = 1;
            let texW = -1, texH = -1;
            if (meta) {
                scale = 1 / parseFloat(meta.scale);
                const size = meta.size;
                if (size) {
                    texW = size.w * scale;
                    texH = size.h * scale;
                }
            }

            let opLen = outputNames ? outputNames.length : 0;

            for (const key in frames) {
                const data = frames[key];
                const fd = data.frame;
                const ss = data.sourceSize;
                const sss = data.spriteSourceSize;

                const sf = new SpriteFrame();
                sf.texture = tex;
                sf.x = fd.x;
                sf.y = fd.y;
                sf.width = fd.w;
                sf.height = fd.h;
                sf.sourceWidth = ss.w;
                sf.sourceHeight = ss.h;
                sf.offsetX = sss.x;
                sf.offsetY = sss.y;
                sf.rotated = data.rotated ? 1 : 0;
                sf.texWidth = texW;
                sf.texHeight = texH;

                if (scale !== 1) {
                    sf.x *= scale;
                    sf.y *= scale;
                    sf.width *= scale;
                    sf.height *= scale;
                    sf.sourceWidth *= scale;
                    sf.sourceHeight *= scale;
                    sf.offsetX *= scale;
                    sf.offsetY *= scale;
                }

                const fullName = ns + key;
                if (outputNames) outputNames[opLen++] = fullName;
                this.addFrame(fullName, sf);
            }
        }

        public addFrame(name: string, frame: SpriteFrame): void {
            this._frames.insert(name, frame);
        }

        public getFrame(name: string): SpriteFrame {
            return this._frames.find(name);
        }

        public removeFrame(name: string): void {
            this._frames.erase(name);
        }

        public removeFrames(names: string[]): void {
            if (names) {
                for (let i = 0, n = names.length; i < n; ++i) this._frames.erase(names[i]);
            }
        }

        public clearFrames(): void {
            this._frames.clear();
        }

        protected _refDestroy(): void {
            if (this._frames) {
                this._frames.release();
                this._frames = null;
            }
        }
    }
}