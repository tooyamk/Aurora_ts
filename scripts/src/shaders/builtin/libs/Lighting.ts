namespace MITOIA.BuiltinShader.Lib {
    export const LIGHTING_DIFFUSE_FACTOR_HEADER: ShaderLib = {
        name: "_Lighting_DiffuseFactor_Header",
        source: `
float _Lighting_DiffuseFactor(vec3 normal, vec3 lightingDir) {
	return max(dot(normal, lightingDir), 0.0);
}
`};

    /**
     * @param normal (vec3).
     * @param lightingDir (vec3) lightPos - vertexPos.
     */
    export const LIGHTING_DIFFUSE_FACTOR_FUNC: ShaderLib = {
        name: "_Lighting_DiffuseFactor",
        source: ``};

    export const LIGHTING_SPECULAR_PHONE_FACTOR_HEADER: ShaderLib = {
        name: "_Lighting_SpecularPhoneFactor_Header",
        source: `
float _Lighting_SpecularPhoneFactor(vec3 normal, vec3 lightingDir, vec3 viewDir, float diffuseFactor, float shininess) {
    float df2 = diffuseFactor * diffuseFactor;
    vec3 r = normalize((df2 + df2) * normal - lightingDir);
    return pow(max(dot(viewDir, r), 0.0), shininess);
}
`};

    /**
     * @param normal (vec3).
     * @param lightingDir (vec3) lightPos - vertexPos.
     * @param viewDir (vec3) viewPos - vertexPos.
     * @param diffuseFactor (float).
     * @param shininess (float) default recommend 32.
     */
    export const LIGHTING_SPECULAR_PHONE_FACTOR_FUNC: ShaderLib = {
        name: "_Lighting_SpecularPhoneFactor",
        source: ``}; 

    export const LIGHTING_HEADER: ShaderLib = {
        name: "_Light_Header",
        source: `
struct _Light {
    vec3 color;
    vec3 dirW;
    float diffuseFactor;
    float specularFactor;
};
#include<${LIGHTING_DIFFUSE_FACTOR_HEADER.name}>
#if ${ShaderPredefined.LIGHTING_SPECULAR} != ${ShaderPredefined.LIGHTING_SPECULAR_NONE}
uniform float ${ShaderPredefined.u_LighitngSpecularShininess};
#endif
#if ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_PHONE}
#include<${LIGHTING_SPECULAR_PHONE_FACTOR_HEADER.name}>
#endif
`};

    export const LIGHTING_FRAG: ShaderLib = {
        name: "_Light_Frag",
        source: `
_Light _lightingInfo;
_lightingInfo.color = ${ShaderPredefined.u_LightAtrrib0}[0].xyz;
#if ${ShaderPredefined.LIGHT_TYPE0} == ${ShaderPredefined.LIGHT_TYPE_DIRECTION}
_lightingInfo.dirW = ${ShaderPredefined.u_LightAtrrib0}[1].xyz;
#endif

_lightingInfo.diffuseFactor = ${BuiltinShader.Lib.LIGHTING_DIFFUSE_FACTOR_FUNC.name}(v_nrmW, _lightingInfo.dirW);

#if ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_NONE}
_lightingInfo.specularFactor = 0.0;
#elif ${ShaderPredefined.LIGHTING_SPECULAR} == ${ShaderPredefined.LIGHTING_SPECULAR_PHONE}
_lightingInfo.specularFactor = ${BuiltinShader.Lib.LIGHTING_SPECULAR_PHONE_FACTOR_FUNC.name}(v_nrmW, _lightingInfo.dirW, v_viewDirW, _lightingInfo.diffuseFactor, ${ShaderPredefined.u_LighitngSpecularShininess});
#endif
`};

    export const LIGHTING_DIFFUSE_FACTOR_SOURCES: ShaderLib[] = [LIGHTING_DIFFUSE_FACTOR_HEADER, LIGHTING_DIFFUSE_FACTOR_FUNC];
    export const LIGHTING_SPECULAR_PHONE_FACTOR_SOURCES: ShaderLib[] = [LIGHTING_SPECULAR_PHONE_FACTOR_HEADER, LIGHTING_SPECULAR_PHONE_FACTOR_FUNC];

    export const LIGHTING_SOURCES: ShaderLib[] = LIGHTING_DIFFUSE_FACTOR_SOURCES.
    concat(LIGHTING_SPECULAR_PHONE_FACTOR_SOURCES).
    concat(LIGHTING_HEADER, LIGHTING_FRAG);
}