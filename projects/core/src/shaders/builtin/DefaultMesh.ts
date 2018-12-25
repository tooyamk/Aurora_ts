///<reference path="libs/AlphaTest.ts"/>
///<reference path="libs/Lighting.ts"/>
///<reference path="libs/Reflection.ts"/>
///<reference path="libs/Skinning.ts"/>

namespace Aurora.BuiltinShader.DefaultMesh {
    export const NAME = "_Built-in_DefaultMesh";

    export const VERTEX = 
`attribute vec3 ${ShaderPredefined.a_Position0};

#if defined(${ShaderPredefined.DIFFUSE_TEX}) || defined(${ShaderPredefined.SPECULAR_TEX})
#include<${General.DECLARE_ATTRIB_MACRO.name}>(vec2, ${ShaderPredefined.a_UV0})
#include<${General.DECLARE_VARYING_MACRO.name}>(vec2, ${General.v_UV0})
#endif

#if defined(${ShaderPredefined.NORMAL_TEX}) && defined(${ShaderPredefined.LIGHTING})
#include<${General.DECLARE_ATTRIB_MACRO.name}>(vec3, ${ShaderPredefined.a_Normal0})
#include<${General.DECLARE_ATTRIB_MACRO.name}>(vec3, ${ShaderPredefined.a_Tangent0})
#include<${General.DECLARE_ATTRIB_MACRO.name}>(vec2, ${ShaderPredefined.a_UV0})
#include<${General.DECLARE_UNIFORM_MACRO.name}>(mat4, ${ShaderPredefined.u_M44_L2W})
#include<${General.DECLARE_VARYING_MACRO.name}>(vec2, ${General.v_UV0})
#include<${General.DECLARE_VARYING_MACRO.name}>(vec3, ${General.v_WorldPos0})
#include<${General.DECLARE_VARYING_MACRO.name}>(vec3, ${General.v_WorldNormal0})
#include<${General.DECLARE_VARYING_MACRO.name}>(vec3, ${General.v_WorldTangent0})
#include<${General.DECLARE_VARYING_MACRO.name}>(vec3, ${General.v_WorldBinormal0})
#endif

#ifdef ${ShaderPredefined.VERTEX_COLOR}
#include<${General.DECLARE_ATTRIB_MACRO.name}>(vec4, ${ShaderPredefined.a_Color0})
#include<${General.DECLARE_VARYING_MACRO.name}>(vec4, ${General.v_Color0})
#endif

#include<${General.DECLARE_UNIFORM_MACRO.name}>(mat4, ${ShaderPredefined.u_M44_L2P})

#include<${Lib.Lighting.VERT_HEADER.name}>
#include<${Lib.Reflection.VERT_HEADER.name}>
#include<${Lib.Skinning.VERT_HEADER.name}>

void main(void) {
#include<${General.DECLARE_TEMP_VAR_MACRO.name}>(vec3, ${General.var_Pos0})
${General.var_Pos0} = ${ShaderPredefined.a_Position0};

#ifdef ${General.DECLARE_ATTRIB_MACRO_PREFIX}${ShaderPredefined.a_Normal0}
    #include<${General.DECLARE_TEMP_VAR_MACRO.name}>(vec3, ${General.var_Nrm0})
    ${General.var_Nrm0} = ${ShaderPredefined.a_Normal0};
#endif

#ifdef ${General.DECLARE_ATTRIB_MACRO_PREFIX}${ShaderPredefined.a_Tangent0}
    #include<${General.DECLARE_TEMP_VAR_MACRO.name}>(vec3, ${General.var_Tan0})
    ${General.var_Tan0} = ${ShaderPredefined.a_Tangent0};
#endif

#ifdef ${Lib.Skinning.NEED_SKINNING_MACRO}
    ${Lib.Skinning.SKINNED_MATRIX_STRUCT} mat;
    ${Lib.Skinning.CALC_SKINNING_MATRIX_FUNC}(mat, ${ShaderPredefined.a_BoneIndex0}, ${ShaderPredefined.a_BoneWeight0});
    ${General.var_Pos0} = ${Lib.Skinning.CALC_SKINNING_FUNC}(${General.var_Pos0}, mat);

    #ifdef ${General.DECLARE_TEMP_VAR_PREFIX}${General.var_Nrm0}
        ${General.var_Nrm0} = ${Lib.Skinning.CALC_SKINNING_ONLY_ROTATION_FUNC}(${General.var_Nrm0}, mat);
    #endif

    #ifdef ${General.DECLARE_TEMP_VAR_PREFIX}${General.var_Tan0}
        ${General.var_Tan0} = ${Lib.Skinning.CALC_SKINNING_ONLY_ROTATION_FUNC}(${General.var_Tan0}, mat);
    #endif
#endif

#if defined(${General.DECLARE_TEMP_VAR_PREFIX}${General.var_Nrm0}) && defined(${General.DECLARE_TEMP_VAR_PREFIX}${General.var_Tan0})
    #include<${General.DECLARE_TEMP_VAR_MACRO.name}>(vec3, ${General.var_Binrm0})
    ${General.var_Binrm0} = vec3(${General.var_Nrm0}.y * ${General.var_Tan0}.z - ${General.var_Nrm0}.z * ${General.var_Tan0}.y, ${General.var_Nrm0}.z * ${General.var_Tan0}.x - ${General.var_Nrm0}.x * ${General.var_Tan0}.z, ${General.var_Nrm0}.x * ${General.var_Tan0}.y - ${General.var_Nrm0}.y * ${General.var_Tan0}.x);
#endif

#ifdef ${General.DECLARE_VARYING_MACRO_PREFIX}${General.v_UV0}
    ${General.v_UV0} = ${ShaderPredefined.a_UV0};
#endif

#ifdef ${General.DECLARE_VARYING_MACRO_PREFIX}${General.v_Color0}
    ${General.v_Color0} = ${ShaderPredefined.a_Color0};
#endif

#include<${General.VERT_FINISH.name}>
}`;

    export const FRAGMENT = 
`${General.PRECISION_HEAD}

#if defined(${ShaderPredefined.DIFFUSE_TEX}) || defined(${ShaderPredefined.SPECULAR_TEX})
#include<${General.DECLARE_UNIFORM_MACRO.name}>(sampler2D, ${ShaderPredefined.u_DiffuseSampler})
#include<${General.DECLARE_VARYING_MACRO.name}>(vec2, ${General.v_UV0})
#endif

#if defined(${ShaderPredefined.NORMAL_TEX}) && defined(${ShaderPredefined.LIGHTING})
#include<${General.DECLARE_UNIFORM_MACRO.name}>(sampler2D, ${ShaderPredefined.u_NormalSampler})
#include<${General.DECLARE_VARYING_MACRO.name}>(vec2, ${General.v_UV0})
#include<${General.DECLARE_VARYING_MACRO.name}>(vec3, ${General.v_WorldTangent0})
#include<${General.DECLARE_VARYING_MACRO.name}>(vec3, ${General.v_WorldBinormal0})
#endif

#ifdef ${ShaderPredefined.VERTEX_COLOR}
#include<${General.DECLARE_VARYING_MACRO.name}>(vec4, ${General.v_Color0})
#endif

#ifdef ${ShaderPredefined.DIFFUSE_COLOR}
#include<${General.DECLARE_UNIFORM_MACRO.name}>(vec4, ${ShaderPredefined.u_DiffuseColor})
#endif

#include<${Lib.Lighting.FRAG_HEADER.name}>
#include<${Lib.Reflection.FRAG_HEADER.name}>
#include<${Lib.AlphaTest.HEADER.name}>

void main(void) {
    #include<${General.FRAG_BEGIN.name}>

#ifdef ${ShaderPredefined.DIFFUSE_TEX}
    vec4 c = texture2D(${ShaderPredefined.u_DiffuseSampler}, ${General.v_UV0});

    #ifdef ${ShaderPredefined.VERTEX_COLOR}
    c *= ${General.v_Color0};
    #endif

    #ifdef ${ShaderPredefined.DIFFUSE_COLOR}
    c *= ${ShaderPredefined.u_DiffuseColor};
    #endif
#elif defined(${ShaderPredefined.VERTEX_COLOR})
    vec4 c = ${General.v_Color0};

    #ifdef ${ShaderPredefined.DIFFUSE_COLOR}
    c *= ${ShaderPredefined.u_DiffuseColor};
    #endif
#elif defined(${ShaderPredefined.DIFFUSE_COLOR})
    vec4 c = ${ShaderPredefined.u_DiffuseColor};
#else
    vec4 c = vec4(0.0);
#endif

    #include<${Lib.AlphaTest.FRAG.name}>(c.w)

#include<${Lib.Reflection.FRAG.name}>
#include<${Lib.Lighting.FRAG.name}>(${General.v_UV0})

#include<${General.FINAL_COLOR.name}>(c)

    gl_FragColor = c;
}`;
}