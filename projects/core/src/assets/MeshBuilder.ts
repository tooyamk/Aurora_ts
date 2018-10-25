namespace Aurora {
    export abstract class MeshBuilder {
        public static createBox(length: number, width: number, height: number, lengthSegs: uint = 1, widthSegs: uint = 1, heightSegs: uint = 1, generateUV: Boolean = true, generateNormal: boolean = false): MeshAsset {
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
            let asset = new MeshAsset();
            asset.vertexSources = vertexSources;

            let vertices: number[] = [];
            asset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, vertices, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT));

            let uvs: number[];
            if (generateUV) {
                uvs = [];
                asset.addVertexSource(new VertexSource(ShaderPredefined.a_UV0, uvs, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT));
            }

            let drawIndexSource = new DrawIndexSource();
            let drawIndices: uint[] = [];
            drawIndexSource.data = drawIndices;
            asset.drawIndexSource = drawIndexSource;

            let u: number;
            for (let l = 0; l <= lengthSegs; ++l) {
                let x = l * unitLength - halfLength;
                if (generateUV) u = l / lengthSegs;
                for (let w = 0; w <= widthSegs; ++w) {
                    let z = halfWidth - w * unitWidth;
                    vertices.push(x, halfHegiht, z, x, -halfHegiht, z);
                    if (generateUV) {
                        let v = w / widthSegs;
                        uvs.push(u, v, 1 - u, v);
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
                if (generateUV) u = l / lengthSegs;
                for (let h = 0; h <= heightSegs; ++h) {
                    let y = halfHegiht - h * unitHeight;
                    vertices.push(x, y, -halfWidth, x, y, halfWidth);
                    if (generateUV) {
                        let v = h / heightSegs;
                        uvs.push(u, v, 1 - u, v);
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
                if (generateUV) u = w / widthSegs;
                for (let h = 0; h <= heightSegs; ++h) {
                    let y = halfHegiht - h * unitHeight;
                    vertices.push(-halfLength, y, z, halfLength, y, z);
                    if (generateUV) {
                        let v = h / heightSegs;
                        uvs.push(u, v, 1 - u, v);
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

            if (generateNormal) asset.addVertexSource(MeshAssetHelper.createNormals(drawIndices, vertices));

            return asset;
        }

        public static createSphere(radius: number, segments: uint = 4, generateUV: boolean = true, generateNormal: boolean = false): MeshAsset {
            if (radius < 0) radius = 0;
            if (segments < 4) segments = 4;
            segments |= 0;

            let vertexSources = new Map<string, VertexSource>();
            let asset = new MeshAsset();
            asset.vertexSources = vertexSources;

            let numV = ((segments - 4) * 0.5 + 1) | 0;
            let angleX = Math.PI / (numV + 1);
            let angleY = MathUtils.PI2 / segments;

            let vertices: number[] = [];
            asset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, vertices, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT));

            vertices.push(0, radius, 0);

            let uvMax = 0;
            let uvs: number[];
            if (generateUV) {
                uvs = [];
                asset.addVertexSource(new VertexSource(ShaderPredefined.a_UV0, uvs, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT));

                uvs.push(0.5, 0);
                uvMax = numV + 1;
            }

            let curV: number;
            let rotX = 0;
            for (let i = 1; i <= numV; ++i) {
                rotX += angleX;
                let y = radius * Math.cos(rotX);
                let z = radius * Math.sin(rotX);
                let rotY = 0;
                if (generateUV) curV = i / uvMax;
                for (let j = 0; j <= segments; ++j) {
                    if (j === segments) rotY = 0;
                    rotY -= angleY;
                    let x = z * Math.cos(rotY);
                    let z1 = z * Math.sin(rotY);
                    vertices.push(x, y, z1);
                    if (generateUV) uvs.push(j / segments, curV);
                }
            }
            vertices.push(0, -radius, 0);
            if (generateUV) uvs.push(0.5, 1);

            let drawIndexSource = new DrawIndexSource();
            let drawIndices: uint[] = [];
            drawIndexSource.data = drawIndices;
            asset.drawIndexSource = drawIndexSource;
            for (let i = 1; i <= segments; ++i) drawIndices.push(0, i, i + 1);
            --numV;
            for (let i = 0; i < numV; ++i) {
                let h1 = 1 + i * (segments + 1);
                let h2 = h1 + segments + 1;
                for (let j = 0; j < segments; ++j) {
                    let idx1 = h1 + j;
                    let idx2 = h2 + j;
                    let idx3 = idx2 + 1;
                    drawIndices.push(idx1 + 1, idx1, idx3, idx1, idx2, idx3);
                }
            }
            let last = (vertices.length / 3 - 1) | 0;
            let idx = last - segments - 2;
            for (let i = 1; i <= segments; ++i) {
                let j = idx + i;
                drawIndices.push(last, j + 1, j);
            }

            if (generateNormal) asset.addVertexSource(MeshAssetHelper.createLerpNormals(drawIndices, vertices));

            return asset;
        }
    }
}