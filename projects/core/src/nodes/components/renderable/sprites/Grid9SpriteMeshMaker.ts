///<reference path="ISpriteMeshMaker.ts"/>

namespace Aurora {
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

        public readonly vertexSource: VertexSource;
        public readonly uvSource: VertexSource;
        public readonly colorSource: VertexSource;
        public readonly column1drawIndexSource: DrawIndexSource;
        public readonly column2drawIndexSource: DrawIndexSource;
        public readonly column3drawIndexSource: DrawIndexSource;

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
            this.vertexSource = new VertexSource(ShaderPredefined.a_Position0, this.vertices, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW);
            this.asset.addVertexSource(this.vertexSource);

            this.uvs = [];
            this.uvs.length = 32;
            this.uvSource = new VertexSource(ShaderPredefined.a_UV0, this.uvs, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW);
            this.asset.addVertexSource(this.uvSource);

            this.colors = [];
            this.colors.length = 64;
            this.colorSource = new VertexSource(ShaderPredefined.a_Color0, this.colors, GLVertexBufferSize.FOUR, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW);
            this.asset.addVertexSource(this.colorSource);

            this.column1drawIndexSource = new DrawIndexSource([
                0, 1, 3, 0, 3, 2,
                2, 3, 5, 2, 5, 4,
                4, 5, 7, 4, 7, 6
            ], GLIndexDataType.UNSIGNED_SHORT, GLUsageType.DYNAMIC_DRAW);

            this.column2drawIndexSource = new DrawIndexSource([
                0, 1, 4, 0, 4, 3,
                1, 2, 5, 1, 5, 4,
                3, 4, 7, 3, 7, 6,
                4, 5, 8, 4, 8, 7,
                6, 7, 10, 6, 10, 9,
                7, 8, 11, 7, 11, 10
            ], GLIndexDataType.UNSIGNED_SHORT, GLUsageType.DYNAMIC_DRAW);

            this.column3drawIndexSource = new DrawIndexSource([
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

        public updateVertices(width: number, height: number, anchor: Vector2, frame: SpriteFrame, m: Matrix44, grid9: Grid9SpriteMeshMaker): boolean {
            const v = SharedGrid9._tmpVec2;

            let lxTrim = -frame.sourceWidth * anchor.x + frame.offsetX;
            let tyTrim = -frame.sourceHeight * anchor.y + frame.sourceHeight - frame.offsetY;
            let rxTrim = lxTrim + frame.width;
            let byTrim = tyTrim - frame.height;

            if (width === null) {
                width = frame.sourceWidth;
            } else {
                const s = width / frame.sourceWidth;
                lxTrim *= s;
                rxTrim *= s;
            }
            if (height === null) {
                height = frame.sourceHeight;
            } else {
                const s = height / frame.sourceHeight;
                tyTrim *= s;
                byTrim *= s;
            }

            const lx = -width * anchor.x;
            const by = -height * anchor.y;
            const rx = lx + width;
            const ty = by + height;

            let mlx: number, mrx: number, mby: number, mty: number;
            if (width > grid9.width) {
                mlx = lx + grid9.left;
                mrx = rx - grid9.right;
            } else {
                mlx = lx + grid9.leftRatio * width;
                mrx = mlx;
            }
            if (height > grid9.height) {
                mby = by + grid9.bottom;
                mty = ty - grid9.top;
            } else {
                mby = by + grid9.bottomRatio * height;
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

            let n = this.numRows * this.numColumns;
            this.numElements = n;
            n <<= 1;

            for (let i = 0; i < n; i += 2) {
                m.transform44XY(vertices[i], vertices[i + 1], v);
                vertices[i] = v.x;
                vertices[i + 1] = v.y;
            }

            const elementsPerRow = this.numColumns << 1;
            return Sprite.isInViewportRect(this.vertices, 0, elementsPerRow - 2, n - elementsPerRow, n - 2);
        }

        public updateAsset(frame: SpriteFrame, tex: GLTexture2D, color: Color4): MeshAsset {
            this._updateUVs(frame, tex);
            this._updateColors(color);

            let asset = this.asset;

            this.vertexSource.length = this.numElements << 1;
            this.uvSource.length = this.numElements << 1;
            this.colorSource.length = this.numElements << 2;
            const drawIndexSource = this.numColumns > 3 ? this.column3drawIndexSource : (this.numColumns > 2 ? this.column2drawIndexSource : this.column1drawIndexSource);
            drawIndexSource.length = (this.numRows - 1) * (this.numColumns - 1) * 6;
            asset.drawIndexSource = drawIndexSource;

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

            const numElements = this.numElements << 1;
            const elementsPerRow = this.numColumns << 1;
            const rt = elementsPerRow - 2;
            const lb = numElements - elementsPerRow;
            const rb = numElements - 2;

            const rotated = f.rotated;

            if (rotated === 0) {
                const ru = lu + f.width / texW;
                const bv = tv + f.height / texH;

                for (let i = 0; i < numElements; i += elementsPerRow) uvs[i] = lu;

                if (this.hasLeft) {
                    const u = lu + this.leftOffset / texW;
                    for (let i = 2; i < numElements; i += elementsPerRow) uvs[i] = u;
                }

                if (this.hasRight) {
                    const u = ru - this.rightOffset / texW;
                    for (let i = rt - 2; i < numElements; i += elementsPerRow) uvs[i] = u;
                }

                for (let i = rt; i < numElements; i += elementsPerRow) uvs[i] = ru;

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
            } else {
                const ru = lu + f.height / texW;
                const bv = tv + f.width / texH;

                if (rotated > 0) {
                    for (let i = 0; i < elementsPerRow; i += 2) uvs[i] = ru;

                    if (this.hasTop) {
                        const u = ru - this.topOffset / texW;
                        const offst = elementsPerRow;
                        for (let i = 0; i < elementsPerRow; i += 2) uvs[i + offst] = u;
                    }

                    if (this.hasBottom) {
                        const u = lu + this.bottomOffset / texW;
                        const offst = lb - elementsPerRow;
                        for (let i = 0; i < elementsPerRow; i += 2) uvs[i + offst] = u;
                    }

                    const offst = lb;
                    for (let i = 0; i < elementsPerRow; i += 2) uvs[i + offst] = lu;

                    for (let i = 1; i < numElements; i += elementsPerRow) uvs[i] = tv;

                    if (this.hasLeft) {
                        const v = tv + this.leftOffset / texH;
                        for (let i = 3; i < numElements; i += elementsPerRow) uvs[i] = v;
                    }

                    if (this.hasRight) {
                        const v = bv - this.rightOffset / texH;
                        for (let i = rt - 1; i < numElements; i += elementsPerRow) uvs[i] = v;
                    }

                    for (let i = rt + 1; i < numElements; i += elementsPerRow) uvs[i] = bv;
                } else {
                    for (let i = 0; i < elementsPerRow; i += 2) uvs[i] = lu;

                    if (this.hasTop) {
                        const u = lu + this.topOffset / texW;
                        const offst = elementsPerRow;
                        for (let i = 0; i < elementsPerRow; i += 2) uvs[i + offst] = u;
                    }

                    if (this.hasBottom) {
                        const u = ru - this.bottomOffset / texW;
                        const offst = lb - elementsPerRow;
                        for (let i = 0; i < elementsPerRow; i += 2) uvs[i + offst] = u;
                    }

                    const offst = lb;
                    for (let i = 0; i < elementsPerRow; i += 2) uvs[i + offst] = ru;

                    for (let i = 1; i < numElements; i += elementsPerRow) uvs[i] = bv;

                    if (this.hasLeft) {
                        const v = bv - this.leftOffset / texH;
                        for (let i = 3; i < numElements; i += elementsPerRow) uvs[i] = v;
                    }

                    if (this.hasRight) {
                        const v = tv + this.rightOffset / texH;
                        for (let i = rt - 1; i < numElements; i += elementsPerRow) uvs[i] = v;
                    }

                    for (let i = rt + 1; i < numElements; i += elementsPerRow) uvs[i] = tv;
                }
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

    export class Grid9SpriteMeshMaker implements ISpriteMeshMaker {
        protected static readonly _sharedGrid9 = new SharedGrid9();

        protected _top: number = 0;
        protected _right: number = 0;
        protected _bottom: number = 0;
        protected _left: number = 0;

        protected _topRatio: number = 0;
        protected _rightRatio: number = 0;
        protected _bottomRatio: number = 0;
        protected _leftRatio: number = 0;

        protected _width: number = 0;
        protected _height: number = 0;

        constructor(top: number, right: number, bottom: number, left: number) {
            this.set(top, right, bottom, left);
        }

        public get top(): number {
            return this._top;
        }

        public get right(): number {
            return this._right;
        }

        public get bottom(): number {
            return this._bottom;
        }

        public get left(): number {
            return this._left;
        }

        public get topRatio(): number {
            return this._topRatio;
        }

        public get rightRatio(): number {
            return this._rightRatio;
        }

        public get bottomRatio(): number {
            return this._bottomRatio;
        }

        public get leftRatio(): number {
            return this._leftRatio;
        }

        public get width(): number {
            return this._width;
        }

        public get height(): number {
            return this._height;
        }

        public set(top: number, right: number, bottom: number, left: number): void {
            this._top = top < 0 ? 0 : top;
            this._right = right < 0 ? 0 : right;
            this._bottom = bottom < 0 ? 0 : bottom;
            this._left = left < 0 ? 0 : left;

            this._width = this._left + this._right;
            this._height = this._top + this._bottom;

            if (this._width > 0) {
                this._leftRatio = this._left / this._width;
                this._rightRatio = 1 - this._leftRatio;
            } else {
                this._leftRatio = 0;
                this._rightRatio = 0;
            }

            if (this._height > 0) {
                this._bottomRatio = this._bottom / this._height;
                this._topRatio = 1 - this.top;
            } else {
                this._bottomRatio = 0;
                this._topRatio = 0;
            }
        }

        public updateVertices(w: number, h: number, anchor: Vector2, f: SpriteFrame, m: Matrix44): boolean {
            return Grid9SpriteMeshMaker._sharedGrid9.updateVertices(w, h, anchor, f, m, this);
        }

        public updateAsset(f: SpriteFrame, tex: GLTexture2D, color: Color4): MeshAsset {
            return Grid9SpriteMeshMaker._sharedGrid9.updateAsset(f, tex, color);
        }
    }
}