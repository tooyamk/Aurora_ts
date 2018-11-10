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

    export class SpriteAtlas {
        protected _frames = new RefMap<string, SpriteFrame>();

        /**
         * @param json TexturePacker Json(Hash) Format.
         */
        public parse(ns: string, json: any, tex: GLTexture2D): void {
            if (!ns) ns = "";
            
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
                sf.rotated = data.roteted ? 1 : 0;
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

                this.addFrame(ns + key, sf);
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

        public clearFrames(): void {
            this._frames.clear();
        }
    }
}