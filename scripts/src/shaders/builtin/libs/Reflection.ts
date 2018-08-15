/// <reference path="../General.ts" />

namespace MITOIA.BuiltinShader.Lib.Reflection {
    const NAME: string = "_Reflection";

    /**
     * @param normal (vec3).
     * @param viewDir (vec3) eyePos - vertexPos.
     * @returns texcoord (vec3).
     */
    export const CUBIC_FUNC: ShaderLib = {
        name: `${NAME}_Cubic`,
        source: ``
    };

    export const CUBIC_HEADER: ShaderLib = {
        name: `${CUBIC_FUNC.name}_Header`,
        source: `
vec3 ${CUBIC_FUNC.name}(vec3 normal, vec3 viewDir) {
	return reflect(viewDir, normal);
}
`};

    export const VERT_HEADER: ShaderLib = {
        name: `${NAME}_VertHeader`,
        source: `
#ifdef ${ShaderPredefined.REFLECTION}

#include<${General.DECLARE_ATTRIB.name}>(vec3, ${ShaderPredefined.a_Normal})
#include<${General.DECLARE_UNIFORM.name}>(mat3, ${ShaderPredefined.u_M33_L2W})
#include<${General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_NormalW})
#include<${General.DECLARE_UNIFORM.name}>(mat4, ${ShaderPredefined.u_M44_L2W})
#include<${General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_PosW})

#endif
`};

    export const VERT: ShaderLib = {
        name: `${NAME}_Vert`,
        source: `
#ifdef ${ShaderPredefined.REFLECTION}

#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_PosW}
    #ifndef ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.v_PosW}
        #define ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.v_PosW}
        ${ShaderPredefined.v_PosW} = (${ShaderPredefined.u_M44_L2W} * vec4(${ShaderPredefined.a_Position}, 1.0)).xyz;
    #endif
#endif

#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_NormalW}
    #ifndef ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.v_NormalW}
        #define ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.v_NormalW}
        ${ShaderPredefined.v_NormalW} = ${ShaderPredefined.u_M33_L2W} * ${ShaderPredefined.a_Normal};
    #endif
#endif

#endif
`};

    export const FRAG_HEADER: ShaderLib = {
        name: `${NAME}_FragHeader`,
        source: `
#ifdef ${ShaderPredefined.REFLECTION}

#include<${General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_CamPosW})
#include<${General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_ReflectionColor})
#include<${General.DECLARE_UNIFORM.name}>(samplerCube, ${ShaderPredefined.u_ReflectionSampler})
#include<${General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_PosW})
#include<${General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_NormalW})
#include<${CUBIC_HEADER.name}>

#endif
`};

    export const FRAG: ShaderLib = {
        name: `${NAME}_Frag`,
        source: `
#ifdef ${ShaderPredefined.REFLECTION}

#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_NormalW}
    #include<${General.DECLARE_TEMP_VAR.name}>(vec3, ${ShaderPredefined.var_NormalW})
#endif

#ifdef ${ShaderPredefined.LIGHTING_SPECULAR}
    #include<${General.DECLARE_TEMP_VAR.name}>(vec3, ${ShaderPredefined.var_ViewDirW})
#endif

#ifndef ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.var_NormalW}
    #define ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.var_NormalW}
    ${ShaderPredefined.var_NormalW} = normalize(${ShaderPredefined.v_NormalW});
#endif

#ifndef ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.var_ViewDirW}
    #define ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.var_ViewDirW}
    ${ShaderPredefined.var_ViewDirW} = normalize(${ShaderPredefined.u_CamPosW} - ${ShaderPredefined.v_PosW});
#endif

vec4 _reflectColor = textureCube(${ShaderPredefined.u_ReflectionSampler}, ${CUBIC_FUNC.name}(${ShaderPredefined.var_ViewDirW}, ${ShaderPredefined.var_NormalW}));
_reflectColor.xyz *= ${ShaderPredefined.u_ReflectionColor};

#endif
`};

    export const SOURCES: ShaderLib[] = [CUBIC_HEADER, CUBIC_FUNC, VERT_HEADER, VERT, FRAG_HEADER, FRAG];
}