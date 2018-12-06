///<reference path="../General.ts"/>

namespace Aurora.BuiltinShader.Lib.Skinning {
    export const NAME = "_Skinning";

    export const CALC_SKINNING_FUNC: ShaderLib = {
        name: `${NAME}_CalcSkinning`,
        source: ``
    };

    export const CALC_SKINNING_HEADER: ShaderLib = {
        name: `${CALC_SKINNING_FUNC.name}_Header`,
        source: `
struct ${NAME}_Mat {
    vec4 m00_30;
    vec4 m01_31;
    vec4 m02_32;
};

void ${CALC_SKINNING_FUNC.name}_CalcMatrix(${NAME}_Mat mat, _BONE_DATA_TYPE indices, _BONE_DATA_TYPE weights, int i) {
    int index = indices[i] * 3;
    float weight = weights[i];

    mat.m00_30 += ${ShaderPredefined.u_SkinningMatrices}[index] * weight;
    mat.m01_31 += ${ShaderPredefined.u_SkinningMatrices}[index + 1] * weight;
    mat.m02_32 += ${ShaderPredefined.u_SkinningMatrices}[index + 2] * weight;
}

vec3 ${CALC_SKINNING_FUNC.name}(vec3 pos, _BONE_DATA_TYPE indices, _BONE_DATA_TYPE weights) {
    ${NAME}_Mat mat;
    mat.m00_30 = vec4(0.0, 0.0, 0.0, 0.0);
    mat.m01_31 = vec4(0.0, 0.0, 0.0, 0.0);
    mat.m02_32 = vec4(0.0, 0.0, 0.0, 0.0);

    ${CALC_SKINNING_FUNC.name}_CalcMatrix(mat, indices, weights, 0);

#if ${ShaderPredefined.NUM_BONES_PER_VERTEX} > 1
    ${CALC_SKINNING_FUNC.name}_CalcMatrix(mat, indices, weights, 1);

    #if ${ShaderPredefined.NUM_BONES_PER_VERTEX} > 2
        ${CALC_SKINNING_FUNC.name}_CalcMatrix(mat, indices, weights, 2);

        #if ${ShaderPredefined.NUM_BONES_PER_VERTEX} > 3
            ${CALC_SKINNING_FUNC.name}_CalcMatrix(mat, indices, weights, 3);
        #endif
    #endif
#endif

    vec4 srcPos = vec4(pos, 1.0);
    return vec3(dot(srcPos, mat.m00_30), dot(srcPos, mat.m00_30), dot(srcPos, mat.m02_32));
}
`};

    export const VERT_HEADER: ShaderLib = {
        name: `${NAME}_VertHeader`,
        source: `
#if defined(${ShaderPredefined.MAX_BONES}) && defined(${ShaderPredefined.NUM_BONES_PER_VERTEX})
#if ${ShaderPredefined.NUM_BONES_PER_VERTEX} > 0 && ${ShaderPredefined.NUM_BONES_PER_VERTEX} < 5

#define _Calc_Skinning

#if ${ShaderPredefined.NUM_BONES_PER_VERTEX} == 1
    #define _BONE_DATA_TYPE vec1
#elif ${ShaderPredefined.NUM_BONES_PER_VERTEX} == 2
    #define _BONE_DATA_TYPE vec2
#elif ${ShaderPredefined.NUM_BONES_PER_VERTEX} == 3
    #define _BONE_DATA_TYPE vec3
#else
    #define _BONE_DATA_TYPE vec4
#endif

#include<${CALC_SKINNING_HEADER.name}>

#include<${General.DECLARE_ATTRIB.name}>(_BONE_DATA_TYPE, ${ShaderPredefined.a_BoneIndex0})
#include<${General.DECLARE_ATTRIB.name}>(_BONE_DATA_TYPE, ${ShaderPredefined.a_BoneWeight0})

#include<${General.DECLARE_UNIFORM_ARRAY.name}>(vec4, ${ShaderPredefined.u_SkinningMatrices}, ${ShaderPredefined.MAX_BONES} * 3)

#endif
#endif
`}

    /**
     * @param inPos (vec3).
     * @param outPos (vec3).
     */
    export const VERT: ShaderLib = {
        name: `${NAME}_Vert`,
        source: `
#ifdef _Calc_Skinning

\${1} = ${CALC_SKINNING_FUNC.name}(\${0});

#endif
`}

    export const SOURCES: ShaderLib[] = [CALC_SKINNING_HEADER, CALC_SKINNING_FUNC].
        concat(VERT_HEADER, VERT);
}