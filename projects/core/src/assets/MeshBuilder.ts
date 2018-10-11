namespace Aurora {
    export abstract class MeshBuilder {
        public static createBox(length: number, width: number, height: number, lengthSegs: uint = 1, widthSegs: uint = 1, heightSegs: uint = 1, generateTexCoords: Boolean = true, generateNormals: boolean = false): AssetsStore {
            if (lengthSegs < 1) lengthSegs = 1;
            lengthSegs |= 0;

            if (widthSegs < 1) widthSegs = 1;
            widthSegs |= 0;

            if (heightSegs < 1) heightSegs = 1;
            heightSegs |= 0;

            let unitLength = length / lengthSegs;
            let unitWidth = width / widthSegs;
            let unitHeight = height / heightSegs;
            
            let halfLength = length * 0.5;
            let halfWidth = width * 0.5;
            let halfHegiht = height * 0.5;

            let vertexSources = new Map<string, VertexSource>();
            let assetStore = new AssetsStore();
            assetStore.vertexSources = vertexSources;

            let vertices: number[] = [];
            assetStore.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, vertices, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT));

            let texCoords: number[];
            if (generateTexCoords) {
                texCoords = [];
                assetStore.addVertexSource(new VertexSource(ShaderPredefined.a_TexCoord0, texCoords, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT));
            }

            let drawIndexSource = new DrawIndexSource();
            let drawIndices: uint[] = [];
            drawIndexSource.data = drawIndices;
            assetStore.drawIndexSource = drawIndexSource;

            let u: number;
            for (let l = 0; l <= lengthSegs; ++l) {
                let x = l * unitLength - halfLength;
                if (generateTexCoords) u = l / lengthSegs;
                for (let w = 0; w <= widthSegs; ++w) {
                    let z = halfWidth - w * unitWidth;
                    vertices.push(x, halfHegiht, z, x, -halfHegiht, z);
                    if (generateTexCoords) {
                        let v = w / widthSegs;
                        texCoords.push(u, v, 1 - u, v);
                    }
                }
            }

            for (let i = 0, n = lengthSegs * widthSegs; i < n; ++i) {
                let i1 = i + 2;
                let i2 = i + ((1 + widthSegs) << 1);
                drawIndices.push(i1, i, i2, i2, i2 + 2, i1, i2 + 1, i + 1, i1 + 1, i1 + 1, i2 + 3, i2 + 1);
            }

            for (let l = 0; l <= lengthSegs; ++l) {
                let x = l * unitLength - halfLength;
                if (generateTexCoords) u = l / lengthSegs;
                for (let h = 0; h <= heightSegs; ++h) {
                    let y = halfHegiht - h * unitHeight;
                    vertices.push(x, y, -halfWidth, x, y, halfWidth);
                    if (generateTexCoords) {
                        let v = h / heightSegs;
                        texCoords.push(u, v, 1 - u, v);
                    }
                }
            }

            let start = ((lengthSegs + 1) * (widthSegs + 1)) << 1;
            for (let i = 0, n = lengthSegs * heightSegs; i < n; ++i) {
                let i0 = start + i;
                let i1 = i0 + 2;
                let i2 = i0 + ((1 + heightSegs) << 1);
                drawIndices.push(i1, i0, i2, i2, i2 + 2, i1, i2 + 1, i0 + 1, i1 + 1, i1 + 1, i2 + 3, i2 + 1);
            }

            for (let w = 0; w <= widthSegs; ++w) {
                let z = halfWidth -  w * unitWidth;
                if (generateTexCoords) u = w / widthSegs;
                for (let h = 0; h <= heightSegs; ++h) {
                    let y = halfHegiht - h * unitHeight;
                    vertices.push(-halfLength, y, z, halfLength, y, z);
                    if (generateTexCoords) {
                        let v = h / heightSegs;
                        texCoords.push(u, v, 1 - u, v);
                    }
                }
            }

            start += ((lengthSegs + 1) * (heightSegs + 1)) << 1;
            for (let i = 0, n = widthSegs * heightSegs; i < n; ++i) {
                let i0 = start + i;
                let i1 = i0 + 2;
                let i2 = i0 + ((1 + heightSegs) << 1);
                drawIndices.push(i1, i0, i2, i2, i2 + 2, i1, i2 + 1, i0 + 1, i1 + 1, i1 + 1, i2 + 3, i2 + 1);
            }

            if (generateNormals) assetStore.addVertexSource(MeshAssetHelper.createNormals(drawIndices, vertices));

            return assetStore;
        }

        public static createSphere(radius: number, segments: uint = 4, generateTexCoords: boolean = true, generateNormals: boolean = false): AssetsStore {
            if (radius < 0) radius = 0;
            if (segments < 4) segments = 4;
            segments |= 0;

            let vertexSources = new Map<string, VertexSource>();
            let assetStore = new AssetsStore();
            assetStore.vertexSources = vertexSources;

            let numV = ((segments - 4) * 0.5 + 1) | 0;
            let d = radius * 2;
            let angleX = Math.PI / (numV + 1);
            let angleY = Math.PI * 2 / segments;

            let vertices: number[] = [];
            assetStore.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, vertices, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT));

            vertices.push(0, radius, 0);

            let uvMax = 0;
            let texCoords: number[];
            if (generateTexCoords) {
                texCoords = [];
                assetStore.addVertexSource(new VertexSource(ShaderPredefined.a_TexCoord0, texCoords, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT));

                texCoords.push(0.5, 0);
                uvMax = numV + 1;
            }

            let currentV: number;
            let rotationX = 0;
            for (let i = 1; i <= numV; ++i) {
                rotationX += angleX;
                let y = radius * Math.cos(rotationX);
                let z = radius * Math.sin(rotationX);
                let rotationY = 0;
                if (generateTexCoords) currentV = i / uvMax;
                for (let j = 0; j <= segments; ++j) {
                    if (j === segments) rotationY = 0;
                    rotationY -= angleY;
                    let x = z * Math.cos(rotationY);
                    let z1 = z * Math.sin(rotationY);
                    vertices.push(x, y, z1);
                    if (generateTexCoords) texCoords.push(j / segments, currentV);
                }
            }
            vertices.push(0, -radius, 0);
            if (generateTexCoords) texCoords.push(0.5, 1);

            let drawIndexSource = new DrawIndexSource();
            let drawIndices: uint[] = [];
            drawIndexSource.data = drawIndices;
            assetStore.drawIndexSource = drawIndexSource;
            for (let i = 1; i <= segments; ++i) {
                drawIndices.push(0, i, i + 1);
            }
            --numV;
            for (let i = 0; i < numV; ++i) {
                let h1 = 1 + i * (segments + 1);
                let h2 = h1 + segments + 1;
                for (let j = 0; j < segments; ++j) {
                    let index1 = h1 + j;
                    let index2 = h2 + j;
                    let index3 = index2 + 1;
                    drawIndices.push(index1 + 1, index1, index3, index1, index2, index3);
                }
            }
            let last = (vertices.length / 3 - 1) | 0;
            let index = last - segments - 2;
            for (let i = 1; i <= segments; ++i) {
                let j = index + i;
                drawIndices.push(last, j + 1, j);
            }

            if (generateNormals) assetStore.addVertexSource(MeshAssetHelper.createLerpNormals(drawIndices, vertices));

            return assetStore;
        }
    }
}