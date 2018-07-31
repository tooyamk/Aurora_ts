namespace MITOIA {
    export class AssetStore {
        public vertexBuffers: Map<string, GLVertexBuffer> = new Map();
        public indexBuffers: Map<string, GLIndexBuffer> = new Map();

        public assetMapping: IAssetMapping = null;

        public getVertexBuffer(info: GLProgramAttributeInfo): GLVertexBuffer {
            return (this.assetMapping ? this.assetMapping : DefaultAssetMapping.Instance).getVertexBuffer(info, this);
        }

        public getIndexBuffer(): GLIndexBuffer {
            return (this.assetMapping ? this.assetMapping : DefaultAssetMapping.Instance).getIndexBuffer(this);
        }
    }
}