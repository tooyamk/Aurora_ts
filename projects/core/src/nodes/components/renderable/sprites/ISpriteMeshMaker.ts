namespace Aurora {
    export interface ISpriteMeshMaker {
        updateVertices(width: number, height: number, anchor: Vector2, frame: SpriteFrame, m: Matrix44): boolean;
        updateAsset(frame: SpriteFrame, tex: GLTexture2D, color: Color4): MeshAsset;
    }
}