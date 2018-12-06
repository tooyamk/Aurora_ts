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

        public updateVertices(width: number, height: number, anchor: Vector2, frame: SpriteFrame, m: Matrix44): boolean {
            const v = SharedRect._tmpVec2;

            let lx = -frame.sourceWidth * anchor.x + frame.offsetX;
            let ty = -frame.sourceHeight * anchor.y + frame.sourceHeight - frame.offsetY;
            let rx = lx + frame.width;
            let by = ty - frame.height;

            if (width !== null) {
                const s = width / frame.sourceWidth;
                lx *= s;
                rx *= s;
            }
            if (height !== null) {
                const s = height / frame.sourceHeight;
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

        private _updateUVs(frame: SpriteFrame, tex: GLTexture2D): void {
            const uvs = this.uvs;

            const texW = frame.texWidth < 0 ? tex.width : frame.texWidth, texH = frame.texHeight < 0 ? tex.height : frame.texHeight;

            const lu = frame.x / texW;
            const tv = frame.y / texH;

            const rotated = frame.rotated;

            if (rotated === 0) {
                const ru = lu + frame.width / texW;
                const bv = tv + frame.height / texH;

                uvs[0] = lu;
                uvs[1] = tv;

                uvs[2] = ru;
                uvs[3] = tv;

                uvs[4] = ru;
                uvs[5] = bv;

                uvs[6] = lu;
                uvs[7] = bv;
            } else {
                const ru = lu + frame.height / texW;
                const bv = tv + frame.width / texH;

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

    function createDefault(): SpriteRectMeshMaker {
        const maker = new SpriteRectMeshMaker();
        maker.retain();
        return maker;
    }

    export class SpriteRectMeshMaker extends Sprite.AbstractMeshMaker {
        public static readonly DEFAULT = createDefault();
        protected static readonly _sharedRect = new SharedRect();

        public updateVertices(w: number, h: number, anchor: Vector2, f: SpriteFrame, m: Matrix44): boolean {
            return SpriteRectMeshMaker._sharedRect.updateVertices(w, h, anchor, f, m);
        }

        public updateAsset(f: SpriteFrame, tex: GLTexture2D, color: Color4): MeshAsset {
            return SpriteRectMeshMaker._sharedRect.updateAsset(f, tex, color);
        }

        public destroy(): void {
        }
    }
}