///<reference path="../General.ts"/>

namespace Aurora.BuiltinShader.Lib.Skinning {
    export const NAME = "_Skinning";

    export const CALC_SKINNING_MATRIX_FUNC = `${NAME}_CalcSkinningMatrix`;
    export const CALC_SKINNING_FUNC = `${NAME}_CalcSkinning`;
    export const CALC_SKINNING_ONLY_ROTATION_FUNC = `${NAME}_CalcSkinningOnlyRotation`;

    export const NEED_SKINNING_DEFINE = "_NEED_SKINNING_DEFINE";
    export const SKINNED_MATRIX_STRUCT = `${NAME}_Mat`;

    export const VERT_HEADER: ShaderLib = {
        name: `${NAME}_VertHeader`,
        source: `
#if defined(${ShaderPredefined.MAX_BONES}) && defined(${ShaderPredefined.NUM_BONES_PER_VERTEX})
#if ${ShaderPredefined.NUM_BONES_PER_VERTEX} > 0 && ${ShaderPredefined.NUM_BONES_PER_VERTEX} < 5

#define ${NEED_SKINNING_DEFINE}

#include<${General.DECLARE_UNIFORM_ARRAY.name}>(vec4, ${ShaderPredefined.u_SkinningMatrices}, ${ShaderPredefined.MAX_BONES} * 3)

struct ${SKINNED_MATRIX_STRUCT} {
    vec4 m00_30;
    vec4 m01_31;
    vec4 m02_32;
};

void ${CALC_SKINNING_MATRIX_FUNC}_Single(inout ${SKINNED_MATRIX_STRUCT} mat, float index, float weight) {
    int i = int(index) * 3;

    mat.m00_30 += ${ShaderPredefined.u_SkinningMatrices}[i] * weight;
    mat.m01_31 += ${ShaderPredefined.u_SkinningMatrices}[i + 1] * weight;
    mat.m02_32 += ${ShaderPredefined.u_SkinningMatrices}[i + 2] * weight;
}

#if ${ShaderPredefined.NUM_BONES_PER_VERTEX} == 1
    #include<${General.DECLARE_ATTRIB.name}>(float, ${ShaderPredefined.a_BoneIndex0})
    #include<${General.DECLARE_ATTRIB.name}>(float, ${ShaderPredefined.a_BoneWeight0})

    void ${CALC_SKINNING_MATRIX_FUNC}(inout ${SKINNED_MATRIX_STRUCT} mat, float indices, float weights) {
#elif ${ShaderPredefined.NUM_BONES_PER_VERTEX} == 2
    #include<${General.DECLARE_ATTRIB.name}>(vec2, ${ShaderPredefined.a_BoneIndex0})
    #include<${General.DECLARE_ATTRIB.name}>(vec2, ${ShaderPredefined.a_BoneWeight0})

    void ${CALC_SKINNING_MATRIX_FUNC}(inout ${SKINNED_MATRIX_STRUCT} mat, vec2 indices, vec2 weights) {
#elif ${ShaderPredefined.NUM_BONES_PER_VERTEX} == 3
    #include<${General.DECLARE_ATTRIB.name}>(vec3, ${ShaderPredefined.a_BoneIndex0})
    #include<${General.DECLARE_ATTRIB.name}>(vec3, ${ShaderPredefined.a_BoneWeight0})

    void ${CALC_SKINNING_MATRIX_FUNC}(inout ${SKINNED_MATRIX_STRUCT} mat, vec3 indices, vec3 weights) {
#else
    #include<${General.DECLARE_ATTRIB.name}>(vec4, ${ShaderPredefined.a_BoneIndex0})
    #include<${General.DECLARE_ATTRIB.name}>(vec4, ${ShaderPredefined.a_BoneWeight0})

    void ${CALC_SKINNING_MATRIX_FUNC}(inout ${SKINNED_MATRIX_STRUCT} mat, vec4 indices, vec4 weights) {
#endif

        mat.m00_30 = vec4(0.0);
        mat.m01_31 = vec4(0.0);
        mat.m02_32 = vec4(0.0);

#if ${ShaderPredefined.NUM_BONES_PER_VERTEX} == 1
        ${CALC_SKINNING_MATRIX_FUNC}_Single(mat, indices, weights);
#elif ${ShaderPredefined.NUM_BONES_PER_VERTEX} == 2
        ${CALC_SKINNING_MATRIX_FUNC}_Single(mat, indices.x, weights.x);
        ${CALC_SKINNING_MATRIX_FUNC}_Single(mat, indices.y, weights.y);
#elif ${ShaderPredefined.NUM_BONES_PER_VERTEX} == 3
        ${CALC_SKINNING_MATRIX_FUNC}_Single(mat, indices.x, weights.x);
        ${CALC_SKINNING_MATRIX_FUNC}_Single(mat, indices.y, weights.y);
        ${CALC_SKINNING_MATRIX_FUNC}_Single(mat, indices.z, weights.z);
#else
        ${CALC_SKINNING_MATRIX_FUNC}_Single(mat, indices.x, weights.x);
        ${CALC_SKINNING_MATRIX_FUNC}_Single(mat, indices.y, weights.y);
        ${CALC_SKINNING_MATRIX_FUNC}_Single(mat, indices.z, weights.z);
        ${CALC_SKINNING_MATRIX_FUNC}_Single(mat, indices.w, weights.w);
#endif
    }

vec3 ${CALC_SKINNING_FUNC}(vec3 pos, ${SKINNED_MATRIX_STRUCT} mat) {
    vec4 srcPos = vec4(pos, 1.0);
    return vec3(dot(srcPos, mat.m00_30), dot(srcPos, mat.m01_31), dot(srcPos, mat.m02_32));
}

vec3 ${CALC_SKINNING_ONLY_ROTATION_FUNC}(vec3 pos, ${SKINNED_MATRIX_STRUCT} mat) {
    return vec3(dot(pos, mat.m00_30.xyz), dot(pos, mat.m01_31.xyz), dot(pos, mat.m02_32.xyz));
}

#endif
#endif
`}

    export const SOURCES: ShaderLib[] = [VERT_HEADER];
}