namespace Aurora {
    export class SpriteFrame {
        public x = 0;
        public y = 0;
        public width = 0;
        public height = 0;

        public offsetX = 0;
        public offsetY = 0;

        public sourceWidth = 0;
        public sourceHeight = 0;

        /**
         * -1 = ccw, 0 = none, 1 = cw.
         */
        public rotated = 0;

        public texWidth = -1;
        public texHeight = -1;

        public texture: GLTexture2D = null;
    }

    export class SpriteAtlas {
        protected _frames: { [key: string]: SpriteFrame } = {};
        protected _numFrames = 0;

        /**
         * @param json TexturePacker Json(Hash) Format.
         */
        public parse(ns: string, json: any, tex: GLTexture2D): void {
            if (ns) {
                if (ns.length > 0) ns += "/";
            } else {
                ns = "";
            }
            
            let frames = json.frames;
            let meta = json.meta;
            
            let scale = 1;
            let texW = -1, texH = -1;
            if (meta) {
                scale = 1 / parseFloat(meta.scale);
                let size = meta.size;
                if (size) {
                    texW = size.w * scale;
                    texH = size.h * scale;
                }
            }

            for (let key in frames) {
                let data = frames[key];
                let fd = data.frame;
                let ss = data.sourceSize;
                let sss = data.spriteSourceSize;

                let sf = new SpriteFrame();
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
                //console.log(key);
                //console.log(data);
            }
        }

        public addFrame(name: string, frame: SpriteFrame): void {
            let old = this._frames[name];
            if (old !== frame) {
                if (old) {
                    if (frame) {
                        this._frames[name] = frame;
                    } else {
                        delete this._frames[name];
                        --this._numFrames;
                    }
                } else {
                    if (frame) {
                        this._frames[name] = frame;
                        ++this._numFrames;
                    }
                }
            }
        }

        public getFrame(name: string): SpriteFrame {
            return this._frames[name];
        }
    }
}