///<reference path="AbstractRenderable.ts" />

namespace Aurora {
    class Grid9 {
        public enabled = true;
        public top: number = 0;
        public right: number = 0;
        public bottom: number = 0;
        public left: number = 0;

        public topRatio: number = 0;
        public rightRatio: number = 0;
        public bottomRatio: number = 0;
        public leftRatio: number = 0;

        public width: number = 0;
        public height: number = 0;

        public set(top: number, right: number, bottom: number, left: number): void {
            this.top = top < 0 ? 0 : top;
            this.right = right < 0 ? 0 : right;
            this.bottom = bottom < 0 ? 0 : bottom;
            this.left = left < 0 ? 0 : left;

            this.width = this.left + this.right;
            this.height = this.top + this.bottom;

            if (this.width > 0) {
                this.leftRatio = this.left / this.width;
                this.rightRatio = 1 - this.leftRatio;
            } else {
                this.leftRatio = 0;
                this.rightRatio = 0;
            }

            if (this.height > 0) {
                this.bottomRatio = this.bottom / this.height;
                this.topRatio = 1 - this.top;
            } else {
                this.bottomRatio = 0;
                this.topRatio = 0;
            }
        }
    }

    class SharedQuad {
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
            const v = SharedQuad._tmpVec2;

            const sx = w === null ? 1 : w / f.sourceWidth;
            const sy = h === null ? 1 : h / f.sourceHeight;

            let lx = -f.sourceWidth * anchor.x + f.offsetX;
            let ty = -f.sourceHeight * anchor.y + f.sourceHeight - f.offsetY;
            let rx = lx + f.width;
            let by = ty - f.height;

            if (sx !== 1) {
                lx *= sx;
                rx *= sx;
            }
            if (sy !== 1) {
                by *= sy;
                ty *= sy;
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
            const ru = lu + f.width / texW;
            const bv = tv + f.height / texH;

            const rotated = f.rotated;

            if (rotated === 0) {
                uvs[0] = lu;
                uvs[1] = tv;

                uvs[2] = ru;
                uvs[3] = tv;

                uvs[4] = ru;
                uvs[5] = bv;

                uvs[6] = lu;
                uvs[7] = bv;
            } else if (rotated > 0) {
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

    /*
     *00, 01, 02, 03
     *04, 05, 06, 07
     *08, 09, 10, 11
     *12, 13, 14, 15
     */
    class SharedGrid9 {
        private static readonly _tmpVec2 = new Vector2();

        public numRows: uint = 0;
        public readonly rows: number[];
        public numColumns: uint = 0;
        public readonly columns: number[];

        public readonly asset: MeshAsset;
        public readonly vertices: number[];
        public readonly uvs: number[];
        public readonly colors: number[];

        public numElements: uint = 0;

        public hasLeft = false;
        public hasRight = false;
        public hasTop = false;
        public hasBottom = false;

        public leftOffset: number = 0;
        public rightOffset: number = 0;
        public topOffset: number = 0;
        public bottomOffset: number = 0;

        constructor() {
            this.asset = new MeshAsset();
            this.asset.retain();

            this.rows = [];
            this.rows.length = 4;

            this.columns = [];
            this.columns.length = 4;

            this.vertices = [];
            this.vertices.length = 32;
            this.asset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, this.vertices, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));

            this.uvs = [];
            this.uvs.length = 32;
            this.asset.addVertexSource(new VertexSource(ShaderPredefined.a_UV0, this.uvs, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));

            this.colors = [];
            this.colors.length = 64;
            this.asset.addVertexSource(new VertexSource(ShaderPredefined.a_Color0, this.colors, GLVertexBufferSize.FOUR, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));

            this.asset.drawIndexSource = new DrawIndexSource([
                0, 1, 5, 0, 5, 4,
                1, 2, 6, 1, 6, 5,
                2, 3, 7, 2, 7, 6,
                4, 5, 9, 4, 9, 8,
                5, 6, 10, 5, 10, 9,
                6, 7, 11, 6, 11, 10,
                8, 9, 13, 8, 13, 12,
                9, 10, 14, 9, 14, 13,
                10, 11, 15, 10, 15, 14
            ], GLIndexDataType.UNSIGNED_SHORT, GLUsageType.DYNAMIC_DRAW);
        }

        public updateVertices(w: number, h: number, anchor: Vector2, f: SpriteFrame, m: Matrix44, grid9: Grid9): boolean {
            const v = SharedGrid9._tmpVec2;

            if (w === null) w = f.sourceWidth;
            if (h === null) h = f.sourceHeight;

            const lx = -w * anchor.x;
            const by = -h * anchor.y;
            const rx = lx + w;
            const ty = by + h;

            const lxTrim = lx + f.offsetX;
            const tyTrim = by + h - f.offsetY;
            const rxTrim = lxTrim + f.width;
            const byTrim = tyTrim - f.height;

            let mlx: number, mrx: number, mby: number, mty: number;
            if (w > grid9.width) {
                mlx = lx + grid9.left;
                mrx = rx - grid9.right;
            } else {
                mlx = lx + grid9.leftRatio * w;
                mrx = mlx;
            }
            if (h > grid9.height) {
                mby = by + grid9.bottom;
                mty = ty - grid9.top;
            } else {
                mby = by + grid9.bottomRatio * h;
                mty = mty;
            }

            let numRows = 0, numColumns = 0;
            const rows = this.rows, columns = this.columns;

            rows[numRows++] = tyTrim;
            if (grid9.top) {
                const offset = grid9.top - ty + tyTrim;
                if (offset > 0) {
                    this.hasTop = true;
                    this.topOffset = offset;

                    rows[numRows++] = mty;
                }
            }
            if (grid9.bottom) {
                const offset = grid9.bottom - byTrim + by;
                if (offset > 0) {
                    this.hasBottom = true;
                    this.bottomOffset = offset;

                    rows[numRows++] = mby;
                }
            }
            rows[numRows++] = byTrim;

            columns[numColumns++] = lxTrim;
            if (grid9.left) {
                const offset = grid9.left - lxTrim + lx;
                if (offset > 0) {
                    this.hasLeft = true;
                    this.leftOffset = offset;

                    columns[numColumns++] = mlx;
                }
            }
            if (grid9.right) {
                const offset = grid9.right - rx + rxTrim;
                if (offset > 0) {
                    this.hasRight = true;
                    this.rightOffset = offset;

                    columns[numColumns++] = mrx;
                }
            }
            columns[numColumns++] = rxTrim;

            this.numRows = numRows;
            this.numColumns = numColumns;

            const vertices = this.vertices;

            let len = 0;
            for (let r = 0; r < this.numRows; ++r) {
                const y = rows[r];
                for (let c = 0; c < this.numColumns; ++c) {
                    vertices[len++] = columns[c];
                    vertices[len++] = y;
                }
            }

            this.numElements = (this.numRows * this.numColumns) << 1;

            for (let i = 0; i < this.numElements; i += 2) {
                m.transform44XY(vertices[i], vertices[i + 1], v);
                vertices[i] = v.x;
                vertices[i + 1] = v.y;
            }

            const elementsPerRow = this.numColumns << 1;
            return Sprite.isInViewportRect(this.vertices, 0, elementsPerRow - 2, this.numElements - elementsPerRow, this.numElements - 2);
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
            const ru = lu + f.width / texW;
            const bv = tv + f.height / texH;

            const elementsPerRow = this.numColumns << 1;
            const rt = elementsPerRow - 2;
            const lb = this.numElements - elementsPerRow;
            const rb = this.numElements - 2;

            let mlu: number, mru: number, mbv: number, mtv: number;
            if (this.hasLeft) mlu = lu + this.leftOffset / texW;
            if (this.hasRight) mru = ru - this.rightOffset / texW;
            if (this.hasTop) mtv = tv + this.topOffset / texH;
            if (this.hasBottom) mbv = bv - this.bottomOffset / texH;

            const rotated = f.rotated;

            if (rotated === 0) {
                for (let i = 0; i < rb; i += elementsPerRow) uvs[i] = lu;

                if (this.hasLeft) {
                    const u = lu + this.leftOffset / texW;
                    for (let i = 2; i < rb; i += elementsPerRow) uvs[i] = u;
                }

                if (this.hasRight) {
                    const u = ru - this.rightOffset / texW;
                    for (let i = rt - 2; i < rb; i += elementsPerRow) uvs[i] = u;
                }

                for (let i = rt; i < rb; i += elementsPerRow) uvs[i] = ru;

                for (let i = 1; i < elementsPerRow; i += 2) uvs[i] = tv;

                if (this.hasTop) {
                    const v = tv + this.topOffset / texH;
                    const offst = elementsPerRow;
                    for (let i = 1; i < elementsPerRow; i += 2) uvs[i + offst] = v;
                }

                if (this.hasBottom) {
                    const v = bv - this.bottomOffset / texH;
                    const offst = lb - elementsPerRow;
                    for (let i = 1; i < elementsPerRow; i += 2) uvs[i + offst] = v;
                }

                const offst = lb;
                for (let i = 1; i < elementsPerRow; i += 2) uvs[i + offst] = bv;
            } else if (rotated > 0) {
                uvs[0] = ru;
                uvs[1] = tv;

                uvs[rt] = ru;
                uvs[rt + 1] = bv;

                uvs[rb] = lu;
                uvs[rb + 1] = bv;

                uvs[lb] = lu;
                uvs[lb + 1] = tv;
            } else {
                uvs[0] = lu;
                uvs[1] = bv;

                uvs[rt] = lu;
                uvs[rt + 1] = tv;

                uvs[rb] = ru;
                uvs[rb + 1] = tv;

                uvs[lb] = ru;
                uvs[lb + 1] = bv;
            }
        }

        private _updateColors(color: Color4): void {
            const colors = this.colors;
            const r = color.r, g = color.g, b = color.b, a = color.a;

            for (let i = 0, n = this.numElements << 2; i < n; ++i) {
                colors[i] = r;
                colors[++i] = g;
                colors[++i] = b;
                colors[++i] = a;
            }
        }
    }

    const createDefaultSpriteFrame = () => {
        const f = new SpriteFrame();
        f.retain();
        return f;
    }

    export class Sprite extends AbstractRenderable {
        protected static readonly _tmpVec2 = new Vector2();
        protected static readonly _tmpColor4 = new Color4();
        protected static readonly _defaultSpriteFrame = createDefaultSpriteFrame();
        protected static readonly _sharedQuad = new SharedQuad();
        protected static readonly _sharedGrid9 = new SharedGrid9();

        protected _frame: SpriteFrame = null;
        protected _texture: GLTexture2D = null;

        protected _uniforms: ShaderUniforms;

        protected _anchor: Vector2;
        protected _color: Color4;
        protected _width: number = null;
        protected _height: number = null;
        protected _grid9: Grid9 = null;

        constructor() {
            super();

            this._anchor = new Vector2(0.5, 0.5);
            this._color = Color4.WHITE;
            this._uniforms = new ShaderUniforms();
            this._uniforms.retain();
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

        public setGrid9(top: number, right: number, bottom: number, left: number): void {
            if (this._grid9) {
                this._grid9.enabled = true;
            } else {
                this._grid9 = new Grid9();
            }
            this._grid9.set(top, right, bottom, left);
        }

        public clearGrid9(): void {
            if (this._grid9) this._grid9.enabled = false;
        }

        public checkRenderable(): boolean {
            return this._texture && this._texture.width > 0 && this._texture.height > 0 && this._color.a > 0 && this._node.readonlyCascadeColor.a > 0;
        }

        public visit(renderingData: RenderingData): void {
            if (this._texture) {
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

                if (f.width > 0 && f.height > 0) this._visit(f, renderingData);
            }
        }

        protected _visit(frame: SpriteFrame, renderingData: RenderingData): void {
            const grid9 = this._grid9;
            if (grid9 && grid9.enabled) {
                const data = Sprite._sharedGrid9;
                if (data.updateVertices(this._width, this._height, this._anchor, frame, renderingData.in.renderingObject.l2p, grid9)) {
                    const c0 = this.node.readonlyCascadeColor, c1 = this._color;
                }
            } else {
                const data = Sprite._sharedQuad;
                if (data.updateVertices(this._width, this._height, this._anchor, frame, renderingData.in.renderingObject.l2p)) {
                    const c0 = this.node.readonlyCascadeColor, c1 = this._color;
                    const asset = data.updateAsset(frame, this._texture, Sprite._tmpColor4.setFromNumbers(c0.r * c1.r, c0.g * c1.g, c0.b * c1.b, c0.a * c1.a));
                    renderingData.out.asset = asset;
                    renderingData.out.uniformsList.pushBack(this._uniforms);
                }
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
            this._grid9 = null;

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