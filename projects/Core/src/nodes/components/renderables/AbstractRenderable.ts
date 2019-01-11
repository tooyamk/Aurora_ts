///<reference path="../../Node.ts"/>

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
                        this._materials.set(0, m);
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
            } else if (this._materials !== mats) {
                if (mats) mats.retain();
                if (this._materials) this._materials.release();
                this._materials = mats;
                this._isInternalMaterialsVector = false;
            }
        }

        public abstract collect(material: Material, alternativeMaterials: Material, appendFn: AppendRenderingObjectFn): void;
        public abstract checkRenderable(): boolean;
        public abstract postRender(): void;

        public destroy(): void {
            this.setMaterials(null);
            this.renderer = null;

            super.destroy();
        }
    }
}