/// <reference path="../../ShaderPredefined.ts" />

namespace MITOIA.BuiltinShader.Lib {
    /**
     * @param normal (vec3).
     * @param lightingDir (vec3) lightPos - vertexPos.
     */
    export const LIGHTING_DIFFUSE_FACTOR_FUNC: ShaderLib = {
        name: "_Lighting_DiffuseFactor",
        source: ``
    };

    export const LIGHTING_DIFFUSE_FACTOR_HEADER: ShaderLib = {
        name: `${LIGHTING_DIFFUSE_FACTOR_FUNC.name}_Header`,
        source: `
float ${LIGHTING_DIFFUSE_FACTOR_FUNC.name}(vec3 normal, vec3 lightingDir) {
	return max(dot(normal, lightingDir), 0.0);
}
`};

    /**
     * @param normal (vec3).
     * @param lightingDir (vec3) vertexPos - lightPos.
     * @param viewDir (vec3) vertexPos - viewPos.
     * @param diffuseFactor (float).
     * @param shininess (float) default recommend 32.
     */
    export const LIGHTING_SPECULAR_PHONE_FACTOR_FUNC: ShaderLib = {
        name: "_Lighting_SpecularPhoneFactor",
        source: ``
    }; 

    export const LIGHTING_SPECULAR_PHONE_FACTOR_HEADER: ShaderLib = {
        name: `${LIGHTING_SPECULAR_PHONE_FACTOR_FUNC.name}_Header`,
        source: `
float ${LIGHTING_SPECULAR_PHONE_FACTOR_FUNC.name}(vec3 normal, vec3 lightingDir, vec3 viewDir, float diffuseFactor, float shininess) {
    float df2 = diffuseFactor * diffuseFactor;
    vec3 r = normalize((df2 + df2) * normal - lightingDir);
    return pow(max(dot(viewDir, r), 0.0), shininess);
}
`};

    /**
     * @param normal (vec3).
     * @param lightingDir (vec3) vertexPos - lightPos.
     * @param viewDir (vec3) vertexPos - viewPos.
     * @param shininess (float) default recommend 32.
     */
    export const LIGHTING_SPECULAR_BANK_BRDF_FACTOR_FUNC: ShaderLib = {
        name: "_Lighting_SpecularBankBRDFFactor",
        source: ``
    };

    export const LIGHTING_SPECULAR_BANK_BRDF_FACTOR_HEADER: ShaderLib = {
        name: `${LIGHTING_SPECULAR_BANK_BRDF_FACTOR_FUNC.name}_Header`,
        source: `
float ${LIGHTING_SPECULAR_BANK_BRDF_FACTOR_FUNC.name}(vec3 normal, vec3 lightingDir, vec3 viewDir, float shininess) {
	vec3 t = normalize(cross(normal, viewDir));
	float a = dot(lightingDir, t);
	float b = dot(viewDir, t);
	float c = sqrt(1.0 - a * a) * sqrt(1.0 - b * b) - a * b;
	return pow(c, shininess) * max(dot(lightingDir, normal), 0.0);
}
`};

    /**
     * @param normal (vec3).
     * @param lightingDir (vec3) vertexPos - lightPos.
     * @param viewDir (vec3) vertexPos - viewPos.
     * @param shininess (float) default recommend 32.
     */
    export const LIGHTING_SPECULAR_BLINN_PHONE_FACTOR_FUNC: ShaderLib = {
        name: "_Lighting_SpecularBlinnPhoneFactor",
        source: ``
    };

    export const LIGHTING_SPECULAR_BLINN_PHONE_FACTOR_HEADER: ShaderLib = {
        name: `${LIGHTING_SPECULAR_BLINN_PHONE_FACTOR_FUNC.name}_Header`,
        source: `
float ${LIGHTING_SPECULAR_BLINN_PHONE_FACTOR_FUNC.name}(vec3 normal, vec3 lightingDir, vec3 viewDir, float shininess) {
	vec3 h = normalize(lightingDir + viewDir);
	return pow(max(dot(normal, h), 0.0), shininess);
}
`};

    export const LIGHTING_HEADER: ShaderLib = {
        name: "_Light_Header",
        source: `
struct _Light {
    vec3 color;
    float intensity;
    vec3 specularColor;
};
#include<${LIGHTING_DIFFUSE_FACTOR_HEADER.name}>
#include<${BuiltinShader.General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_NormalW})

#if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_POINT} || ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_SPOT} || ${ShaderPredefined.LIGHTING_SPECULAR} != ${ShaderPredefined.LIGHTING_SPECULAR_NONE}
#include<${BuiltinShader.General.DECLARE_VARYING.name}>(vec3, ${ShaderPredefined.v_PosW})
#endif

#if ${ShaderPredefined.LIGHTING_SPECULAR} != ${ShaderPredefined.LIGHTING_SPECULAR_NONE}
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_CamPosW})
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(float, ${ShaderPredefined.u_LighitngSpecularShininess})
    #ifdef ${ShaderPredefined.SPECULAR_TEX}
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(sampler2D, ${ShaderPredefined.s_SpecularSampler})
    #endif
    #ifdef ${ShaderPredefined.SPECULAR_COLOR}
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_SpecularColor})
    #endif
#endif

#if ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_PHONE}
#include<${LIGHTING_SPECULAR_PHONE_FACTOR_HEADER.name}>
#elif ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_BANK_BRDF}
#include<${LIGHTING_SPECULAR_BANK_BRDF_FACTOR_HEADER.name}>
#elif ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_BLINN_PHONE}
#include<${LIGHTING_SPECULAR_BLINN_PHONE_FACTOR_HEADER.name}>
#endif

#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_LightColor0})

#if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_DIRECTION}
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_LightDirW0})
#elif ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_POINT}
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_LightPosW0})
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(vec4, ${ShaderPredefined.u_LightAttrib0})
#elif ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_SPOT}
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_LightDirW0})
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(vec3, ${ShaderPredefined.u_LightPosW0})
#include<${BuiltinShader.General.DECLARE_UNIFORM.name}>(vec4, ${ShaderPredefined.u_LightAttrib0})
#endif
`};

    /**
     * @param (vec2) specularTex uv.
     */
    export const LIGHTING_FRAG: ShaderLib = {
        name: "_Light_Frag",
        source: `
_Light _lightingInfo;
vec3 _lightingDirW;
_lightingInfo.color = ${ShaderPredefined.u_LightColor0};

#if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_DIRECTION}
_lightingDirW = ${ShaderPredefined.u_LightDirW0};
_lightingInfo.intensity = 1.0;
#else
vec3 lightingDistance = ${ShaderPredefined.v_PosW} - ${ShaderPredefined.u_LightPosW0};
_lightingDirW = normalize(lightingDistance);
if (${ShaderPredefined.u_LightAttrib0}.x < 0.0) {
    _lightingInfo.intensity = 1.0;
} else if (${ShaderPredefined.u_LightAttrib0}.x == 0.0) {
    _lightingInfo.intensity = 0.0;
} else {
    _lightingInfo.intensity = max(1.0 - length(lightingDistance) / ${ShaderPredefined.u_LightAttrib0}.x, 0.0);
}

    #if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_SPOT}
if (_lightingInfo.intensity > 0.0 && dot(_lightingDirW, ${ShaderPredefined.u_LightDirW0}) < ${ShaderPredefined.u_LightAttrib0}.y) {
    _lightingInfo.intensity = 0.0;
}
    #endif
#endif

if (_lightingInfo.intensity == 0.0) {
    _lightingInfo.color = vec3(0.0);
    _lightingInfo.specularColor = vec3(0.0);
} else {
    vec3 nrm = normalize(${ShaderPredefined.v_NormalW});
    _lightingInfo.color *= ${LIGHTING_DIFFUSE_FACTOR_FUNC.name}(nrm, _lightingDirW);

#if ${ShaderPredefined.LIGHTING_SPECULAR} != ${ShaderPredefined.LIGHTING_SPECULAR_NONE}
    vec3 viewDirW = normalize(${ShaderPredefined.v_PosW} - ${ShaderPredefined.u_CamPosW});
#endif

#if ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_NONE}
    _lightingInfo.specularColor = vec3(0.0);
#elif ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_PHONE}
    _lightingInfo.specularColor = vec3(${LIGHTING_SPECULAR_PHONE_FACTOR_FUNC.name}(nrm, _lightingDirW, viewDirW, _lightingInfo.diffuseFactor, ${ShaderPredefined.u_LighitngSpecularShininess}));
#elif ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_BANK_BRDF}
    _lightingInfo.specularColor = vec3(${LIGHTING_SPECULAR_BANK_BRDF_FACTOR_FUNC.name}(nrm, _lightingDirW, viewDirW, ${ShaderPredefined.u_LighitngSpecularShininess}));
#elif ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_BLINN_PHONE}
    _lightingInfo.specularColor = vec3(${LIGHTING_SPECULAR_BLINN_PHONE_FACTOR_FUNC.name}(nrm, _lightingDirW, viewDirW, ${ShaderPredefined.u_LighitngSpecularShininess}));
#endif

#if ${ShaderPredefined.LIGHTING_SPECULAR} != ${ShaderPredefined.LIGHTING_SPECULAR_NONE}
    #ifdef ${ShaderPredefined.SPECULAR_TEX}
    _lightingInfo.specularColor *= texture2D(${ShaderPredefined.s_DiffuseSampler}, \${0}).xyz;
    #endif
    #ifdef ${ShaderPredefined.SPECULAR_COLOR}
    _lightingInfo.specularColor *= ${ShaderPredefined.u_SpecularColor};
    #endif
#endif
}
`};

    export const LIGHTING_DIFFUSE_FACTOR_SOURCES: ShaderLib[] = [LIGHTING_DIFFUSE_FACTOR_HEADER, LIGHTING_DIFFUSE_FACTOR_FUNC];
    export const LIGHTING_SPECULAR_PHONE_FACTOR_SOURCES: ShaderLib[] = [LIGHTING_SPECULAR_PHONE_FACTOR_HEADER, LIGHTING_SPECULAR_PHONE_FACTOR_FUNC];
    export const LIGHTING_SPECULAR_BANK_BRDF_FACTOR_SOURCES: ShaderLib[] = [LIGHTING_SPECULAR_BANK_BRDF_FACTOR_HEADER, LIGHTING_SPECULAR_BANK_BRDF_FACTOR_FUNC];
    export const LIGHTING_SPECULAR_BLINN_PHONE_FACTOR_SOURCES: ShaderLib[] = [LIGHTING_SPECULAR_BLINN_PHONE_FACTOR_HEADER, LIGHTING_SPECULAR_BLINN_PHONE_FACTOR_FUNC];

    export const LIGHTING_SOURCES: ShaderLib[] = LIGHTING_DIFFUSE_FACTOR_SOURCES.
        concat(LIGHTING_SPECULAR_PHONE_FACTOR_SOURCES).
        concat(LIGHTING_SPECULAR_BANK_BRDF_FACTOR_SOURCES).
        concat(LIGHTING_SPECULAR_BLINN_PHONE_FACTOR_SOURCES).
        concat(LIGHTING_HEADER, LIGHTING_FRAG);
}