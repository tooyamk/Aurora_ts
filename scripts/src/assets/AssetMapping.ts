namespace MITOIA {
    export interface IAssetMapping {
        getVertexBuffer(info: GLProgramAttributeInfo, assetStore: AssetStore): GLVertexBuffer;
        getIndexBuffer(assetStore: AssetStore): GLIndexBuffer;
    }

    export class DefaultAssetMapping implements IAssetMapping {
        public static readonly Instance: DefaultAssetMapping = new DefaultAssetMapping();

        private _vertexNames: Set<string>[] = [];
        private _indexNames: Set<string> = new Set();

        constructor() {
            let set = new Set<string>();
            set.add("vertex");
            set.add("vertices");
            set.add("position");
            this._vertexNames.push(set);

            set = new Set<string>();
            set.add("uv");
            set.add("uv0");
            set.add("tc");
            set.add("tc0");
            set.add("texcoord");
            set.add("texcoord0");
            this._vertexNames.push(set);

            set = new Set<string>();
            set.add("normal");
            set.add("normals");
            this._vertexNames.push(set);

            this._indexNames.add("index");
            this._indexNames.add("indexes");
            this._indexNames.add("drawIndex");
            this._indexNames.add("drawIndexes");
        }

        public getVertexBuffer(info: GLProgramAttributeInfo, assetStore: AssetStore): GLVertexBuffer {
            if (assetStore && assetStore.vertexBuffers) {
                let buffer = assetStore.vertexBuffers.get(info.name);
                if (buffer) {
                    return buffer;
                } else {
                    for (let i = 0, n = this._vertexNames.length; i < n; ++i) {
                        let names = this._vertexNames[i];
                        if (names.has(info.name)) {
                            for (let n of names) {
                                buffer = assetStore.vertexBuffers.get(n);
                                if (buffer) return buffer;
                            }
                        }
                    }
                }
            }

            return null;
        }
        public getIndexBuffer(assetStore: AssetStore): GLIndexBuffer {
            if (assetStore && assetStore.indexBuffers) {
                for (let itr of assetStore.indexBuffers) return itr[1];
            }

            return null;
        }
    }
}