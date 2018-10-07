///<reference path="AbstractRenderable.ts" />

namespace Aurora {
    export class Sprite extends AbstractRenderable {
        protected _assetStore: AssetStore;

        protected _frame: SpriteFrame = null;
        protected _texture: GLTexture2D = null;

        constructor() {
            super();

            this._assetStore = new AssetStore();
            this._assetStore.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, [], GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT, false, GLUsageType.DYNAMIC_DRAW));
            this._assetStore.shaderUniforms = new ShaderUniforms();
        }

        public get frame(): SpriteFrame {
            return this._frame;
        }

        public set frame(f: SpriteFrame) {
            if (this._frame !== f) {
                let oldTex = this._frame ? this._frame.texture : null;
                this._frame = f;

                if (oldTex === this._texture) {
                    this.texture = f ? f.texture : null;
                }
            }
        }

        public get texture(): GLTexture2D {
            return this._texture;
        }

        public set texture(tex: GLTexture2D) {
            if (this._texture !== tex) {
                this._texture = tex;
                if (tex) {
                    this._assetStore.shaderUniforms.setTexture(ShaderPredefined.u_DiffuseSampler, tex);
                } else {
                    this._assetStore.shaderUniforms.delete(ShaderPredefined.u_DiffuseSampler);
                }
            }
        }

        public isReady(): boolean {
            return true;
        }

        public visit(renderingObject: RenderingObject): AssetStore {
            return this._assetStore;
        }

        public destroy(): void {
            super.destroy();

            this.texture = null;
            this.frame = null;

            if (this._assetStore) {
                this._assetStore.destroy();
                this._assetStore = null;
            }
        }
    }
}