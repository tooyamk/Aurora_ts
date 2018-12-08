///<reference path="../General.ts"/>

namespace Aurora.BuiltinShader.Lib.Reflection {
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

#include<${General.DECLARE_ATTRIB.name}>(vec3, ${ShaderPredefined.a_Normal0})
#include<${General.DECLARE_UNIFORM.name}>(mat3, ${ShaderPredefined.u_M33_L2W})
#include<${General.DECLARE_VARYING.name}>(vec3, ${General.v_WorldNormal0})
#include<${General.DECLARE_UNIFORM.name}>(mat4, ${ShaderPredefined.u_M44_L2W})
#include<${General.DECLARE_VARYING.name}>(vec3, ${General.v_WorldPos0})

#endif
`};

    export const FRAG_HEADER: ShaderLib = {
        name: `${NAME}_FragHeader`,
        source: `
#ifdef ${ShaderPredefined.REFLECTION}

#include<${General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_CamPosW})
#include<${General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_ReflectionColor})
#include<${General.DECLARE_UNIFORM.name}>(samplerCube, ${ShaderPredefined.u_ReflectionSampler})
#include<${General.DECLARE_VARYING.name}>(vec3, ${General.v_WorldPos0})
#include<${General.DECLARE_VARYING.name}>(vec3, ${General.v_WorldNormal0})
#include<${CUBIC_HEADER.name}>

#endif
`};

    export const FRAG: ShaderLib = {
        name: `${NAME}_Frag`,
        source: `
#ifdef ${ShaderPredefined.REFLECTION}

#include<${General.DECLARE_TEMP_VAR.name}>(vec3, ${General.var_WorldViewDir0})
#ifndef ${General.ASSIGNMENT_PREFIX}${General.var_WorldViewDir0}
    #define ${General.ASSIGNMENT_PREFIX}${General.var_WorldViewDir0}
    ${General.var_WorldViewDir0} = normalize(${ShaderPredefined.u_CamPosW} - ${General.v_WorldPos0});
#endif

vec4 _reflectColor = textureCube(${ShaderPredefined.u_ReflectionSampler}, ${CUBIC_FUNC.name}(${General.var_WorldViewDir0}, ${General.var_WorldNormal0}));
_reflectColor.xyz *= ${ShaderPredefined.u_ReflectionColor};

#endif
`};

    export const SOURCES: ShaderLib[] = [CUBIC_HEADER, CUBIC_FUNC, VERT_HEADER, FRAG_HEADER, FRAG];
}