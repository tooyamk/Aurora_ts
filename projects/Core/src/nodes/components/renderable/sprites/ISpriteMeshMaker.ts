namespace Aurora {
    export interface ISpriteMeshMaker {
        updateVertices(w: number, h: number, anchor: Vector2, f: SpriteFrame, m: Matrix44): boolean;
        updateAsset(f: SpriteFrame, tex: GLTexture2D, color: Color4): MeshAsset;
    }
}