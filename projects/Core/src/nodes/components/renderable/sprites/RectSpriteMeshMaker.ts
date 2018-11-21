///<reference path="ISpriteMeshMaker.ts" />

namespace Aurora {
    class SharedRect {
        private static readonly _tmpVec2 = new Vector2();

        public readonly asset: MeshAsset;
        public readonly vertices: number[];
        public readonly uvs: number[];
        public readonly colors: number[];

        constructor() {
            this.asset = new MeshAsset();
            this.asset.retain();

            this.vertices = [];
            this.vertices.length = 8;
            this.asset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, this.vertices, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));

            this.uvs = [];
            this.uvs.length = 8;
            this.asset.addVertexSource(new VertexSource(ShaderPredefined.a_UV0, this.uvs, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));

            this.colors = [];
            this.colors.length = 16;
            this.asset.addVertexSource(new VertexSource(ShaderPredefined.a_Color0, this.colors, GLVertexBufferSize.FOUR, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));

            this.asset.drawIndexSource = new DrawIndexSource([0, 1, 2, 0, 2, 3], GLIndexDataType.UNSIGNED_SHORT, GLUsageType.DYNAMIC_DRAW);
        }

        public updateVertices(w: number, h: number, anchor: Vector2, f: SpriteFrame, m: Matrix44): boolean {
            const v = SharedRect._tmpVec2;

            let lx = -f.sourceWidth * anchor.x + f.offsetX;
            let ty = -f.sourceHeight * anchor.y + f.sourceHeight - f.offsetY;
            let rx = lx + f.width;
            let by = ty - f.height;

            if (w !== null) {
                const s = w / f.sourceWidth;
                lx *= s;
                rx *= s;
            }
            if (h !== null) {
                const s = h / f.sourceHeight;
                by *= s;
                ty *= s;
            }

            const vertices = this.vertices;

            m.transform44XY(lx, ty, v);
            vertices[0] = v.x;
            vertices[1] = v.y;

            m.transform44XY(rx, ty, v);
            vertices[2] = v.x;
            vertices[3] = v.y;

            m.transform44XY(rx, by, v);
            vertices[4] = v.x;
            vertices[5] = v.y;

            m.transform44XY(lx, by, v);
            vertices[6] = v.x;
            vertices[7] = v.y;

            return Sprite.isInViewport(this.vertices);
        }

        public updateAsset(f: SpriteFrame, tex: GLTexture2D, color: Color4): MeshAsset {
            this._updateUVs(f, tex);
            this._updateColors(color);

            let asset = this.asset;
            asset.setVertexDirty(ShaderPredefined.a_Position0);
            asset.setVertexDirty(ShaderPredefined.a_UV0);
            asset.setVertexDirty(ShaderPredefined.a_Color0);

            return asset;
        }

        private _updateUVs(f: SpriteFrame, tex: GLTexture2D): void {
            const uvs = this.uvs;

            const texW = f.texWidth < 0 ? tex.width : f.texWidth, texH = f.texHeight < 0 ? tex.height : f.texHeight;

            const lu = f.x / texW;
            const tv = f.y / texH;

            const rotated = f.rotated;

            if (rotated === 0) {
                const ru = lu + f.width / texW;
                const bv = tv + f.height / texH;

                uvs[0] = lu;
                uvs[1] = tv;

                uvs[2] = ru;
                uvs[3] = tv;

                uvs[4] = ru;
                uvs[5] = bv;

                uvs[6] = lu;
                uvs[7] = bv;
            } else {
                const ru = lu + f.height / texW;
                const bv = tv + f.width / texH;

                if (rotated > 0) {
                    uvs[0] = ru;
                    uvs[1] = tv;

                    uvs[2] = ru;
                    uvs[3] = bv;

                    uvs[4] = lu;
                    uvs[5] = bv;

                    uvs[6] = lu;
                    uvs[7] = tv;
                } else {
                    uvs[0] = lu;
                    uvs[1] = bv;

                    uvs[2] = lu;
                    uvs[3] = tv;

                    uvs[4] = ru;
                    uvs[5] = tv;

                    uvs[6] = ru;
                    uvs[7] = bv;
                }
            }
        }

        private _updateColors(color: Color4): void {
            const colors = this.colors;
            const r = color.r, g = color.g, b = color.b, a = color.a;

            for (let i = 0; i < 16; ++i) {
                colors[i] = r;
                colors[++i] = g;
                colors[++i] = b;
                colors[++i] = a;
            }
        }
    }

    export class RectSpriteMeshMaker implements ISpriteMeshMaker {
        protected static readonly _sharedRect = new SharedRect();

        public updateVertices(w: number, h: number, anchor: Vector2, f: SpriteFrame, m: Matrix44): boolean {
            return RectSpriteMeshMaker._sharedRect.updateVertices(w, h, anchor, f, m);
        }

        public updateAsset(f: SpriteFrame, tex: GLTexture2D, color: Color4): MeshAsset {
            return RectSpriteMeshMaker._sharedRect.updateAsset(f, tex, color);
        }
    }
}