///<reference path="AbstractRenderable.ts" />

namespace Aurora {
    export class Sprite extends AbstractRenderable {
        protected static _tmpVec2: Vector2 = new Vector2();
        protected static _sharedQuadAssets: AssetsStore = null;
        protected static _sharedQuadVertices: number[] = null;
        protected static _sharedQuadTexCoords: number[] = null;
        protected static _sharedQuadColors: number[] = null;

        protected _frame: SpriteFrame = null;
        protected _texture: GLTexture2D = null;

        protected _uniforms: ShaderUniforms;

        protected _anchor: Vector2;
        protected _scale: Vector2;
        protected _color: Color4;

        constructor() {
            super();

            this._anchor = new Vector2(0.5, 0.5);
            this._scale = Vector2.One;
            this._color = Color4.WHITE;
            this._uniforms = new ShaderUniforms();
        }

        protected static _initSharedQuadAssetStore(): void {
            if (!Sprite._sharedQuadAssets) {
                let as = new AssetsStore();

                let vertices: number[] = [];
                vertices.length = 8;
                as.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, vertices, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));

                let texCoords: number[] = [];
                texCoords.length = 8;
                as.addVertexSource(new VertexSource(ShaderPredefined.a_TexCoord0, texCoords, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));

                let colors: number[] = [];
                colors.length = 16;
                as.addVertexSource(new VertexSource(ShaderPredefined.a_Color0, colors, GLVertexBufferSize.FOUR, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));

                as.drawIndexSource = new DrawIndexSource([0, 1, 2, 0, 2, 3], GLIndexDataType.UNSIGNED_SHORT, GLUsageType.DYNAMIC_DRAW);

                Sprite._sharedQuadAssets = as;
                Sprite._sharedQuadVertices = vertices;
                Sprite._sharedQuadTexCoords = texCoords;
                Sprite._sharedQuadColors = colors;
            }
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
                let oldTex = this._frame ? this._frame.texture : null;
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

        public get width(): uint {
            if (this._frame) {
                return this._frame.sourceWidth;
            } else if (this._texture) {
                return this._texture.width;
            } else {
                return 0;
            }
        }

        public get height(): uint {
            if (this._frame) {
                return this._frame.sourceHeight;
            } else if (this._texture) {
                return this._texture.height;
            } else {
                return 0;
            }
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

        public get scaleX(): number {
            return this._scale.x;
        }

        public set scaleX(x: number) {
            this._scale.x = x;
        }

        public get scaleY(): number {
            return this._scale.y;
        }

        public set scaleY(y: number) {
            this._scale.y;
        }

        public getScale(): Vector2 {
            return this._scale;
        }

        public setScale(s: Vector2 | Vector3 | Vector4) {
            this._scale.set(s);
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

        public checkRenderable(): boolean {
            return this._texture && this._texture.width > 0 && this._texture.height > 0 && this._color.a > 0 && this._node.readonlyCascadeColor.a > 0;
        }

        public visit(renderingData: RenderingData): void {
            if (this._frame) {
                if (this._texture) {
                    Sprite._initSharedQuadAssetStore();

                    let f = this._frame;

                    let w = f.sourceWidth, h = f.sourceHeight;

                    let lx = -w * this._anchor.x + f.offsetX, ty = -h * this._anchor.y + h - f.offsetY;
                    let rx = lx + f.width, by = ty = f.height;

                    let sx = this._scale.x, sy = this._scale.y;

                    Sprite._updateQuadVertices(Sprite._sharedQuadVertices, lx * sx, rx * sx, by * sy, ty * sy, renderingData.in.renderingObject.localToProj);
                    if (Sprite.isInViewport(Sprite._sharedQuadVertices)) {
                        let texW = f.texWidth < 0 ? this._texture.width : f.texWidth, texH = f.texHeight < 0 ? this._texture.height : f.texHeight;

                        let lu = f.x / texW;
                        let tv = f.y / texH;
                        let ru = lu + f.width / texW;
                        let bv = tv + f.height / texH;

                        Sprite._updateQuadTexCoords(Sprite._sharedQuadTexCoords, lu, ru, bv, tv, f.rotated);
                        this._updateColors(Sprite._sharedQuadColors, 16);

                        renderingData.out.assets = Sprite._sharedQuadAssets;
                        renderingData.out.uniforms = this._uniforms;
                    }
                }
            } else if (this._texture) {
                Sprite._initSharedQuadAssetStore();

                let w = this._texture.width, h = this._texture.height;

                let lx = -w * this._anchor.x, by = -h * this._anchor.y;
                let rx = lx + w, ty = by + h;

                let sx = this._scale.x, sy = this._scale.y;

                Sprite._updateQuadVertices(Sprite._sharedQuadVertices, lx * sx, rx * sx, by * sy, ty * sy, renderingData.in.renderingObject.localToProj);
                if (Sprite.isInViewport(Sprite._sharedQuadVertices)) {
                    Sprite._updateQuadTexCoords(Sprite._sharedQuadTexCoords, 0, 1, 1, 0, 0);
                    this._updateColors(Sprite._sharedQuadColors, 16);

                    renderingData.out.assets = Sprite._sharedQuadAssets;
                    renderingData.out.uniforms = this._uniforms;
                }
            }
        }

        protected static _updateQuadVertices(vertices: number[], lx: number, rx: number, by: number, ty: number, m: Matrix44): void {
            let v = Sprite._tmpVec2;
            m.transform44XY(lx, by, v);
            vertices[0] = v.x;
            vertices[1] = v.y;

            m.transform44XY(lx, ty, v);
            vertices[2] = v.x;
            vertices[3] = v.y;

            m.transform44XY(rx, ty, v);
            vertices[4] = v.x;
            vertices[5] = v.y;

            m.transform44XY(rx, by, v);
            vertices[6] = v.x;
            vertices[7] = v.y;
        }

        protected static _updateQuadTexCoords(texCoords: number[], lu: number, ru: number, bv: number, tv: number, rotated: int): void {
            if (rotated === 0) {
                texCoords[0] = lu;
                texCoords[1] = bv;

                texCoords[2] = lu;
                texCoords[3] = tv;

                texCoords[4] = ru;
                texCoords[5] = tv;

                texCoords[6] = ru;
                texCoords[7] = bv;
            } else if (rotated > 0) {
                texCoords[0] = lu;
                texCoords[1] = tv;

                texCoords[2] = ru;
                texCoords[3] = tv;

                texCoords[4] = ru;
                texCoords[5] = bv;

                texCoords[6] = lu;
                texCoords[7] = bv;
            } else {
                texCoords[0] = ru;
                texCoords[1] = bv;

                texCoords[2] = lu;
                texCoords[3] = bv;

                texCoords[4] = lu;
                texCoords[5] = tv;

                texCoords[6] = ru;
                texCoords[7] = tv;
            }
        }

        public static isInViewport(vertices: number[]): boolean {
            let len = vertices.length;
            if (len > 0) {
                let x = vertices[0];
                let y = vertices[1];
                let minX = x, minY = y, maxX = x, maxY = y;
                for (let i = 2; i <len; ++i) {
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

        protected _updateColors(colors: number[], n: uint): void {
            let c0 = this.node.readonlyCascadeColor;
            let c1 = this._color;
            let r = c0.r * c1.r, g = c0.g * c1.g, b = c0.b * c1.b, a = c0.a * c1.a;

            for (let i = 0; i < n; ++i) {
                colors[i] = r;
                colors[++i] = g;
                colors[++i] = b;
                colors[++i] = a;
            }
        }

        public destroy(): void {
            super.destroy();

            this.texture = null;
            this.frame = null;

            if (this._uniforms) {
                this._uniforms.destroy();
                this._uniforms = null;
            }
        }

        protected _setTex(tex: GLTexture2D): void {
            if (this._texture !== tex) {
                this._texture = tex;
                if (tex) {
                    this._uniforms.setTexture(ShaderPredefined.u_DiffuseSampler, tex);
                } else {
                    this._uniforms.delete(ShaderPredefined.u_DiffuseSampler);
                }
            }
        }
    }
}