///<reference path="AbstractRenderable.ts" />

namespace Aurora {
    export class Sprite extends AbstractRenderable {
        protected static _sharedQuadAssetStore: AssetStore = null;
        protected static _sharedQuadVertices: number[] = null;
        protected static _sharedQuadColors: number[] = null;

        protected _frame: SpriteFrame = null;
        protected _texture: GLTexture2D = null;

        protected _uniforms: ShaderUniforms;

        protected _anchor: Vector2;

        constructor() {
            super();

            this._anchor = new Vector2(0.5, 0.5);
            this._uniforms = new ShaderUniforms();
        }

        protected static _initSharedQuadAssetStore(): void {
            if (!Sprite._sharedQuadAssetStore) {
                let as = new AssetStore();
                let vertices: number[] = [];
                vertices.length = 12;
                as.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, vertices, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));

                let colors: number[] = [];
                colors.length = 16;
                as.addVertexSource(new VertexSource(ShaderPredefined.a_Color0, colors, GLVertexBufferSize.FOUR, GLVertexBufferDataType.UNSIGNED_BYTE, false, GLUsageType.DYNAMIC_DRAW));

                as.drawIndexSource = new DrawIndexSource([0, 1, 2, 0, 2, 3], GLIndexDataType.UNSIGNED_SHORT, GLUsageType.DYNAMIC_DRAW);

                Sprite._sharedQuadAssetStore = as;
                Sprite._sharedQuadVertices = vertices;
                Sprite._sharedQuadColors = colors;
            }
        }

        public get frame(): SpriteFrame {
            return this._frame;
        }

        public set frame(f: SpriteFrame) {
            if (this._frame !== f) {
                let oldTex = this._frame ? this._frame.texture : null;
                this._frame = f;

                if (oldTex === this._texture) {
                    this._setTex(f ? f.texture : null);
                }
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

        public getAnchor(rst: Vector2 = null): Vector2 {
            return rst ? rst.set(this._anchor) : this._anchor.clone();
        }

        public setAnchor(anchor: Vector2 | Vector3 | Vector4): void {
            if (anchor) this._anchor.set(anchor);
        }

        public setAnchorFromNumbers(x: number, y: number): void {
            this._anchor.setFromNumbers(x, y);
        }

        public isReady(): boolean {
            return true;
        }

        public visit(renderingData: RenderingData): void {
            if (this._frame) {
                if (this._texture) {

                }
            } else if (this._texture) {
                Sprite._initSharedQuadAssetStore();
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