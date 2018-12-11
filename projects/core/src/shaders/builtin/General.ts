///<reference path="../ShaderPredefined.ts"/>

namespace Aurora.BuiltinShader.General {
    export const v_UV0 = "v_UV0";
    export const v_Color0 = "v_Color0";
    export const v_WorldNormal0 = "v_WorldNormal0";
    export const v_WorldTangent0 = "v_WorldTangent0";
    export const v_WorldBinormal0 = "v_WorldBinormal0";
    export const v_WorldPos0 = "v_WorldPos0";

    export const var_Pos0 = "var_Pos0";
    export const var_Nrm0 = "var_Nrm0";
    export const var_Tan0 = "var_Tan0";
    export const var_Binrm0 = "var_Binrm0";

    export const var_WorldNormal0 = "var_WorldNormal0";
    export const var_WorldViewDir0 = "var_WorldViewDir0";

    export const PRECISION_HEAD: string = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else  
precision mediump float;
#endif
`;

    export const NEED_WORLD_POS_DEFINE = "_NEED_WORLD_POS_DEFINE";
    export const NEED_WORLD_NORMAL_DEFINE = "_NEED_WORLD_NORMAL_DEFINE";

    export const DECLARE_DEFINE: ShaderLib = {
        name: "_DECLARE_DEFINE",
        source: `
#ifndef \${0}
#define \${0}
#endif
`};

    /**
     * @param type
     * @param name
     */
    export const DECLARE_ATTRIB_DEFINE_PREFIX: string = "_DECLARE_ATTRIB_";

    export const DECLARE_ATTRIB: ShaderLib = {
        name: "_DECLARE_ATTRIB",
        source: `
#ifndef ${DECLARE_ATTRIB_DEFINE_PREFIX}\${1}
#define ${DECLARE_ATTRIB_DEFINE_PREFIX}\${1}
attribute \${0} \${1};
#endif
`};

    /**
     * @param type
     * @param name
     */
    export const DECLARE_UNIFORM_DEFINE_PREFIX: string = "_DECLARE_UNIFORM_";

    export const DECLARE_UNIFORM: ShaderLib = {
        name: "_DECLARE_UNIFORM",
        source: `
#ifndef ${DECLARE_UNIFORM_DEFINE_PREFIX}\${1}
#define ${DECLARE_UNIFORM_DEFINE_PREFIX}\${1}
uniform \${0} \${1};
#endif
`};

    export const DECLARE_UNIFORM_ARRAY_DEFINE_PREFIX: string = "_DECLARE_UNIFORM_ARRAY_";

    export const DECLARE_UNIFORM_ARRAY: ShaderLib = {
        name: "_DECLARE_UNIFORM_ARRAY",
        source: `
#ifndef ${DECLARE_UNIFORM_DEFINE_PREFIX}\${1}
#define ${DECLARE_UNIFORM_DEFINE_PREFIX}\${1}
uniform \${0} \${1}[\${2}];
#endif
`};

    export const DECLARE_VARYING_DEFINE_PREFIX: string = "_DECLARE_VARYING_";

    /**
     * @param type
     * @param name
     */
    export const DECLARE_VARYING: ShaderLib = {
        name: "_DECLARE_VARYING",
        source: `
#ifndef ${DECLARE_VARYING_DEFINE_PREFIX}\${1}
#define ${DECLARE_VARYING_DEFINE_PREFIX}\${1}
varying \${0} \${1};
#endif
`};

    export const DECLARE_TEMP_VAR_PREFIX: string = "_DECLARE_TMP_VAR_";

    /**
     * @param type
     * @param name
     */
    export const DECLARE_TEMP_VAR: ShaderLib = {
        name: "_DECLARE_TMP_VAR",
        source: `
#ifndef ${DECLARE_TEMP_VAR_PREFIX}\${1}
#define ${DECLARE_TEMP_VAR_PREFIX}\${1}
\${0} \${1};
#endif
`};

    export const ASSIGNMENT_PREFIX: string = "_ASSIGNMENT_";

    export const VERT_FINISH: ShaderLib = {
        name: `_General_Vert_Finish`,
        source: `
#if defined(${General.DECLARE_VARYING_DEFINE_PREFIX}${v_WorldPos0}) && defined(${General.DECLARE_UNIFORM_DEFINE_PREFIX}${ShaderPredefined.u_M44_L2W})
    #ifndef ${General.ASSIGNMENT_PREFIX}${v_WorldPos0}
        #define ${General.ASSIGNMENT_PREFIX}${v_WorldPos0}
        ${v_WorldPos0} = (${ShaderPredefined.u_M44_L2W} * vec4(${General.var_Pos0}, 1.0)).xyz;
    #endif
#endif

#ifdef ${General.DECLARE_UNIFORM_DEFINE_PREFIX}${ShaderPredefined.u_M44_L2W}
    mat3 m3 = mat3(${ShaderPredefined.u_M44_L2W});
    #ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${v_WorldNormal0}
        #ifndef ${General.ASSIGNMENT_PREFIX}${v_WorldNormal0}
            #define ${General.ASSIGNMENT_PREFIX}${v_WorldNormal0}
            ${v_WorldNormal0} = m3 * ${General.var_Nrm0};
        #endif
    #endif

    #ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${v_WorldTangent0}
        #ifndef ${General.ASSIGNMENT_PREFIX}${v_WorldTangent0}
            #define ${General.ASSIGNMENT_PREFIX}${v_WorldTangent0}
            ${v_WorldTangent0} = m3 * ${General.var_Tan0};
        #endif
    #endif

    #ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${v_WorldBinormal0}
        #ifndef ${General.ASSIGNMENT_PREFIX}${v_WorldBinormal0}
            #define ${General.ASSIGNMENT_PREFIX}${v_WorldBinormal0}
            ${v_WorldBinormal0} = m3 * ${General.var_Binrm0};
        #endif
    #endif
#endif

gl_Position = ${ShaderPredefined.u_M44_L2P} * vec4(${General.var_Pos0}, 1.0);
`}

    export const FRAG_BEGIN: ShaderLib = {
        name: "_General_Frag_Begin",
        source: `
#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${v_WorldNormal0}
    #include<${General.DECLARE_TEMP_VAR.name}>(vec3, ${General.var_WorldNormal0})

    #if defined(${ShaderPredefined.NORMAL_TEX}) && defined(${ShaderPredefined.LIGHTING})
        vec3 N = normalize(${General.v_WorldNormal0});
        vec3 T = normalize(${General.v_WorldTangent0} - dot(${General.v_WorldNormal0}, ${General.v_WorldTangent0}) * ${General.v_WorldNormal0});
        ${General.var_WorldNormal0} = normalize(mat3(T, cross(N, T), N) * (2.0 * vec3(texture2D(${ShaderPredefined.u_NormalSampler}, ${General.v_UV0})) - 1.0));
    #else
        ${General.var_WorldNormal0} = normalize(${General.v_WorldNormal0});
    #endif
#endif
`};

    /**
     * @param diffuseColor (vec4).
     */
    export const FINAL_COLOR: ShaderLib = {
        name: "_FINAL_COLOR",
        source: `
#ifdef ${ShaderPredefined.LIGHTING}
    \${0}.xyz = (\${0}.xyz * _lightingInfo.ambientColor) + (\${0}.xyz * _lightingInfo.diffuseColor + _lightingInfo.specularColor) * _lightingInfo.intensity;
    #ifdef ${ShaderPredefined.REFLECTION}
        \${0}.xyz += _reflectColor.xyz;
    #endif
#else
    #ifdef ${ShaderPredefined.REFLECTION}
        \${0}.xyz = _reflectColor.xyz;
    #endif
#endif
`};

    export const SOURCES: ShaderLib[] = [DECLARE_DEFINE, DECLARE_ATTRIB, DECLARE_UNIFORM, DECLARE_UNIFORM_ARRAY, DECLARE_VARYING, DECLARE_TEMP_VAR, 
        VERT_FINISH, FRAG_BEGIN, FINAL_COLOR];
}