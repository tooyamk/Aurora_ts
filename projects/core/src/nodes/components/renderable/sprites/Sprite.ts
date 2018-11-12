///<reference path="RectSpriteMeshMaker.ts" />
///<reference path="../AbstractRenderable.ts" />

namespace Aurora {
    const createDefaultSpriteFrame = () => {
        const f = new SpriteFrame();
        f.retain();
        return f;
    }

    export class Sprite extends AbstractRenderable {
        protected static readonly _defaultMeshMaker = new RectSpriteMeshMaker();
        protected static readonly _tmpColor4 = new Color4();
        protected static readonly _defaultSpriteFrame = createDefaultSpriteFrame();

        protected _frame: SpriteFrame = null;
        protected _texture: GLTexture2D = null;

        protected _uniforms: ShaderUniforms;

        protected _anchor: Vector2;
        protected _color: Color4;
        protected _width: number = null;
        protected _height: number = null;
        protected _meshMaker: ISpriteMeshMaker = null;

        constructor() {
            super();

            this._anchor = new Vector2(0.5, 0.5);
            this._color = Color4.WHITE;
            this._uniforms = new ShaderUniforms();
            this._uniforms.retain();
        }

        public get meshMaker(): ISpriteMeshMaker {
            return this._meshMaker;
        }

        public set meshMaker(maker: ISpriteMeshMaker) {
            this._meshMaker = maker;
        }

        public get color(): Color4 {
            return this._color;
        }

        public set color(c: Color4) {
            this._color.set(c);
        }

        public get frame(): SpriteFrame {
            return this._frame;
        }

        public set frame(f: SpriteFrame) {
            if (this._frame !== f) {
                const oldTex = this._frame ? this._frame.texture : null;

                if (f) f.retain();
                if (this._frame) this._frame.release();
                this._frame = f;

                if (oldTex === this._texture) this._setTex(f ? f.texture : null);
            }
        }

        public get texture(): GLTexture2D {
            return this._texture;
        }

        public set texture(tex: GLTexture2D) {
            this._setTex(tex);
        }

        public get sourceWidth(): uint {
            return this._frame ? this._frame.sourceWidth : (this._texture ? this._texture.width : 0);
        }

        public get sourceHeight(): uint {
            return this._frame ? this._frame.sourceHeight : (this._texture ? this._texture.height : 0);
        }

        public get anchorX(): number {
            return this._anchor.x;
        }

        public set anchorX(x: number) {
            this._anchor.x = x;
        }

        public get anchorY(): number {
            return this._anchor.y;
        }

        public set anchorY(y: number) {
            this._anchor.y = y;
        }

        public get readonlyAnchor(): Vector2 {
            return this._anchor;
        }

        public getAnchor(rst: Vector2 = null): Vector2 {
            return rst ? rst.set(this._anchor) : this._anchor.clone();
        }

        public setAnchor(anchor: Vector2 | Vector3 | Vector4): void {
            if (anchor) this._anchor.set(anchor);
        }

        public setAnchorFromNumbers(x: number, y: number): void {
            this._anchor.setFromNumbers(x, y);
        }

        public get width(): number {
            return this._width === null ? this.sourceWidth : this._width;
        }

        public set width(w: number) {
            this._width = w === undefined ? null : w;
        }

        public get height(): number {
            return this._height === null ? this.sourceHeight : this._height;
        }

        public set height(h: number) {
            this._height = h === undefined ? null : h;
        }

        public checkRenderable(): boolean {
            const tex = this._texture;
            return tex && tex.width > 0 && tex.height > 0 && this._color.a > 0 && this._node.readonlyCascadeColor.a > 0;
        }

        public render(renderingData: RenderingData): void {
            let f: SpriteFrame;
            if (this._frame) {
                f = this._frame;
            } else {
                f = Sprite._defaultSpriteFrame;
                f.sourceWidth = this._texture.width;
                f.sourceHeight = this._texture.height;
                f.width = f.sourceWidth;
                f.height = f.sourceHeight;
            }

            if (f.width > 0 && f.height > 0) this._render(f, renderingData);
        }

        protected _render(frame: SpriteFrame, renderingData: RenderingData): void {
            const maker = this._meshMaker || Sprite._defaultMeshMaker;
            if (maker.updateVertices(this._width, this._height, this._anchor, frame, renderingData.in.renderingObject.l2p)) {
                const c0 = this.node.readonlyCascadeColor, c1 = this._color;
                const asset = maker.updateAsset(frame, this._texture, Sprite._tmpColor4.setFromNumbers(c0.r * c1.r, c0.g * c1.g, c0.b * c1.b, c0.a * c1.a));
                renderingData.out.asset = asset;
                renderingData.out.uniformsList.pushBack(this._uniforms);
            }
        }

        public static isInViewport(vertices: number[], len: int = -1): boolean {
            if (len < 0) len = vertices.length;
            if (len > 0) {
                let x = vertices[0], y = vertices[1];
                let minX = x, minY = y, maxX = x, maxY = y;
                for (let i = 2; i < len; ++i) {
                    x = vertices[i++];
                    y = vertices[i];
                    if (minX > x) {
                        minX = x;
                    } else if (maxX < x) {
                        maxX = x;
                    }
                    if (minY > y) {
                        minY = y;
                    } else if (maxY < y) {
                        maxY = y;
                    }
                }

                if (minX > 1 || maxX < -1 || minY > 1 || maxY < -1) return false;
            } else {
                return false;
            }

            return true;
        }

        public static isInViewportRect(vertices: number[], v0: uint, v1: uint, v2: uint, v3: uint): boolean {
            let x = vertices[v0];
            let y = vertices[++v0];
            let minX = x, minY = y, maxX = x, maxY = y;

            x = vertices[v1];
            y = vertices[++v1];
            if (minX > x) {
                minX = x;
            } else if (maxX < x) {
                maxX = x;
            }
            if (minY > y) {
                minY = y;
            } else if (maxY < y) {
                maxY = y;
            }

            x = vertices[v2];
            y = vertices[++v2];
            if (minX > x) {
                minX = x;
            } else if (maxX < x) {
                maxX = x;
            }
            if (minY > y) {
                minY = y;
            } else if (maxY < y) {
                maxY = y;
            }

            x = vertices[v3];
            y = vertices[++v3];
            if (minX > x) {
                minX = x;
            } else if (maxX < x) {
                maxX = x;
            }
            if (minY > y) {
                minY = y;
            } else if (maxY < y) {
                maxY = y;
            }

            return !(minX > 1 || maxX < -1 || minY > 1 || maxY < -1);
        }

        public destroy(): void {
            this.texture = null;
            this.frame = null;
            this._meshMaker = null;

            if (this._uniforms) {
                this._uniforms.release();
                this._uniforms = null;
            }

            super.destroy();
        }

        protected _setTex(tex: GLTexture2D): void {
            if (this._texture !== tex) {
                if (tex) tex.retain();
                if (this._texture) this._texture.release();
                this._texture = tex;

                tex ? this._uniforms.setTexture(ShaderPredefined.u_DiffuseSampler, tex) : this._uniforms.delete(ShaderPredefined.u_DiffuseSampler);
            }
        }
    }
}