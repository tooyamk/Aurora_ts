/// <reference path="../General.ts" />

namespace Aurora.BuiltinShader.Lib.Lighting {
    export const NAME = "_Lighting";

    /**
     * @param normal (vec3).
     * @param lightingDir (vec3) lightPos - vertexPos.
     */
    export const DIFFUSE_FACTOR_FUNC: ShaderLib = {
        name: `${NAME}_DiffuseFactor`,
        source: ``
    };

    export const DIFFUSE_FACTOR_HEADER: ShaderLib = {
        name: `${DIFFUSE_FACTOR_FUNC.name}_Header`,
        source: `
float ${DIFFUSE_FACTOR_FUNC.name}(vec3 normal, vec3 lightingDir) {
	return max(dot(normal, lightingDir), 0.0);
}
`};

    /**
     * @param normal (vec3).
     * @param lightingDir (vec3) lightPos - vertexPos.
     * @param viewDir (vec3) viewPos - vertexPos.
     * @param diffuseFactor (float).
     * @param shininess (float) default recommend 32.
     */
    export const SPECULAR_PHONE_FACTOR_FUNC: ShaderLib = {
        name: `${NAME}_SpecularPhoneFactor`,
        source: ``
    }; 

    export const SPECULAR_PHONE_FACTOR_HEADER: ShaderLib = {
        name: `${SPECULAR_PHONE_FACTOR_FUNC.name}_Header`,
        source: `
float ${SPECULAR_PHONE_FACTOR_FUNC.name}(vec3 normal, vec3 lightingDir, vec3 viewDir, float diffuseFactor, float shininess) {
    float df2 = diffuseFactor * diffuseFactor;
    vec3 r = normalize((df2 + df2) * normal - lightingDir);
    return pow(max(dot(viewDir, r), 0.0), shininess);
}
`};

    /**
     * @param normal (vec3).
     * @param lightingDir (vec3) lightPos - vertexPos.
     * @param viewDir (vec3) viewPos - vertexPos.
     * @param shininess (float) default recommend 32.
     */
    export const SPECULAR_BANK_BRDF_FACTOR_FUNC: ShaderLib = {
        name: `${NAME}_SpecularBankBRDFFactor`,
        source: ``
    };

    export const SPECULAR_BANK_BRDF_FACTOR_HEADER: ShaderLib = {
        name: `${SPECULAR_BANK_BRDF_FACTOR_FUNC.name}_Header`,
        source: `
float ${SPECULAR_BANK_BRDF_FACTOR_FUNC.name}(vec3 normal, vec3 lightingDir, vec3 viewDir, float shininess) {
	vec3 t = normalize(cross(normal, viewDir));
	float a = dot(lightingDir, t);
	float b = dot(viewDir, t);
	float c = sqrt(1.0 - a * a) * sqrt(1.0 - b * b) - a * b;
	return pow(c, shininess) * max(dot(lightingDir, normal), 0.0);
}
`};

    /**
     * @param normal (vec3).
     * @param lightingDir (vec3) lightPos - vertexPos.
     * @param viewDir (vec3) viewPos - vertexPos.
     * @param shininess (float) default recommend 32.
     */
    export const SPECULAR_BLINN_PHONE_FACTOR_FUNC: ShaderLib = {
        name: `${NAME}_SpecularBlinnPhoneFactor`,
        source: ``
    };

    export const SPECULAR_BLINN_PHONE_FACTOR_HEADER: ShaderLib = {
        name: `${SPECULAR_BLINN_PHONE_FACTOR_FUNC.name}_Header`,
        source: `
float ${SPECULAR_BLINN_PHONE_FACTOR_FUNC.name}(vec3 normal, vec3 lightingDir, vec3 viewDir, float shininess) {
	vec3 h = normalize(lightingDir + viewDir);
	return pow(max(dot(normal, h), 0.0), shininess);
}
`};

    export const VERT_HEADER: ShaderLib = {
        name: `${NAME}_VertHeader`,
        source: `
#ifdef ${ShaderPredefined.LIGHTING}

#include<${General.DECLARE_ATTRIB.name}>(vec3, ${ShaderPredefined.a_Normal0})
#include<${General.DECLARE_UNIFORM.name}>(mat3, ${ShaderPredefined.u_M33_L2W})
#include<${General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_WorldNormal0})

 #if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_POINT} || ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_SPOT} || defined(${ShaderPredefined.LIGHTING_SPECULAR})
    #include<${General.DECLARE_UNIFORM.name}>(mat4, ${ShaderPredefined.u_M44_L2W})
    #include<${General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_WorldPos0})
#endif

#endif
`}

    export const VERT: ShaderLib = {
        name: `${NAME}_Vert`,
        source: `
#ifdef ${ShaderPredefined.LIGHTING}

#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_WorldPos0}
    #ifndef ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.v_WorldPos0}
        #define ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.v_WorldPos0}
        ${ShaderPredefined.v_WorldPos0} = (${ShaderPredefined.u_M44_L2W} * vec4(${ShaderPredefined.a_Position0}, 1.0)).xyz;
    #endif
#endif

#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_WorldNormal0}
    #ifndef ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.v_WorldNormal0}
        #define ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.v_WorldNormal0}
        ${ShaderPredefined.v_WorldNormal0} = ${ShaderPredefined.u_M33_L2W} * ${ShaderPredefined.a_Normal0};
    #endif
#endif

#endif
`}

    export const FRAG_HEADER: ShaderLib = {
        name: `${NAME}_FragHeader`,
        source: `
#ifdef ${ShaderPredefined.LIGHTING}

struct _Light {
    vec3 ambientColor;
    vec3 diffuseColor;
    vec3 specularColor;
    float intensity;
};

#include<${DIFFUSE_FACTOR_HEADER.name}>
#include<${General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_WorldNormal0})

#if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_POINT} || ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_SPOT} || defined(${ShaderPredefined.LIGHTING_SPECULAR})
    #include<${General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_WorldPos0})
#endif

#ifdef ${ShaderPredefined.LIGHTING_SPECULAR}
    #include<${General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_CamPosW})
    #include<${General.DECLARE_UNIFORM.name}>(float, ${ShaderPredefined.u_LighitngSpecularShininess})
    #ifdef ${ShaderPredefined.SPECULAR_TEX}
        #include<${General.DECLARE_UNIFORM.name}>(sampler2D, ${ShaderPredefined.u_SpecularSampler})
    #endif
    #ifdef ${ShaderPredefined.SPECULAR_COLOR}
        #include<${General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_SpecularColor})
    #endif

    #if ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_PHONE}
        #include<${SPECULAR_PHONE_FACTOR_HEADER.name}>
    #elif ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_BANK_BRDF}
        #include<${SPECULAR_BANK_BRDF_FACTOR_HEADER.name}>
    #elif ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_BLINN_PHONE}
        #include<${SPECULAR_BLINN_PHONE_FACTOR_HEADER.name}>
    #endif
#endif

#include<${General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_AmbientColor})
#include<${General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_LightColor0})

#if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_DIRECTION}
    #include<${General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_LightDirW0})
#elif ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_POINT}
    #include<${General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_LightPosW0})
    #include<${General.DECLARE_UNIFORM_ARRAY.name}>(float, ${ShaderPredefined.u_LightAttrib0}, 3)
#elif ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_SPOT}
    #include<${General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_LightDirW0})
    #include<${General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_LightPosW0})
    #include<${General.DECLARE_UNIFORM_ARRAY.name}>(float, ${ShaderPredefined.u_LightAttrib0}, 5)
#endif

#endif
`};

    /**
     * @param (vec2) specularTex uv.
     */
    export const FRAG: ShaderLib = {
        name: `${NAME}_Frag`,
        source: `
#ifdef ${ShaderPredefined.LIGHTING}

_Light _lightingInfo;
vec3 _lightingDirW;
_lightingInfo.ambientColor = ${ShaderPredefined.u_AmbientColor};
_lightingInfo.diffuseColor = ${ShaderPredefined.u_LightColor0};

#ifdef ${General.DECLARE_VARYING_DEFINE_PREFIX}${ShaderPredefined.v_WorldNormal0}
    #include<${General.DECLARE_TEMP_VAR.name}>(vec3, ${ShaderPredefined.var_WorldNormal0})
#endif

#ifdef ${ShaderPredefined.LIGHTING_SPECULAR}
    #include<${General.DECLARE_TEMP_VAR.name}>(vec3, ${ShaderPredefined.var_WorldViewDir0})
#endif

#if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_DIRECTION}
    _lightingDirW = -${ShaderPredefined.u_LightDirW0};
    _lightingInfo.intensity = 1.0;
#else
    vec3 lightingDistance = ${ShaderPredefined.u_LightPosW0} - ${ShaderPredefined.v_WorldPos0};
    _lightingDirW = normalize(lightingDistance);

    float dis = length(lightingDistance);
    _lightingInfo.intensity = 1.0 / (${ShaderPredefined.u_LightAttrib0}[0] + ${ShaderPredefined.u_LightAttrib0}[1] * dis + ${ShaderPredefined.u_LightAttrib0}[2] * dis * dis);

    #if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_SPOT}
        float theta = max(0.0, dot(-_lightingDirW, ${ShaderPredefined.u_LightDirW0}));
        if (_lightingInfo.intensity > 0.0 && theta <= ${ShaderPredefined.u_LightAttrib0}[3]) {
            _lightingInfo.intensity = 0.0;
        } else {
            _lightingInfo.intensity *= pow(theta, ${ShaderPredefined.u_LightAttrib0}[4]);
        }
    #endif
#endif

if (_lightingInfo.intensity < 0.00392) {
    _lightingInfo.diffuseColor = vec3(0.0);
    _lightingInfo.specularColor = vec3(0.0);
} else {
    #ifndef ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.var_WorldNormal0}
        #define ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.var_WorldNormal0}
        ${ShaderPredefined.var_WorldNormal0} = normalize(${ShaderPredefined.v_WorldNormal0});
    #endif

    _lightingInfo.diffuseColor *= ${DIFFUSE_FACTOR_FUNC.name}(${ShaderPredefined.var_WorldNormal0}, _lightingDirW);

    #ifdef ${ShaderPredefined.LIGHTING_SPECULAR}
        #ifndef ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.var_WorldViewDir0}
            #define ${General.ASSIGNMENT_PREFIX}${ShaderPredefined.var_WorldViewDir0}
            ${ShaderPredefined.var_WorldViewDir0} = normalize(${ShaderPredefined.u_CamPosW} - ${ShaderPredefined.v_WorldPos0});
        #endif

        #if ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_PHONE}
            _lightingInfo.specularColor = vec3(${SPECULAR_PHONE_FACTOR_FUNC.name}(${ShaderPredefined.var_WorldNormal0}, _lightingDirW, ${ShaderPredefined.var_WorldViewDir0}, _lightingInfo.diffuseFactor, ${ShaderPredefined.u_LighitngSpecularShininess}));
        #elif ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_BANK_BRDF}
            _lightingInfo.specularColor = vec3(${SPECULAR_BANK_BRDF_FACTOR_FUNC.name}(${ShaderPredefined.var_WorldNormal0}, _lightingDirW, ${ShaderPredefined.var_WorldViewDir0}, ${ShaderPredefined.u_LighitngSpecularShininess}));
        #elif ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_BLINN_PHONE}
            _lightingInfo.specularColor = vec3(${SPECULAR_BLINN_PHONE_FACTOR_FUNC.name}(${ShaderPredefined.var_WorldNormal0}, _lightingDirW, ${ShaderPredefined.var_WorldViewDir0}, ${ShaderPredefined.u_LighitngSpecularShininess}));
        #else
            _lightingInfo.specularColor = vec3(0.0);
        #endif

        #ifdef ${ShaderPredefined.SPECULAR_TEX}
            _lightingInfo.specularColor *= texture2D(${ShaderPredefined.u_DiffuseSampler}, \${0}).xyz;
        #endif

        #ifdef ${ShaderPredefined.SPECULAR_COLOR}
            _lightingInfo.specularColor *= ${ShaderPredefined.u_SpecularColor};
        #endif
    #endif
}

#endif
`};

    export const DIFFUSE_FACTOR_SOURCES: ShaderLib[] = [DIFFUSE_FACTOR_HEADER, DIFFUSE_FACTOR_FUNC];
    export const SPECULAR_PHONE_FACTOR_SOURCES: ShaderLib[] = [SPECULAR_PHONE_FACTOR_HEADER, SPECULAR_PHONE_FACTOR_FUNC];
    export const SPECULAR_BANK_BRDF_FACTOR_SOURCES: ShaderLib[] = [SPECULAR_BANK_BRDF_FACTOR_HEADER, SPECULAR_BANK_BRDF_FACTOR_FUNC];
    export const SPECULAR_BLINN_PHONE_FACTOR_SOURCES: ShaderLib[] = [SPECULAR_BLINN_PHONE_FACTOR_HEADER, SPECULAR_BLINN_PHONE_FACTOR_FUNC];

    export const SOURCES: ShaderLib[] = DIFFUSE_FACTOR_SOURCES.
        concat(SPECULAR_PHONE_FACTOR_SOURCES).
        concat(SPECULAR_BANK_BRDF_FACTOR_SOURCES).
        concat(SPECULAR_BLINN_PHONE_FACTOR_SOURCES).
        concat(VERT_HEADER, VERT, FRAG_HEADER, FRAG);
}