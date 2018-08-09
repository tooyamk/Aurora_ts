namespace MITOIA.Geometries {
    export function createSphere(radius: number, segments: uint = 4, generateTexCoords: Boolean = true): AssetStore {
        if (radius < 0) radius = 0;
        if (segments < 4) segments = 4;

        let vertexSources = new Map<string, VertexSource>();
        let assetStore = new AssetStore();
        assetStore.vertexSources = vertexSources;

        let numV: uint = ((segments - 4) * 0.5 + 1) | 0;
        let d: number = radius * 2;
        let angleX: number = Math.PI / (numV + 1);
        let angleY: number = Math.PI * 2 / segments;

        let vertices: number[] = [];
        assetStore.addVertexSource(new VertexSource(ShaderPredefined.a_Position, vertices, GLVertexBufferSize.THREE, GLVertexBufferDataType.FLOAT));

        vertices.push(0, radius, 0);

        let uvMax: uint = 0;
        let texCoords: number[];
        if (generateTexCoords) {
            texCoords = [];
            assetStore.addVertexSource(new VertexSource(ShaderPredefined.a_TexCoord, texCoords, GLVertexBufferSize.TWO, GLVertexBufferDataType.FLOAT));

            texCoords.push(0.5, 0);
            uvMax = numV + 1;
        }

        let currentV: number;
        let rotationX = 0;
        for (let i: uint = 1; i <= numV; ++i) {
            rotationX += angleX;
            let y = radius * Math.cos(rotationX);
            let z = radius * Math.sin(rotationX);
            let rotationY = 0;
            if (generateTexCoords) currentV = i / uvMax;
            for (let j = 0; j <= segments; ++j) {
                if (j == segments) rotationY = 0;
                rotationY += angleY;
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
            let h1: uint = 1 + i * (segments + 1);
            let h2: uint = h1 + segments + 1;
            for (let j = 0; j < segments; ++j) {
                let index1: uint = h1 + j;
                let index2: uint = h2 + j;
                let index3: uint = index2 + 1;
                drawIndices.push(index1 + 1, index1, index3, index1, index2, index3);
            }
        }
        let last: int = (vertices.length / 3 - 1) | 0;
        let index: int = last - segments - 2;
        for (let i = 1; i <= segments; ++i) {
            let j = index + i;
            drawIndices.push(last, j + 1, j);
        }

        return assetStore;
    }
}