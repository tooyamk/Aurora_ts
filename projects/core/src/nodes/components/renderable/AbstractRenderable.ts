///<reference path="../../Node.ts" />

namespace Aurora {
    export abstract class AbstractRenderable extends Node.AbstractComponent {
        public renderer: AbstractRenderer = null;

        protected _materials: RefVector<Material> = null;
        protected _isInternalMaterialsVector = false;

        public getMaterials(): RefVector<Material> {
            return this._materials;
        }

        public setMaterials(mats: Material | RefVector<Material>) {
            if (mats instanceof Material) {
                if (this._isInternalMaterialsVector) {
                    const m = this._materials.at(0);
                    if (m !== mats) {
                        m.retain();
                        this._materials.erase(1, -1);
                        this._materials.insert(0, m);
                    } else {
                        this._materials.erase(1, -1);
                    }
                } else {
                    this._isInternalMaterialsVector = true;
                    const old = this._materials;
                    this._materials = new RefVector(mats);
                    this._materials.retain();
                    if (old) old.release();
                }
            } else {
                if (this._materials !== mats) {
                    if (mats) mats.retain();
                    if (this._materials) this._materials.release();
                    this._materials = mats;
                    this._isInternalMaterialsVector = false;
                }
            }

            if (this._materials !== mats) {
                if (mats) mats.retain();
                
                if (mats instanceof Material) {
                    if (this._isInternalMaterialsVector) {

                    } else {
                        if (this._materials) this._materials.release();
                    }
                } else {
                    if (this._materials) this._materials.release();
                    this._materials = mats;
                    this._isInternalMaterialsVector = false;
                }
            }
        }

        public checkRenderable(): boolean {
            //override
            return false;
        }

        public visit(renderingData: RenderingData): void {
            //override
        }

        public destroy(): void {
            this.setMaterials(null);
            this.renderer = null;

            super.destroy();
        }
    }
}