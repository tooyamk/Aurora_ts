namespace Aurora {
    export abstract class MeshBuilder {
        public static createBox(length: number, width: number, height: number, lengthSegs: uint = 1, widthSegs: uint = 1, heightSegs: uint = 1, generateUV: Boolean = true, generateNormal: boolean = false): MeshAsset {
            if (lengthSegs < 1) lengthSegs = 1;
            lengthSegs |= 0;

            if (widthSegs < 1) widthSegs = 1;
            widthSegs |= 0;

            if (heightSegs < 1) heightSegs = 1;
            heightSegs |= 0;

            const unitLength = length / lengthSegs;
            const unitWidth = width / widthSegs;
            const unitHeight = height / heightSegs;
            
            const halfLength = length * 0.5;
            const halfWidth = width * 0.5;
            const halfHegiht = height * 0.5;

            const vertexSources = new Map<string, VertexSource>();
            const asset = new MeshAsset();
            asset.vertexSources = vertexSources;

            const numVertices = ((lengthSegs + 1) * (widthSegs + 1) + (lengthSegs + 1) * (heightSegs + 1) + (widthSegs + 1) * (heightSegs + 1)) << 1;

            const vertices = new Float32Array(numVertices * 3);
            let vertIdx = 0;
            asset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, vertices, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT));

            let uvs: Float32Array;
            let uvIdx = 0;
            if (generateUV) {
                uvs = new Float32Array(numVertices << 1);
                asset.addVertexSource(new VertexSource(ShaderPredefined.a_UV0, uvs, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT));
            }

            const drawIndexInfo = MeshAssetHelper.createBinaryDrawIndexSourceData((lengthSegs * widthSegs + lengthSegs * heightSegs + widthSegs * heightSegs) * 12, numVertices);
            let drawIndices = drawIndexInfo[0];
            let drawIdx = 0;
            const drawIndexSource = new DrawIndexSource(drawIndices, drawIndexInfo[1]);
            asset.drawIndexSource = drawIndexSource;

            let u: number;
            for (let l = 0; l <= lengthSegs; ++l) {
                const x = l * unitLength - halfLength;
                if (generateUV) u = l / lengthSegs;
                for (let w = 0; w <= widthSegs; ++w) {
                    const z = halfWidth - w * unitWidth;
                    vertices[vertIdx++] = x;
                    vertices[vertIdx++] = halfHegiht;
                    vertices[vertIdx++] = z;
                    vertices[vertIdx++] = x;
                    vertices[vertIdx++] = -halfHegiht;
                    vertices[vertIdx++] = z;
                    if (generateUV) {
                        const v = w / widthSegs;
                        uvs[uvIdx++] = u;
                        uvs[uvIdx++] = v;
                        uvs[uvIdx++] = 1 - u;
                        uvs[uvIdx++] = v;
                    }
                }
            }

            for (let i = 0, n = lengthSegs * widthSegs; i < n; ++i) {
                const i1 = i + 2;
                const i2 = i + ((1 + widthSegs) << 1);
                drawIndices[drawIdx++] = i1;
                drawIndices[drawIdx++] = i;
                drawIndices[drawIdx++] = i2;
                drawIndices[drawIdx++] = i2;
                drawIndices[drawIdx++] = i2 + 2;
                drawIndices[drawIdx++] = i1;
                drawIndices[drawIdx++] = i2 + 1;
                drawIndices[drawIdx++] = i + 1;
                drawIndices[drawIdx++] = i1 + 1;
                drawIndices[drawIdx++] = i1 + 1;
                drawIndices[drawIdx++] = i2 + 3;
                drawIndices[drawIdx++] = i2 + 1;
            }

            for (let l = 0; l <= lengthSegs; ++l) {
                const x = l * unitLength - halfLength;
                if (generateUV) u = l / lengthSegs;
                for (let h = 0; h <= heightSegs; ++h) {
                    const y = halfHegiht - h * unitHeight;
                    vertices[vertIdx++] = x;
                    vertices[vertIdx++] = y;
                    vertices[vertIdx++] = -halfWidth;
                    vertices[vertIdx++] = x;
                    vertices[vertIdx++] = y;
                    vertices[vertIdx++] = halfWidth;
                    if (generateUV) {
                        const v = h / heightSegs;
                        uvs[uvIdx++] = u;
                        uvs[uvIdx++] = v;
                        uvs[uvIdx++] = 1 - u;
                        uvs[uvIdx++] = v;
                    }
                }
            }

            let start = ((lengthSegs + 1) * (widthSegs + 1)) << 1;
            for (let i = 0, n = lengthSegs * heightSegs; i < n; ++i) {
                const i0 = start + i;
                const i1 = i0 + 2;
                const i2 = i0 + ((1 + heightSegs) << 1);
                drawIndices[drawIdx++] = i1;
                drawIndices[drawIdx++] = i0;
                drawIndices[drawIdx++] = i2;
                drawIndices[drawIdx++] = i2;
                drawIndices[drawIdx++] = i2 + 2;
                drawIndices[drawIdx++] = i1;
                drawIndices[drawIdx++] = i2 + 1;
                drawIndices[drawIdx++] = i0 + 1;
                drawIndices[drawIdx++] = i1 + 1;
                drawIndices[drawIdx++] = i1 + 1;
                drawIndices[drawIdx++] = i2 + 3;
                drawIndices[drawIdx++] = i2 + 1;
            }

            for (let w = 0; w <= widthSegs; ++w) {
                const z = halfWidth -  w * unitWidth;
                if (generateUV) u = w / widthSegs;
                for (let h = 0; h <= heightSegs; ++h) {
                    const y = halfHegiht - h * unitHeight;
                    vertices[vertIdx++] = -halfLength;
                    vertices[vertIdx++] = y;
                    vertices[vertIdx++] = z;
                    vertices[vertIdx++] = halfLength;
                    vertices[vertIdx++] = y;
                    vertices[vertIdx++] = z;
                    if (generateUV) {
                        const v = h / heightSegs;
                        uvs[uvIdx++] = u;
                        uvs[uvIdx++] = v;
                        uvs[uvIdx++] = 1 - u;
                        uvs[uvIdx++] = v;
                    }
                }
            }

            start += ((lengthSegs + 1) * (heightSegs + 1)) << 1;
            for (let i = 0, n = widthSegs * heightSegs; i < n; ++i) {
                const i0 = start + i;
                const i1 = i0 + 2;
                const i2 = i0 + ((1 + heightSegs) << 1);
                drawIndices[drawIdx++] = i1;
                drawIndices[drawIdx++] = i0;
                drawIndices[drawIdx++] = i2;
                drawIndices[drawIdx++] = i2;
                drawIndices[drawIdx++] = i2 + 2;
                drawIndices[drawIdx++] = i1;
                drawIndices[drawIdx++] = i2 + 1;
                drawIndices[drawIdx++] = i0 + 1;
                drawIndices[drawIdx++] = i1 + 1;
                drawIndices[drawIdx++] = i1 + 1;
                drawIndices[drawIdx++] = i2 + 3;
                drawIndices[drawIdx++] = i2 + 1;
            }

            if (generateNormal) asset.addVertexSource(MeshAssetHelper.createNormals(drawIndices, vertices));

            return asset;
        }

        public static createSphere(radius: number, segments: uint = 4, generateUV: boolean = true, generateNormal: boolean = false): MeshAsset {
            if (radius < 0) radius = 0;
            if (segments < 4) segments = 4;
            segments |= 0;

            const vertexSources = new Map<string, VertexSource>();
            const asset = new MeshAsset();
            asset.vertexSources = vertexSources;

            let numV = ((segments - 4) * 0.5 + 1) | 0;
            const angleX = Math.PI / (numV + 1);
            const angleY = MathUtils.PI2 / segments;

            const numVertices = 2 + numV * (segments + 1);

            const vertices = new Float32Array(numVertices * 3);
            let vertIdx = 0;
            asset.addVertexSource(new VertexSource(ShaderPredefined.a_Position0, vertices, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT));

            vertices[vertIdx++] = 0;
            vertices[vertIdx++] = radius;
            vertices[vertIdx++] = 0;

            let uvMax = 0;
            let uvs: Float32Array;
            let uvIdx = 0;
            if (generateUV) {
                uvs = new Float32Array(numVertices * 2);
                asset.addVertexSource(new VertexSource(ShaderPredefined.a_UV0, uvs, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT));

                uvs[uvIdx++] = 0.5;
                uvs[uvIdx++] = 0;
                uvMax = numV + 1;
            }

            let curV: number;
            let rotX = 0;
            for (let i = 1; i <= numV; ++i) {
                rotX += angleX;
                const y = radius * Math.cos(rotX);
                const z = radius * Math.sin(rotX);
                let rotY = 0;
                if (generateUV) curV = i / uvMax;
                for (let j = 0; j <= segments; ++j) {
                    if (j === segments) rotY = 0;
                    rotY -= angleY;
                    const x = z * Math.cos(rotY);
                    const z1 = z * Math.sin(rotY);
                    vertices[vertIdx++] = x;
                    vertices[vertIdx++] = y;
                    vertices[vertIdx++] = z1;
                    if (generateUV) {
                        uvs[uvIdx++] = j / segments;
                        uvs[uvIdx++] = curV;
                    }
                }
            }
            vertices[vertIdx++] = 0;
            vertices[vertIdx++] = -radius;
            vertices[vertIdx++] = 0;
            if (generateUV) {
                uvs[uvIdx++] = 0.5;
                uvs[uvIdx++] = 1;
            }

            const drawIndexInfo = MeshAssetHelper.createBinaryDrawIndexSourceData((1 + numV) * segments * 6, numVertices);
            const drawIndices = drawIndexInfo[0];
            let drawIdx = 0;
            const drawIndexSource = new DrawIndexSource(drawIndices, drawIndexInfo[1]);
            asset.drawIndexSource = drawIndexSource;
            drawIndexSource.data = drawIndices;
            asset.drawIndexSource = drawIndexSource;
            for (let i = 1; i <= segments; ++i) {
                drawIndices[drawIdx++] = 0;
                drawIndices[drawIdx++] = i;
                drawIndices[drawIdx++] = i + 1;
            }
            --numV;
            for (let i = 0; i < numV; ++i) {
                const h1 = 1 + i * (segments + 1);
                const h2 = h1 + segments + 1;
                for (let j = 0; j < segments; ++j) {
                    const idx1 = h1 + j;
                    const idx2 = h2 + j;
                    const idx3 = idx2 + 1;
                    drawIndices[drawIdx++] = idx1 + 1;
                    drawIndices[drawIdx++] = idx1;
                    drawIndices[drawIdx++] = idx3;
                    drawIndices[drawIdx++] = idx1;
                    drawIndices[drawIdx++] = idx2;
                    drawIndices[drawIdx++] = idx3;
                }
            }
            const last = (vertices.length / 3 - 1) | 0;
            const idx = last - segments - 2;
            for (let i = 1; i <= segments; ++i) {
                const j = idx + i;
                drawIndices[drawIdx++] = last;
                drawIndices[drawIdx++] = j + 1;
                drawIndices[drawIdx++] = j;
            }

            if (generateNormal) asset.addVertexSource(MeshAssetHelper.createLerpNormals(drawIndices, vertices));

            return asset;
        }
    }
}